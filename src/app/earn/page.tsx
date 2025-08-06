"use client";

import { usePools } from "@/hooks/usePools";
import { useMemo, useState, Fragment } from "react";
import TokenIcon from "@/components/TokenIcon";
import { usePoolData } from "@/hooks/usePoolData";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import Money from "pixelarticons/svg/money.svg";
import Gift from "pixelarticons/svg/gift.svg";
import CheckDouble from "pixelarticons/svg/check-double.svg";
import { rewardsABI } from "@/abis/rewards";
import { erc20ABI } from "@/abis/erc20";
import Image from "next/image";

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

// Pool Row Component
interface PoolRowProps {
  pool: any;
  formatAmount: (value: bigint | undefined) => string;
  formatAPRBreakdown: (breakdown: { collateral: number; steam: number }) => {
    collateral: string;
    steam: string;
  };
}

function PoolRow({ pool, formatAmount, formatAPRBreakdown }: PoolRowProps) {
  const { collateral: baseAPR, steam: boostAPR } = formatAPRBreakdown(
    pool.aprBreakdown
  );

  return (
    <tr
      key={pool.address}
      className="transition hover:bg-grey-light/20 text-md cursor-pointer border-t border-white/10"
      onClick={() =>
        (window.location.href = `/earn/${pool.marketId}/${pool.poolType}`)
      }
    >
      <td className="py-1 px-8 whitespace-nowrap">
        <div className="flex items-center gap-4">
          <div className="flex w-6 items-center justify-center">
            {pool.assetIcons
              .slice()
              .reverse()
              .map((icon: string, index: number) => (
                <TokenIcon
                  key={index}
                  src={icon}
                  alt="token icon"
                  width={32}
                  height={32}
                  className={`rounded-full border-1 antialiased border-white/50 ${
                    index > 0 ? "-ml-3" : ""
                  }`}
                />
              ))}
          </div>
          <div className="flex flex-col items-start gap-1">
            <span className="font-medium ">{pool.name}</span>
            {/* <div className="text-xs text-white/60">
              <span>{pool.groupName}</span>
              {pool.groupSubText && (
                <span className="ml-1">{pool.groupSubText}</span>
              )}
            </div> 
            <div className="flex items-center gap-2 mt-1">
              <div className="inline-flex items-center gap-2-full border border-white/10 bg-white/5 px-2 py-1 backdrop-blur-sm">
                <Image
                  src={pool.chainIcon}
                  alt={pool.chain}
                  width={14}
                  height={14}
                  className="rounded-full"
                />
                <span className="text-xs text-[#A3A3A3]">{pool.chain}</span>
              </div>
            </div>*/}
          </div>
        </div>
      </td>
      <td className="py-1 px-6 text-right">
        <span>{pool.type}</span>
        {pool.leverageRatio && (
          <span className="font-bold text-white ml-1">
            • {(Number(pool.leverageRatio) / 1e18).toFixed(0)}×
          </span>
        )}
      </td>
      <td className="py-3 px-6 text-right">{baseAPR}</td>
      <td className="py-3 px-6 text-right">+ {boostAPR}</td>
      <td className="py-3 px-6 text-right">{formatAmount(pool.rewards)}</td>
      <td className="py-3 px-6 text-right">${pool.tvlUSD.toFixed(2)}</td>
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
    <div className="min-h-screen text-[#F5F5F5] max-w-[1300px] mx-auto font-sans relative">
      <main className="container mx-auto px-4 sm:px-10 pt-[6rem] pb-3 relative z-10">
        <div className="text-center mb-4">
          <h1 className={`text-4xl font-medium font-geo text-left text-white`}>
            EARN
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="bg-zinc-900/50 outline outline-1 outline-white/10 p-4 flex flex-col gap-2">
            <p className="text-[#F5F5F5]/50 text-sm flex items-center gap-2">
              <Image
                src={Money}
                alt="Money"
                className="w-6 h-6 filter invert brightness-0"
              />
              Total Deposited
            </p>
            <p className="text-2xl font-semibold text-white">
              $
              {poolsWithData
                .reduce((acc, pool) => {
                  const deposit = pool.userDeposit
                    ? Number(pool.userDeposit) / 1e18
                    : 0;
                  return acc + deposit;
                }, 0)
                .toFixed(2)}
            </p>
          </div>
          <div className="bg-zinc-900/50 outline outline-1 outline-white/10 p-4 flex flex-col gap-2">
            <p className="text-[#F5F5F5]/50 text-sm flex items-center gap-2">
              <Image
                src={Gift}
                alt="Gift"
                className="w-6 h-6 filter invert brightness-0"
              />
              Total Claimable
            </p>
            <p className="text-2xl font-semibold text-white">
              {poolsWithData
                .reduce((acc, pool) => {
                  const rewards = pool.rewards
                    ? Number(pool.rewards) / 1e18
                    : 0;
                  return acc + rewards;
                }, 0)
                .toFixed(2)}{" "}
              STEAM
            </p>
          </div>
          <div className="lg:col-span-2 bg-zinc-900/50 outline outline-1 outline-white/10 p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <Image
                  src={CheckDouble}
                  alt="CheckDouble"
                  className="w-6 h-6 filter invert brightness-0"
                />
                Quick Actions
              </h3>
              <label
                htmlFor="claimAndStake"
                className="inline-flex relative items-center cursor-pointer"
              >
                <input
                  type="checkbox"
                  id="claimAndStake"
                  className="sr-only peer"
                  checked={claimAndStake}
                  onChange={(e) => setClaimAndStake(e.target.checked)}
                />
                <div className="w-11 h-6 bg-zinc-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4A7C59]"></div>
                <span className="ml-3 text-sm font-medium text-white">
                  Stake rewards
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
              className="w-full py-2 bg-[#4A7C59] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4A7C59]/90 transition-colors"
            >
              {isClaimingAll
                ? "Processing..."
                : claimAndStake
                ? "Claim & Stake All"
                : "Claim All Rewards"}
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {groupedPools.map(([groupName, poolsInGroup]) => (
            <div
              key={groupName}
              className="shadow-lg bg-zinc-900/50 outline pb-2 outline-1 outline-white/10 overflow-x-auto"
            >
              <h2 className="text-2xl font-medium p-6 pb-2 font-geo">
                {groupName}
              </h2>
              {poolsInGroup.length > 0 ? (
                <table className="min-w-full text-left font-geo text-xl table-fixed ">
                  <thead>
                    <tr className="border-b border-white/10 uppercase text-base">
                      <th className="py-4 px-8 font-normal">Pool</th>
                      <th className="w-40 py-3 px-6 text-right font-normal">
                        Type
                      </th>
                      <th className="w-40 py-3 px-6 text-right font-normal">
                        Pool APR
                      </th>
                      <th className="w-40 py-3 px-6 text-right font-normal">
                        Boost APR
                      </th>
                      <th className="w-40 py-3 px-6 text-right font-normal">
                        Rewards
                      </th>
                      <th className="w-48 py-3 px-6 text-right font-normal">
                        TVL
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {poolsInGroup.map((pool) => (
                      <PoolRow
                        key={pool.id}
                        pool={pool}
                        formatAmount={formatAmount}
                        formatAPRBreakdown={formatAPRBreakdown}
                      />
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-20">
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
