"use client";

import { usePools } from "@/hooks/usePools";
import { useMemo, useState, Fragment } from "react";
import Dropdown from "@/components/Dropdown";
import Image from "next/image";
import TokenIcon from "@/components/TokenIcon";
import { usePoolData } from "@/hooks/usePoolData";
import { useAccount } from "wagmi";

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
      className="transition hover:bg-grey-light/20 cursor-pointer"
      onClick={() =>
        (window.location.href = `/earn/${pool.marketId}/${pool.poolType}`)
      }
    >
      <td className="py-4 px-8 whitespace-nowrap">
        <div className="flex items-center gap-4">
          <div className="flex w-12 items-center justify-center">
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
                  className={`rounded-full border-1 antialiased border-white ${
                    index > 0 ? "-ml-4" : ""
                  }`}
                />
              ))}
          </div>
          <div className="flex flex-col items-start gap-1">
            <span className="text-xl font-bold text-white">{pool.name}</span>
            <div className="text-xs text-white/60">
              <span>{pool.groupName}</span>
              {pool.groupSubText && (
                <span className="ml-1">{pool.groupSubText}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1 backdrop-blur-sm">
                <Image
                  src={pool.chainIcon}
                  alt={pool.chain}
                  width={14}
                  height={14}
                  className="rounded-full"
                />
                <span className="text-xs text-[#A3A3A3]">{pool.chain}</span>
              </div>
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#A3A3A3] backdrop-blur-sm">
                {pool.type}{" "}
                {pool.leverageRatio && (
                  <span className="font-bold text-white ml-1">
                    • {(Number(pool.leverageRatio) / 1e18).toFixed(0)}×
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </td>
      <td className="py-4 px-6 text-right font-mono">
        {baseAPR} + {boostAPR}
      </td>
      <td className="py-4 px-6 text-right font-mono">
        {formatAmount(pool.rewards)}
      </td>
      <td className="py-4 px-6 text-right font-mono">
        ${pool.tvlUSD.toFixed(2)}
      </td>
    </tr>
  );
}

export default function Earn() {
  const { getAllPools } = usePools();
  const allPools = getAllPools();
  const { isConnected } = useAccount();

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

  return (
    <div className="min-h-screen text-[#F5F5F5] max-w-[1500px] mx-auto font-sans relative">
      <main className="container mx-auto px-4 sm:px-10 pt-32 pb-20 relative z-10">
        <div className="text-center mb-12">
          <h1 className={`text-4xl text-white`}>EARN</h1>
          <p className="text-[#F5F5F5]/60 text-sm mt-2">
            Deposit into stability or liquidity pools to earn STEAM and other
            rewards. Boost rewards by staking STEAM.
          </p>
        </div>

        <div className="flex justify-end items-center gap-4 mb-6">
          <div className="relative w-48">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4">
              <svg
                className="h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search..."
              className="bg-neutral-800 text-white rounded-2xl h-12 w-full pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-green-400/50 transition-shadow duration-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dropdown
            options={filterOptions}
            value={filterType}
            onChange={(value) =>
              setFilterType(value as "all" | "Collateral" | "Leveraged")
            }
            trigger={
              <button className="bg-neutral-800 text-white rounded-2xl h-12 w-12 flex items-center justify-center hover:bg-neutral-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400">
                <svg
                  className="h-6 w-6 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 4h18M7 12h10m-7 8h4"
                  />
                </svg>
              </button>
            }
          />
        </div>

        <div className="space-y-12">
          <div className="shadow-lg rounded-2xl outline outline-1 outline-grey-light overflow-x-auto">
            {groupedPools.length > 0 ? (
              <table className="min-w-full text-left table-fixed">
                <thead>
                  <tr className="border-b border-white/10 text-[#A3A3A3] text-sm">
                    <th className="py-4 px-8 font-normal">Pool</th>
                    <th className="w-40 py-3 px-6 text-right font-normal">
                      APR
                    </th>
                    <th className="w-40 py-3 px-6 text-right font-normal">
                      Rewards
                    </th>
                    <th className="w-48 py-3 px-6 text-right font-normal">
                      Deposits
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groupedPools.map(([groupName, poolsInGroup], groupIndex) => (
                    <Fragment key={groupName}>
                      <tr>
                        <td
                          colSpan={4}
                          className={`px-8 ${groupIndex > 0 ? "pt-8" : "pt-4"}`}
                        >
                          <h2 className="text-2xl font-bold text-white mb-4">
                            {groupName}
                          </h2>
                        </td>
                      </tr>
                      {poolsInGroup.map((pool) => (
                        <PoolRow
                          key={pool.id}
                          pool={pool}
                          formatAmount={formatAmount}
                          formatAPRBreakdown={formatAPRBreakdown}
                        />
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-20">
                <p className="text-white/60">No pools found.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
