"use client";

import { useAccount, useContractReads } from "wagmi";
import { usePools } from "@/hooks/usePools";
import Navigation from "@/components/Navigation";
import { useMemo, useState } from "react";
import CustomFilterDropdown from "@/components/CustomFilterDropdown";
import Image from "next/image";

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
    name: "leverageRatio",
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
  formatAmount: (value: bigint | undefined) => string;
  formatAPRBreakdown: (breakdown: any) => { collateral: string; steam: string };
}

function PoolRow({
  pool,
  poolIndex,
  poolsData,
  rewardsData,
  aprBreakdownData,
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

  return (
    <tr
      key={pool.address}
      className="transition hover:bg-grey-light/20 cursor-pointer"
      onClick={() =>
        (window.location.href = `/earn/${pool.marketId}/${pool.poolType}`)
      }
    >
      <td className="py-4 px-6 whitespace-nowrap">
        <div className="flex flex-col gap-1">
          <span className="text-xl font-bold text-white">{pool.name}</span>
          <div className="flex items-center gap-2">
            <Image
              src={pool.chainIcon}
              alt={pool.chain}
              width={16}
              height={16}
              className="rounded-full"
            />
            <span className="text-xs text-[#A3A3A3]">{pool.chain}</span>
          </div>
        </div>
      </td>
      <td className="py-4 px-6">
        ${formatAmount(poolsData?.[poolIndex * 2]?.result)}
      </td>
      <td className="py-4 px-6">
        {baseAPR} + {boostAPR}
      </td>
      <td className="py-4 px-6">
        {formatAmount(poolsData?.[poolIndex * 2 + 1]?.result)}
      </td>
      <td className="py-4 px-6">
        {formatAmount(rewardsData?.[poolIndex]?.result)}
      </td>
    </tr>
  );
}

export default function Earn() {
  const { isConnected, address } = useAccount();
  const { getAllPools } = usePools();
  const allPools = getAllPools();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "stability" | "liquidity"
  >("all");

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "stability", label: "Stability" },
    { value: "liquidity", label: "Liquidity" },
  ];

  const filteredPools = useMemo(() => {
    return allPools
      .filter((pool) =>
        filterType === "all" ? true : pool.type === filterType
      )
      .filter((pool) =>
        pool.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [allPools, searchTerm, filterType]);

  const contracts = useMemo(
    () =>
      filteredPools.flatMap((pool) => [
        {
          address: pool.address,
          abi: stabilityPoolABI,
          functionName: "totalAssetSupply",
        },
        {
          address: pool.address,
          abi: stabilityPoolABI,
          functionName: "assetBalanceOf",
          args: [address ?? "0x0"],
        },
      ]),
    [filteredPools, address]
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
        args: [address ?? "0x0"],
      })),
    [filteredPools, address]
  );

  const { data: poolsData } = useContractReads({ contracts });
  const { data: rewardsData } = useContractReads({
    contracts: rewardsContracts,
  });
  const { data: aprBreakdownData } = useContractReads({
    contracts: aprContracts,
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
      <main className="container mx-auto px-2 sm:px-6 pt-32 pb-20 relative z-10">
        <div className="text-center mb-12">
          <h1 className={`text-4xl text-white`}>EARN</h1>
          <p className="text-[#F5F5F5]/60 text-sm mt-2">
            Deposit into stability or liquidity pools to earn STEAM and other
            rewards. Boost rewards by staking STEAM.
          </p>
        </div>
        <div className="space-y-12">
          <div className="shadow-lg bg-grey-darker overflow-x-auto">
            <div className="p-4 flex gap-8 items-end">
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
                    setFilterType(value as "all" | "stability" | "liquidity")
                  }
                />
              </div>
            </div>
            <table className="min-w-full text-left">
              <thead>
                <tr className="bg-grey-darker text-[#A3A3A3] text-sm">
                  <th className="py-4 px-6 font-semibold rounded-tl-2xl">
                    Pool
                  </th>
                  <th className="py-4 px-6 font-semibold">TVL</th>
                  <th className="py-4 px-6 font-semibold">APR</th>
                  <th className="py-4 px-6 font-semibold">Your Deposit</th>
                  <th className="py-4 px-6 font-semibold">Rewards</th>
                </tr>
              </thead>
              <tbody>
                {filteredPools.map((pool, index) => (
                  <PoolRow
                    key={pool.address}
                    pool={pool}
                    poolIndex={index}
                    poolsData={poolsData}
                    rewardsData={rewardsData}
                    aprBreakdownData={aprBreakdownData}
                    formatAmount={formatAmount}
                    formatAPRBreakdown={formatAPRBreakdown}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
