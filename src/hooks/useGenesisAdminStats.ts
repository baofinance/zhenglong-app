import { useReadContract } from "wagmi";
import { CONTRACTS, GENESIS_ABI, ERC20_ABI } from "../config/contracts";

export function useGenesisStatus() {
  const { data: genesisEnded } = useReadContract({
    address: CONTRACTS.GENESIS as `0x${string}`,
    abi: GENESIS_ABI,
    functionName: "genesisIsEnded",
  });

  const { data: totalCollateral } = useReadContract({
    address: CONTRACTS.WSTETH as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [CONTRACTS.GENESIS as `0x${string}`], // Genesis contract holds all collateral
  });

  return {
    isActive: !genesisEnded,
    isEnded: genesisEnded,
    totalCollateral: totalCollateral || 0n,
    status: genesisEnded ? "ENDED" : "ACTIVE",
  };
}
