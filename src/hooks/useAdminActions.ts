import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS, GENESIS_ABI } from "../config/contracts";

export function useGenesisAdmin() {
  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const endGenesis = () => {
    writeContract({
      address: CONTRACTS.GENESIS as `0x${string}`,
      abi: GENESIS_ABI,
      functionName: "endGenesis",
    });
  };

  return {
    endGenesis,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}
