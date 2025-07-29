"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import {
  useAccount,
  useContractReads,
  useWriteContract,
  usePublicClient,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  markets,
  getGenesisStatus,
  isGenesisActive,
  getGenesisPhaseInfo,
} from "../../config/markets";
import Dropdown from "../../components/Dropdown";
import { minterABI } from "../../abis/minter";
import { GenesisRow } from "./GenesisRow";
import { Skeleton } from "../../components/Skeleton";

const genesisABI = [
  {
    inputs: [],
    name: "collateralToken",
    outputs: [{ type: "address", name: "token" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "peggedToken",
    outputs: [{ type: "address", name: "token" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "leveragedToken",
    outputs: [{ type: "address", name: "token" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalDeposits",
    outputs: [{ type: "uint256", name: "total" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalRewards",
    outputs: [
      { type: "uint256", name: "peggedAmount" },
      { type: "uint256", name: "leveragedAmount" },
    ],
    stateMutability: "view",
    type: "function",
  },
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
    inputs: [
      { name: "collateralIn", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    name: "withdraw",
    outputs: [{ type: "uint256", name: "collateralOut" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "receiver", type: "address" }],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
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
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ type: "bool", name: "" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ type: "string", name: "" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export default function Genesis() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "active" | "completed">(
    "all"
  );

  const filterOptions = [
    { value: "all", label: "All Markets" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  const genesisMarkets = Object.entries(markets).filter(
    ([_, market]) =>
      market.status === "genesis" ||
      (market.addresses.genesis && market.addresses.genesis.length > 0)
  );

  const { data: allMarketsData, refetch: refetchMarketsData } =
    useContractReads({
      contracts: genesisMarkets.flatMap(([id, market]) => [
        {
          address: market.addresses.genesis as `0x${string}`,
          abi: genesisABI,
          functionName: "genesisIsEnded",
        },
        {
          address: market.addresses.genesis as `0x${string}`,
          abi: genesisABI,
          functionName: "totalDeposits",
        },
        {
          address: market.addresses.genesis as `0x${string}`,
          abi: genesisABI,
          functionName: "totalRewards",
        },
        ...(address
          ? [
              {
                address: market.addresses.genesis as `0x${string}`,
                abi: genesisABI,
                functionName: "balanceOf",
                args: [address],
              },
              {
                address: market.addresses.genesis as `0x${string}`,
                abi: genesisABI,
                functionName: "claimable",
                args: [address],
              },
            ]
          : []),
      ]),
      query: { enabled: genesisMarkets.length > 0 },
    });

  const { data: allTokenData, refetch: refetchTokenData } = useContractReads({
    contracts: genesisMarkets.flatMap(([id, market]) => [
      {
        address: market.addresses.collateralToken as `0x${string}`,
        abi: erc20ABI,
        functionName: "symbol",
      },
      {
        address: market.addresses.collateralToken as `0x${string}`,
        abi: erc20ABI,
        functionName: "balanceOf",
        args: [market.addresses.genesis as `0x${string}`],
      },
      ...(address
        ? [
            {
              address: market.addresses.collateralToken as `0x${string}`,
              abi: erc20ABI,
              functionName: "balanceOf",
              args: [address],
            },
            {
              address: market.addresses.collateralToken as `0x${string}`,
              abi: erc20ABI,
              functionName: "allowance",
              args: [address, market.addresses.genesis as `0x${string}`],
            },
          ]
        : []),
    ]),
    query: { enabled: genesisMarkets.length > 0 },
  });

  const refetchAllData = async () => {
    await Promise.all([refetchMarketsData(), refetchTokenData()]);
  };

  const filteredMarkets = useMemo(() => {
    return genesisMarkets
      .filter(([id, market]) => {
        if (filterType === "all") return true;
        const marketIndex = genesisMarkets.findIndex(([mid]) => mid === id);
        const dataOffset = marketIndex * (address ? 5 : 3);
        const onChainGenesisEnded =
          allMarketsData?.[dataOffset]?.result === true;
        const isCompleted = onChainGenesisEnded;
        return filterType === "completed" ? isCompleted : !isCompleted;
      })
      .filter(([id, market]) =>
        market.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [genesisMarkets, searchTerm, filterType, allMarketsData, address]);

  if (!mounted) {
    return (
      <div className="min-h-screen text-[#F5F5F5] max-w-[1300px] mx-auto font-sans relative">
        <main className="container mx-auto px-4 sm:px-10 pt-[6rem] pb-3 relative z-10">
          <div className="text-center mb-4">
            <h1 className="text-4xl font-medium text-left text-white">
              <Skeleton className="w-48 h-10" />
            </h1>
          </div>

          <div className="space-y-4">
            <div className="shadow-lg rounded-md bg-[#1A1A1A] outline outline-1 outline-white/10 overflow-x-auto">
              <h2 className="text-lg font-medium p-6 pb-2">
                <Skeleton className="w-40 h-6" />
              </h2>
              <table className="min-w-full text-left table-fixed">
                <thead>
                  <tr className="border-b border-white/10 text-[#A3A3A3] bg-[#1A1A1A] font-medium text-sm">
                    <th className="py-4 px-8 font-normal">Market</th>
                    <th className="w-48 py-3 px-6 text-right font-normal">
                      Total Deposits
                    </th>
                    <th className="w-48 py-3 px-6 text-right font-normal">
                      Total Rewards
                    </th>
                    <th className="w-48 py-3 px-6 text-right font-normal">
                      Your Share
                    </th>
                    <th className="w-48 py-3 px-6 text-right font-normal">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <tr
                      key={i}
                      className="transition hover:bg-grey-light/20 text-sm cursor-pointer border-t border-white/10"
                    >
                      <td className="py-1 px-8 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className="flex w-6 items-center justify-center">
                            <Skeleton className="w-8 h-8 rounded-full" />
                          </div>
                          <div className="flex flex-col items-start gap-1">
                            <Skeleton className="w-24 h-5" />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <Skeleton className="w-20 h-5" />
                      </td>
                      <td className="py-3 px-6 text-right">
                        <Skeleton className="w-20 h-5" />
                      </td>
                      <td className="py-3 px-6 text-right">
                        <Skeleton className="w-16 h-5" />
                      </td>
                      <td className="w-48 py-3 px-6 text-right font-normal">
                        <Skeleton className="w-24 h-10" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#F5F5F5] max-w-[1300px] mx-auto font-sans relative">
      <main className="container mx-auto px-4 sm:px-10 pt-[6rem] pb-3 relative z-10">
        <div className="text-center mb-4">
          <h1 className={`text-4xl font-medium text-left text-white`}>
            Genesis
          </h1>
        </div>

        <div className="space-y-4">
          <div className="shadow-lg rounded-md bg-[#1A1A1A] outline outline-1 outline-white/10 overflow-x-auto">
            <h2 className="text-lg font-medium p-6 pb-2">All Markets</h2>
            {filteredMarkets.length > 0 ? (
              <table className="min-w-full text-left table-fixed">
                <thead>
                  <tr className="border-b border-white/10 text-[#A3A3A3] bg-[#1A1A1A] font-medium text-sm">
                    <th className="py-4 px-8 font-normal">Market</th>
                    <th className="w-48 py-3 px-6 text-right font-normal">
                      Total Deposits
                    </th>
                    <th className="w-48 py-3 px-6 text-right font-normal">
                      Total Rewards
                    </th>
                    <th className="w-48 py-3 px-6 text-right font-normal">
                      Your Share
                    </th>
                    <th className="w-48 py-3 px-6 text-right font-normal">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMarkets.map(([marketId, market]) => (
                    <GenesisRow
                      key={marketId}
                      marketId={marketId}
                      market={market}
                      allMarketsData={allMarketsData}
                      allTokenData={allTokenData}
                      refetchAllData={refetchAllData}
                      genesisMarkets={genesisMarkets}
                    />
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-20">
                <p className="text-white/60">No markets found.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
