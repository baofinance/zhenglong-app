import { useAccount, useReadContract } from "wagmi";
import { contracts, CONTRACTS, GENESIS_ABI } from "../config/contracts";

export function useAdminAccess() {
  const { address } = useAccount();

  // Check if connected wallet is the Genesis owner
  const { data: owner } = useReadContract({
    address: contracts.genesis as `0x${string}`,
    abi: GENESIS_ABI,
    functionName: "owner",
  });

  const isAdmin =
    address && owner && address.toLowerCase() === owner.toLowerCase();

  return { isAdmin, owner };
}
