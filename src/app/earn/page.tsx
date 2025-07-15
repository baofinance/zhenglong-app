"use client";

import { useAccount, useContractReads } from "wagmi";
import { usePools } from "@/hooks/usePools";
import Navigation from "@/components/Navigation";
import { useMemo, useState } from "react";
import CustomFilterDropdown from "@/components/CustomFilterDropdown";
import Image from "next/image";
import TokenIcon from "@/components/TokenIcon";

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

// ABIs
const stabilityPoolABI = [
  {
    inputs: [],
    name: "totalAssetSupply",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "assetBalanceOf",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const rewardsABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "getClaimableRewards",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const aprABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "getAPRBreakdown",
    outputs: [
      { name: "collateralTokenAPR", type: "uint256" },
      { name: "steamTokenAPR", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const erc20ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const minterABI = [
  {
    inputs: [],
    name: "peggedTokenPrice",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Pool Row Component
interface PoolRowProps {
  pool: any;
  poolIndex: number;
  poolsData: any;
  rewardsData: any;
  aprBreakdownData: any;
  pricesData: any;
  formatAmount: (value: bigint | undefined) => string;
  formatAPRBreakdown: (breakdown: any) => { collateral: string; steam: string };
}

function PoolRow({
  pool,
  poolIndex,
  poolsData,
  rewardsData,
  aprBreakdownData,
  pricesData,
  formatAmount,
  formatAPRBreakdown,
}: PoolRowProps) {
  const aprBreakdown = aprBreakdownData?.[poolIndex]?.result;
  const { collateral: baseAPR, steam: boostAPR } = formatAPRBreakdown(
    aprBreakdown
      ? {
          collateralTokenAPR: aprBreakdown[0],
          steamTokenAPR: aprBreakdown[1],
        }
      : undefined
  );

  const tvl = poolsData?.[poolIndex]?.result;
  const price = pricesData?.[poolIndex]?.result;
  const tvlUSD = tvl && price ? (Number(tvl) * Number(price)) / 1e36 : 0;

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
                {pool.leverage && (
                  <span className="font-bold text-white ml-1">
                    • {pool.leverage}×
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
        {formatAmount(rewardsData?.[poolIndex]?.result)}
      </td>
      <td className="py-4 px-6 text-right font-mono">${tvlUSD.toFixed(2)}</td>
    </tr>
  );
}

export default function Earn() {
  const { address } = useAccount();
  const { getAllPools, getMarketByPool } = usePools();
  const allPools = getAllPools();

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

  const groupedPools = useMemo(() => {
    const groups: Record<string, typeof filteredPools> = {};
    for (const pool of filteredPools) {
      if (!groups[pool.groupName]) {
        groups[pool.groupName] = [];
      }
      groups[pool.groupName].push(pool);
    }
    return Object.entries(groups);
  }, [filteredPools]);

  const contracts = useMemo(
    () =>
      filteredPools.map((pool) => ({
        address: pool.address,
        abi: stabilityPoolABI,
        functionName: "totalAssetSupply",
      })),
    [filteredPools]
  );

  const rewardsContracts = useMemo(
    () =>
      filteredPools.map((pool) => ({
        address: pool.address,
        abi: rewardsABI,
        functionName: "getClaimableRewards",
        args: [address ?? "0x0"],
      })),
    [filteredPools, address]
  );

  const aprContracts = useMemo(
    () =>
      filteredPools.map((pool) => ({
        address: pool.address,
        abi: aprABI,
        functionName: "getAPRBreakdown",
        args: [address ?? "0x0000000000000000000000000000000000000000"],
      })),
    [filteredPools, address]
  );

  const priceContracts = useMemo(
    () =>
      filteredPools.map((pool) => {
        const market = getMarketByPool(pool.address);
        return {
          address: market?.addresses.minter as `0x${string}`,
          abi: minterABI,
          functionName: "peggedTokenPrice",
        };
      }),
    [filteredPools, getMarketByPool]
  );

  const { data: poolsData } = useContractReads({ contracts });
  const { data: rewardsData } = useContractReads({
    contracts: rewardsContracts,
  });
  const { data: aprBreakdownData } = useContractReads({
    contracts: aprContracts,
  });
  const { data: pricesData } = useContractReads({
    contracts: priceContracts,
  });

  // Format helpers
  const formatAmount = (value: bigint | undefined) => {
    if (!value) return "0.00";
    return (Number(value) / 1e18).toFixed(4);
  };

  const formatAPRBreakdown = (
    breakdown: { collateralTokenAPR: bigint; steamTokenAPR: bigint } | undefined
  ) => {
    if (!breakdown) return { collateral: "0%", steam: "0%" };
    return {
      collateral:
        ((Number(breakdown.collateralTokenAPR) / 1e18) * 100).toFixed(2) + "%",
      steam: ((Number(breakdown.steamTokenAPR) / 1e18) * 100).toFixed(2) + "%",
    };
  };

  return (
    <div className="min-h-screen text-[#F5F5F5] max-w-[1300px] mx-auto font-sans relative">
      <Navigation />
      <main className="container mx-auto px-4 sm:px-10 pt-32 pb-20 relative z-10">
        <div className="text-center mb-12">
          <h1 className={`text-4xl text-white`}>EARN</h1>
          <p className="text-[#F5F5F5]/60 text-sm mt-2">
            Deposit into stability or liquidity pools to earn STEAM and other
            rewards. Boost rewards by staking STEAM.
          </p>
        </div>
        <div className="space-y-12">
          <div className="shadow-lg bg-grey-darker overflow-x-auto">
            <div className="p-8 flex gap-8 items-end">
              <div className="flex-grow">
                <label
                  htmlFor="search-pools"
                  className="text-sm text-[#A3A3A3] mb-2 block"
                >
                  Search
                </label>
                <input
                  id="search-pools"
                  type="text"
                  placeholder="Search pools..."
                  className="w-full bg-grey-darkest text-white px-4 py-2 focus:outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-48">
                <CustomFilterDropdown
                  label="Filter"
                  options={filterOptions}
                  value={filterType}
                  onChange={(value) =>
                    setFilterType(value as "all" | "Collateral" | "Leveraged")
                  }
                />
              </div>
            </div>
            {groupedPools.map(([groupName, poolsInGroup], groupIndex) => (
              <div key={groupName} className={groupIndex > 0 ? "pt-8" : ""}>
                <h2 className="text-2xl font-bold text-white mb-4 px-8">
                  {groupName}
                </h2>
                <table className="min-w-full text-left table-fixed">
                  <thead>
                    <tr className="border-b border-white/10 text-[#A3A3A3] text-sm">
                      <th className="py-3 px-8">Pool</th>
                      <th className="w-40 py-3 px-6 text-right">APR</th>
                      <th className="w-40 py-3 px-6 text-right">Rewards</th>
                      <th className="w-48 py-3 px-6 text-right">Deposits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poolsInGroup.map((pool) => {
                      const poolIndex = filteredPools.findIndex(
                        (p) => p.id === pool.id
                      );
                      if (poolIndex === -1) return null;
                      return (
                        <PoolRow
                          key={pool.id}
                          pool={pool}
                          poolIndex={poolIndex}
                          poolsData={poolsData}
                          rewardsData={rewardsData}
                          aprBreakdownData={aprBreakdownData}
                          pricesData={pricesData}
                          formatAmount={formatAmount}
                          formatAPRBreakdown={formatAPRBreakdown}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
