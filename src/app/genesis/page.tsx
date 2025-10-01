"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useContractReads } from "wagmi";
import { markets } from "../../config/markets";

// Minimal ABIs for summary reads
const genesisABI = [
  {
    inputs: [],
    name: "genesisIsEnded",
    outputs: [{ type: "bool", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalDeposits",
    outputs: [{ type: "uint256", name: "" }],
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
    outputs: [{ type: "uint256", name: "" }],
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
] as const;

function formatToken(
  value: bigint | undefined,
  decimals = 18,
  maxFrac = 4
): string {
  if (!value) return "0";
  const n = Number(value) / 10 ** decimals;
  if (n > 0 && n < 1 / 10 ** maxFrac)
    return `<${(1 / 10 ** maxFrac).toFixed(maxFrac)}`;
  return n.toLocaleString(undefined, { maximumFractionDigits: maxFrac });
}

export default function GenesisIndexPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  const genesisMarkets = useMemo(
    () =>
      Object.entries(markets).filter(([_, m]) => (m as any).addresses?.genesis),
    []
  );

  // Index layout per market: [isEnded, totalDeposits, totalRewards, balanceOf?, claimable?]
  const { data: reads } = useContractReads({
    contracts: genesisMarkets.flatMap(([_, m]) => {
      const g = (m as any).addresses.genesis as `0x${string}`;
      const base = [
        {
          address: g,
          abi: genesisABI,
          functionName: "genesisIsEnded" as const,
        },
        { address: g, abi: genesisABI, functionName: "totalDeposits" as const },
        { address: g, abi: genesisABI, functionName: "totalRewards" as const },
      ];
      const user =
        isConnected && address
          ? [
              {
                address: g,
                abi: genesisABI,
                functionName: "balanceOf" as const,
                args: [address as `0x${string}`],
              },
              {
                address: g,
                abi: genesisABI,
                functionName: "claimable" as const,
                args: [address as `0x${string}`],
              },
            ]
          : [];
      return [...base, ...user];
    }),
    query: { enabled: genesisMarkets.length > 0 },
  });

  return (
    <div className="min-h-screen text-[#F5F5F5] max-w-[1300px] mx-auto font-sans relative">
      <main className="container mx-auto px-4 sm:px-10 pb-6">
        <section className="mb-6">
          <div className="outline outline-1 outline-white/10 rounded-sm p-4">
            <div className="flex items-center justify-between">
              <h1 className="font-semibold font-mono text-white">Genesis</h1>
            </div>
            <p className="mt-2 text-white/60 text-sm">
              Browse active and completed Genesis markets. Open a market to
              deposit, withdraw, and claim.
            </p>
          </div>
        </section>

        <section>
          <div className="outline outline-1 outline-white/10 rounded-sm p-3 sm:p-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm table-fixed">
              <thead>
                <tr className="border-b border-white/10 uppercase tracking-wider text-[10px] text-white/60">
                  <th className="py-3 px-4 font-normal">Market</th>
                  <th className="w-40 py-3 px-4 text-right font-normal">
                    Total Deposits
                  </th>
                  <th className="w-40 py-3 px-4 text-right font-normal">
                    Rewards Pool
                  </th>
                  <th className="w-40 py-3 px-4 text-right font-normal">
                    Your Deposit
                  </th>
                  <th className="w-40 py-3 px-4 text-right font-normal">
                    Claimable
                  </th>
                  <th className="w-28 py-3 px-4 text-right font-normal">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {genesisMarkets.map(([id, m], mi) => {
                  const offset = mi * (isConnected ? 5 : 3);
                  const isEnded = (reads?.[offset]?.result as boolean) ?? false;
                  const totalDeposits = reads?.[offset + 1]?.result as
                    | bigint
                    | undefined;
                  const totalRewards = reads?.[offset + 2]?.result as
                    | [bigint, bigint]
                    | undefined;
                  const userDeposit = isConnected
                    ? (reads?.[offset + 3]?.result as bigint | undefined)
                    : undefined;
                  const claimable = isConnected
                    ? (reads?.[offset + 4]?.result as
                        | [bigint, bigint]
                        | undefined)
                    : undefined;
                  const claimableSum =
                    (claimable?.[0] || 0n) + (claimable?.[1] || 0n);

                  return (
                    <tr
                      key={id}
                      onClick={() => router.push(`/genesis/${id}`)}
                      className="border-t border-white/10 hover:bg-white/5 transition cursor-pointer"
                    >
                      <td className="py-2 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-white font-medium">
                            {(m as any).name}
                          </span>
                          <span className="text-xs text-white/50">
                            {(m as any).chain?.name || ""}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-4 text-right font-mono">
                        {formatToken(totalDeposits)}
                      </td>
                      <td className="py-2 px-4 text-right font-mono">
                        {Number(
                          (m as any).rewardToken?.amount || 0
                        ).toLocaleString()}{" "}
                        {(m as any).rewardToken?.symbol || ""}
                      </td>
                      <td className="py-2 px-4 text-right font-mono">
                        {formatToken(userDeposit)}
                      </td>
                      <td className="py-2 px-4 text-right font-mono">
                        {formatToken(claimableSum)}{" "}
                        {(m as any).rewardToken?.symbol || ""}
                      </td>
                      <td className="py-2 px-4 text-right">
                        <span className="text-[10px] uppercase px-2 py-1 bg-white/5 text-white/80 border border-white/10">
                          {isEnded ? "Ended" : "Active"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
