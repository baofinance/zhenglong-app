import { useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { markets } from "../config/markets";

const genesisABI = [
  {
    inputs: [{ name: "depositor", type: "address" }],
    name: "balanceOf",
    outputs: [{ type: "uint256", name: "share" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "depositor", type: "address" }],
    name: "claimable",
    outputs: [
      { type: "uint256", name: "peggedAmount" },
      { type: "uint256", name: "leveragedAmount" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "genesisIsEnded",
    outputs: [{ type: "bool", name: "ended" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "receiver", type: "address" }],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "receiver", type: "address" },
      { name: "minCollateralOut", type: "uint256" },
    ],
    name: "withdraw",
    outputs: [{ type: "uint256", name: "collateralOut" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export function useGenesisClaim(marketId: string) {
  const { address } = useAccount();
  const market = (markets as any)[marketId];
  const [lastClaimHash, setLastClaimHash] = useState<string | null>(null);

  const { data: genesisEnded } = useReadContract({
    address: market?.addresses.genesis as `0x${string}`,
    abi: genesisABI,
    functionName: "genesisIsEnded",
    query: { enabled: !!market },
  });

  const { data: userShares } = useReadContract({
    address: market?.addresses.genesis as `0x${string}`,
    abi: genesisABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!market && !!address },
  });

  const { data: claimableAmounts } = useReadContract({
    address: market?.addresses.genesis as `0x${string}`,
    abi: genesisABI,
    functionName: "claimable",
    args: address ? [address] : undefined,
    query: { enabled: !!market && !!address },
  });

  const {
    writeContract: claim,
    isPending,
    data: claimHash,
  } = useWriteContract();

  const { isSuccess: claimSuccess, data: receipt } =
    useWaitForTransactionReceipt({
      hash: claimHash,
    });

  const claimTokens = async () => {
    if (!address || !market) return;

    claim({
      address: market.addresses.genesis as `0x${string}`,
      abi: genesisABI,
      functionName: "claim",
      args: [address],
    });
  };

  const withdrawCollateral = async (minAmount: bigint) => {
    if (!address || !market) return;

    await claim({
      address: market.addresses.genesis as `0x${string}`,
      abi: genesisABI,
      functionName: "withdraw",
      args: [address, minAmount],
    });
  };

  const canClaim = genesisEnded && userShares && userShares > 0n;
  const claimablePegged =
    (claimableAmounts as [bigint, bigint] | undefined)?.[0] || BigInt(0);
  const claimableLeveraged =
    (claimableAmounts as [bigint, bigint] | undefined)?.[1] || BigInt(0);

  return {
    canClaim: !!canClaim,
    genesisEnded: !!genesisEnded,
    userShares: userShares || BigInt(0),
    claimablePegged,
    claimableLeveraged,
    claimTokens,
    withdrawCollateral,
    isPending,
    claimSuccess,
    claimHash,
    market,
  };
}
