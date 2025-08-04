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
    <div className="min-h-screen text-[#F5F5F5] max-w-[1300px] mx-auto font-sans relative">
      <main className="container mx-auto px-4 sm:px-10 pt-[6rem] pb-3 relative z-10">
        <div className="text-center mb-4">
          <h1 className={`text-4xl font-medium font-geo text-left text-white`}>
            EARN
          </h1>
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
