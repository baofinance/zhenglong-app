import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useContractRead,
  usePublicClient,
} from "wagmi";
import { BaseError, ContractFunctionRevertedError } from "viem";
import {
  contracts,
  CONTRACTS,
  GENESIS_ABI,
  ERC20_ABI,
} from "../config/contracts";

export interface EndGenesisResult {
  totalCollateral: bigint;
  peggedAmount: bigint;
  leveragedAmount: bigint;
  totalPeggedMinted: bigint;
  totalLeveragedMinted: bigint;
  transactionHash: string;
}

export function useGenesisAdmin() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const publicClient = usePublicClient();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Pre-flight check hooks - use updated contracts
  const { data: genesisEnded } = useContractRead({
    address: contracts.genesis as `0x${string}`,
    abi: GENESIS_ABI,
    functionName: "genesisIsEnded",
  });

  const { data: owner } = useContractRead({
    address: contracts.genesis as `0x${string}`,
    abi: GENESIS_ABI,
    functionName: "owner",
  });

  const { data: totalCollateral } = useContractRead({
    address: contracts.wrappedCollateralToken as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [contracts.genesis as `0x${string}`],
  });

  const endGenesis = async (): Promise<EndGenesisResult> => {
    // 1. Pre-flight checks
    if (genesisEnded) {
      throw new Error("Genesis has already ended");
    }

    if (!address) {
      throw new Error("Wallet not connected");
    }

    if (!owner || owner.toLowerCase() !== address.toLowerCase()) {
      throw new Error("Only the owner can end genesis");
    }

    if (!totalCollateral || totalCollateral === 0n) {
      throw new Error("No collateral has been deposited yet");
    }

    // 2. Get current state before ending
    const peggedAmount = totalCollateral / 2n;
    const leveragedAmount = totalCollateral - peggedAmount;

    // 3. Execute the end genesis transaction
    const txPromise = new Promise<string>((resolve, reject) => {
      writeContract(
        {
          address: contracts.genesis as `0x${string}`,
          abi: GENESIS_ABI,
          functionName: "endGenesis",
        },
        {
          onSuccess: (hash) => resolve(hash),
          onError: (error) => {
            console.error("WriteContract error:", error);

            // Enhanced error handling
            let errorMessage = "Failed to end genesis";

            if (error instanceof BaseError) {
              const revertError = error.walk(
                (err) => err instanceof ContractFunctionRevertedError
              );
              if (revertError instanceof ContractFunctionRevertedError) {
                const errorName = revertError.data?.errorName;
                console.log("Contract revert error name:", errorName);
                console.log("Contract revert data:", revertError.data);

                // Map known errors to user-friendly messages
                switch (errorName) {
                  case "GenesisAlreadyEnded":
                    errorMessage = "Genesis has already ended";
                    break;
                  case "OnlyOwner":
                  case "NotOwner":
                  case "Unauthorized":
                    errorMessage = "Only the contract owner can end genesis";
                    break;
                  case "NoCollateralDeposited":
                  case "ZeroAmount":
                    errorMessage = "No collateral has been deposited yet";
                    break;
                  case "GenesisNotActive":
                  case "InvalidState":
                    errorMessage = "Genesis is not currently active";
                    break;
                  case "InvalidOperation":
                    errorMessage =
                      "This operation is not allowed in the current state";
                    break;
                  case "ContractPaused":
                    errorMessage = "The contract is currently paused";
                    break;
                  case "InsufficientCollateral":
                  case "InsufficientBalance":
                    errorMessage = "Insufficient collateral or balance";
                    break;
                  case "TransferFailed":
                    errorMessage = "Token transfer failed";
                    break;
                  case "AlreadyInitialized":
                    errorMessage = "Contract is already initialized";
                    break;
                  default:
                    errorMessage = `Contract error: ${
                      errorName || "Unknown error"
                    }`;
                }
              } else {
                errorMessage =
                  error.shortMessage || error.message || errorMessage;
              }
            }

            reject(new Error(errorMessage));
          },
        }
      );
    });

    const txHash = await txPromise;

    // Wait for transaction confirmation
    if (!publicClient) {
      throw new Error("Public client not available");
    }

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

    // 4. Get the results after minting - we'll need to refetch these
    // Note: These calls happen after the transaction, so we need fresh reads
    const [totalPeggedMinted, totalLeveragedMinted] = await Promise.all([
      publicClient.readContract({
        address: contracts.genesis as `0x${string}`,
        abi: GENESIS_ABI,
        functionName: "totalPeggedAtGenesisEnd",
      }),
      publicClient.readContract({
        address: contracts.genesis as `0x${string}`,
        abi: GENESIS_ABI,
        functionName: "totalLeveragedAtGenesisEnd",
      }),
    ]);

    return {
      totalCollateral,
      peggedAmount,
      leveragedAmount,
      totalPeggedMinted: totalPeggedMinted as bigint,
      totalLeveragedMinted: totalLeveragedMinted as bigint,
      transactionHash: receipt.transactionHash,
    };
  };

  // Calculate if user can end genesis
  const canEndGenesis = Boolean(
    !genesisEnded &&
      address &&
      owner &&
      owner.toLowerCase() === address.toLowerCase() &&
      totalCollateral &&
      totalCollateral > 0n
  );

  const preflightErrors = [];
  if (genesisEnded) preflightErrors.push("Genesis has already ended");
  if (!address) preflightErrors.push("Wallet not connected");
  if (address && owner && owner.toLowerCase() !== address.toLowerCase()) {
    preflightErrors.push("Only the owner can end genesis");
  }
  if (!totalCollateral || totalCollateral === 0n) {
    preflightErrors.push("No collateral deposited yet");
  }

  return {
    // Enhanced function
    endGenesis,

    // Status checks
    canEndGenesis,
    preflightErrors,
    genesisEnded: Boolean(genesisEnded),
    isOwner: Boolean(
      address && owner && owner.toLowerCase() === address.toLowerCase()
    ),
    totalCollateral: totalCollateral || 0n,

    // Transaction states
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}
