"use client";

import { usePools } from "@/hooks/usePools";
import { useMemo, useState } from "react";
import TokenIcon from "@/components/TokenIcon";
import { usePoolData } from "@/hooks/usePoolData";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { rewardsABI } from "@/abis/rewards";
import { erc20ABI } from "@/abis/erc20";
import { useRouter } from "next/navigation";
import InfoTooltip from "@/components/InfoTooltip";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { Pool } from "@/config/pools";

const steamTokenAddress = "0x5250917C3D42385a4369B2F2f6C4334f590821E1";
const stakingContractAddress = "0x40955B42289c03Ce64B2E152C3a6A2750335466A";

const stakingABI = [
  {
    inputs: [{ type: "uint256", name: "amount" }],
    name: "stake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

// Pool configuration
const POOL_TYPES = {
  collateral: {
    name: "Stability Pool",
    description: "Swaps for wstETH during stability mode",
    symbolKey: "pegged",
  },
  leveraged: {
    name: "Leveraged Pool",
    description: "Swaps for steamedstETH during stability mode",
    symbolKey: "leveraged",
  },
} as const;

// Data-enriched pool type from usePoolData
type PoolWithData = Pool & {
  tvl?: bigint;
  tvlUSD: number;
  userDeposit?: bigint;
  aprBreakdown: { collateral: number; steam: number };
  rewards?: bigint;
  leverageRatio?: bigint;
};

// Pool Row Component
interface PoolRowProps {
  pool: PoolWithData;
  formatAmount: (value: bigint | undefined) => string;
  formatAPRBreakdown: (breakdown: { collateral: number; steam: number }) => {
    collateral: string;
    steam: string;
  };
}

function PoolRow({ pool, formatAmount, formatAPRBreakdown }: PoolRowProps) {
  const router = useRouter();
  const { collateral: baseAPR, steam: boostAPR } = formatAPRBreakdown(
    pool.aprBreakdown
  );

  return (
    <tr
      key={pool.address}
      className="transition hover:bg-white/5 text-sm cursor-pointer border-t border-white/10"
      onClick={() => router.push(`/earn/${pool.marketId}/${pool.poolType}`)}
    >
      <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="flex w-7 items-center justify-center">
            {pool.assetIcons
              .slice()
              .reverse()
              .map((icon: string, index: number) => (
                <TokenIcon
                  key={index}
                  src={icon}
                  alt="token icon"
                  width={28}
                  height={28}
                  className={`rounded-full border border-white/40 ${
                    index > 0 ? "-ml-3" : ""
                  }`}
                />
              ))}
          </div>
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-white/90">{pool.name}</span>
            <span className="text-[11px] text-white/60">
              You: {pool.userDeposit ? formatAmount(pool.userDeposit) : "0.00"}
            </span>
          </div>
        </div>
      </td>
      <td className="py-3 px-3 sm:px-4 text-right">
        <span className="text-white/90">{pool.type}</span>
        {pool.leverageRatio && (
          <span className="font-semibold text-white ml-1">
            • {(Number(pool.leverageRatio) / 1e18).toFixed(0)}×
          </span>
        )}
      </td>
      <td className="py-3 px-3 sm:px-4 text-right text-white/90">{baseAPR}</td>
      <td className="py-3 px-3 sm:px-4 text-right text-white/90">{boostAPR}</td>
      <td className="py-3 px-3 sm:px-4 text-right text-white/90">
        {formatAmount(pool.rewards)}
      </td>
      <td className="py-3 px-3 sm:px-4 text-right text-white font-mono">
        ${pool.tvlUSD.toFixed(2)}
      </td>
    </tr>
  );
}

export default function Earn() {
  const { getAllPools } = usePools();
  const allPools = getAllPools();
  const { isConnected, address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [isClaimingAll, setIsClaimingAll] = useState(false);
  const [claimAndStake, setClaimAndStake] = useState(false);
  const publicClient = usePublicClient();
  const { formatFiat } = useCurrency();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "Collateral" | "Leveraged"
  >("all");

  const filterOptions = [
    { value: "all", label: "All Pools" },
    { value: "Collateral", label: "Collateral" },
    { value: "Leveraged", label: "Leveraged" },
  ];

  const filteredPools = useMemo(() => {
    return allPools
      .filter((pool) =>
        filterType === "all" ? true : pool.type === filterType
      )
      .filter(
        (pool) =>
          pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pool.groupName.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [allPools, searchTerm, filterType]);

  const { poolData: poolsWithData } = usePoolData(filteredPools);

  const groupedPools = useMemo(() => {
    const groups: Record<string, typeof poolsWithData> = {};
    for (const pool of poolsWithData) {
      if (!groups[pool.groupName]) {
        groups[pool.groupName] = [];
      }
      groups[pool.groupName].push(pool);
    }
    return Object.entries(groups);
  }, [poolsWithData]);

  const headerCounts = useMemo(() => {
    const totals = { total: allPools.length, collateral: 0, leveraged: 0 };
    for (const p of allPools) {
      if (p.type === "Collateral") totals.collateral++;
      else if (p.type === "Leveraged") totals.leveraged++;
    }
    return totals;
  }, [allPools]);

  const totalTVL = useMemo(() => {
    return poolsWithData.reduce((acc, p) => acc + (p.tvlUSD || 0), 0);
  }, [poolsWithData]);

  // Format helpers
  const formatAmount = (value: bigint | undefined) => {
    if (!value) return "0.00";
    return (Number(value) / 1e18).toFixed(4);
  };

  const formatAPRBreakdown = (breakdown: {
    collateral: number;
    steam: number;
  }) => {
    if (!breakdown) return { collateral: "0.00%", steam: "0.00%" };
    return {
      collateral: breakdown.collateral.toFixed(2) + "%",
      steam: breakdown.steam.toFixed(2) + "%",
    };
  };

  const handleClaimAll = async () => {
    if (!isConnected || !address) return;

    const poolsWithRewards = poolsWithData.filter(
      (p) => p.rewards && p.rewards > 0n
    );
    if (poolsWithRewards.length === 0) return;

    setIsClaimingAll(true);
    try {
      let totalRewardsToStake = 0n;

      for (const pool of poolsWithRewards) {
        await writeContractAsync({
          address: pool.address,
          abi: rewardsABI,
          functionName: "claimRewards",
        });
        if (claimAndStake && pool.rewards) {
          totalRewardsToStake += pool.rewards;
        }
      }

      if (claimAndStake && totalRewardsToStake > 0n) {
        if (!publicClient) {
          throw new Error("Public client is not available");
        }
        const allowance = await publicClient.readContract({
          address: steamTokenAddress,
          abi: erc20ABI,
          functionName: "allowance",
          args: [address, stakingContractAddress],
        });

        if (allowance < totalRewardsToStake) {
          await writeContractAsync({
            address: steamTokenAddress,
            abi: erc20ABI,
            functionName: "approve",
            args: [stakingContractAddress, totalRewardsToStake],
          });
        }

        await writeContractAsync({
          address: stakingContractAddress,
          abi: stakingABI,
          functionName: "stake",
          args: [totalRewardsToStake],
        });
      }
    } catch (error) {
      console.error("Failed to claim all rewards:", error);
    } finally {
      setIsClaimingAll(false);
    }
  };

  return (
    <div className="min-h-screen text-[#F5F5F5] max-w-[1300px] mx-auto font-sans relative px-4 sm:px-10">
      <main className="container mx-auto max-w-full pb-4 relative z-10">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-semibold font-mono text-white">
                Earn
              </h1>
              <InfoTooltip
                label="Deposit into stability or leveraged pools to earn rewards."
                side="top"
              />
            </div>
            <div className="text-xs text-white/60">
              {headerCounts.total} pools
            </div>
          </div>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="outline outline-1 outline-white/10 rounded-sm p-3">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold font-mono text-white">Total TVL</h3>
              <InfoTooltip
                label="Total value locked across all pools."
                side="top"
              />
            </div>
            <div className="text-white font-mono text-lg">
              {formatFiat(totalTVL)}
            </div>
          </div>
          <div className="outline outline-1 outline-white/10 rounded-sm p-3">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold font-mono text-white">
                Your Deposited
              </h3>
              <InfoTooltip
                label="Sum of your deposits across pools (units)."
                side="top"
              />
            </div>
            <div className="text-white font-mono text-lg">
              {poolsWithData
                .reduce((acc, pool) => {
                  const deposit = pool.userDeposit
                    ? Number(pool.userDeposit) / 1e18
                    : 0;
                  return acc + deposit;
                }, 0)
                .toFixed(2)}
            </div>
          </div>
          <div className="outline outline-1 outline-white/10 rounded-sm p-3">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold font-mono text-white">
                Your Claimable
              </h3>
              <InfoTooltip
                label="Unclaimed rewards across pools (STEAM)."
                side="top"
              />
            </div>
            <div className="text-white font-mono text-lg">
              {poolsWithData
                .reduce((acc, pool) => {
                  const rewards = pool.rewards
                    ? Number(pool.rewards) / 1e18
                    : 0;
                  return acc + rewards;
                }, 0)
                .toFixed(2)}
              <span className="ml-1 text-white/70">STEAM</span>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="outline outline-1 outline-white/10 rounded-sm p-3 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold font-mono text-white">
                Quick Actions
              </h3>
              <InfoTooltip
                label="Claim all rewards, optionally staking them."
                side="top"
              />
            </div>
            <label
              htmlFor="claimAndStake"
              className="inline-flex items-center gap-2 cursor-pointer select-none"
            >
              <span className="text-xs text-white/70">Stake rewards</span>
              <input
                type="checkbox"
                id="claimAndStake"
                className="peer sr-only"
                checked={claimAndStake}
                onChange={(e) => setClaimAndStake(e.target.checked)}
              />
              <span className="relative inline-block h-5 w-9 rounded-full bg-white/10 peer-checked:bg-harbor transition-colors">
                <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
              </span>
            </label>
          </div>
          <button
            onClick={handleClaimAll}
            disabled={
              !isConnected ||
              isClaimingAll ||
              poolsWithData.every((p) => !p.rewards || p.rewards === 0n)
            }
            className="w-full py-2 text-sm rounded-sm outline outline-1 outline-white/10 hover:outline-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isClaimingAll
              ? "Processing..."
              : claimAndStake
              ? "Claim & Stake All"
              : "Claim All Rewards"}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="relative w-full md:max-w-sm">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search pools..."
              className="w-full rounded-sm bg-white/5 outline outline-1 outline-white/10 px-3 py-2 text-sm placeholder-white/40 focus:outline-white/20"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterType(opt.value as typeof filterType)}
                className={`px-3 py-1.5 rounded-sm text-xs outline outline-1 transition-colors ${
                  filterType === opt.value
                    ? "text-white outline-white/80"
                    : "text-white/80 outline-white/10 hover:outline-white/20"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Groups + Table */}
        <div className="space-y-3">
          {groupedPools.map(([groupName, poolsInGroup]) => (
            <div
              key={groupName}
              className="relative bg-transparent outline outline-1 outline-white/10 rounded-sm"
            >
              <div className="flex items-center justify-between px-3 sm:px-4 pt-3 pb-2">
                <h2 className="text-lg font-medium text-white">{groupName}</h2>
                <div className="text-xs text-white/40">
                  {poolsInGroup.length} pools
                </div>
              </div>
              {poolsInGroup.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-t border-b border-white/10 uppercase text-[11px] text-white/70">
                        <th className="py-3 px-3 sm:px-4 font-normal">Pool</th>
                        <th className="w-32 py-3 px-3 sm:px-4 text-right font-normal">
                          Type
                        </th>
                        <th className="w-28 py-3 px-3 sm:px-4 text-right font-normal">
                          Base APR
                        </th>
                        <th className="w-28 py-3 px-3 sm:px-4 text-right font-normal">
                          Boost APR
                        </th>
                        <th className="w-32 py-3 px-3 sm:px-4 text-right font-normal">
                          Rewards
                        </th>
                        <th className="w-40 py-3 px-3 sm:px-4 text-right font-normal">
                          TVL
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {poolsInGroup.map((pool) => (
                        <PoolRow
                          key={pool.id}
                          pool={pool as PoolWithData}
                          formatAmount={formatAmount}
                          formatAPRBreakdown={formatAPRBreakdown}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-white/60">No pools found.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
