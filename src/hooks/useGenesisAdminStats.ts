import { useReadContract } from "wagmi";
import {
  contracts,
  CONTRACTS,
  GENESIS_ABI,
  ERC20_ABI,
} from "../config/contracts";

export function useGenesisStatus() {
  const { data: genesisEnded } = useReadContract({
    address: contracts.genesis as `0x${string}`,
    abi: GENESIS_ABI,
    functionName: "genesisIsEnded",
  });

  const { data: totalCollateral } = useReadContract({
    address: contracts.wrappedCollateralToken as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [contracts.genesis as `0x${string}`], // Genesis contract holds all collateral
  });

  return {
    isActive: !genesisEnded,
    isEnded: genesisEnded,
    totalCollateral: totalCollateral || 0n,
    status: genesisEnded ? "ENDED" : "ACTIVE",
  };
}
