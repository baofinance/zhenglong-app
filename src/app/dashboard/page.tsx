"use client";

import { useAccount, useContractReads } from "wagmi";
import { useState } from "react";
import Navigation from "../../components/Navigation";
import SystemHealth from "../../components/SystemHealth";
import { markets } from "../../config/markets";
import { minterABI } from "../../abis/minter";
import NeutralBarChart, {
  type NeutralBarPoint,
  type NeutralBarSeries,
} from "../../components/NeutralBarChart";
import { STABILITY_POOL_MANAGER_ABI } from "../../config/contracts";

const chainlinkOracleABI = [
  {
    inputs: [],
    name: "decimals",
    outputs: [{ type: "uint8", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "latestAnswer",
    outputs: [{ type: "int256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const genesisViewABI = [
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
] as const;

// Minimal inline icons
function IconCoins() {
  return (
    <svg
      className="w-3.5 h-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="8" cy="8" r="4" />
      <circle cx="16" cy="16" r="4" />
    </svg>
  );
}
function IconGift() {
  return (
    <svg
      className="w-3.5 h-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M12 8v12M3 12h18M7 8c0-2 2-3 3-3s3 1 3 3M17 8c0-2-2-3-3-3s-3 1-3 3" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 3l7 4v5c0 5-3.5 9-7 9s-7-4-7-9V7l7-4z" />
    </svg>
  );
}
function IconGauge() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 21a9 9 0 1 1 9-9" />
      <path d="M12 12l5-2" />
    </svg>
  );
}
function IconSafe() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M7 12h2M15 12h2" />
    </svg>
  );
}
function IconToken() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <ellipse cx="12" cy="7" rx="7" ry="3" />
      <path d="M5 7v10c0 1.7 3.1 3 7 3s7-1.3 7-3V7" />
    </svg>
  );
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();

  const genesisMarkets = Object.entries(markets);

  // Mock fallbacks so UI is populated during design/dev
  const MOCKS = {
    depositWstEth: 12.3456,
    claimableTotal: 789.1234,
    stethPrice: 2000,
    minterCollateral: 3456.78,
  };

  // User-specific reads (balanceOf, claimable)
  const { data: userReads } = useContractReads({
    contracts: isConnected
      ? genesisMarkets.flatMap(([_, m]) => [
          {
            address: m.addresses.genesis as `0x${string}`,
            abi: genesisViewABI,
            functionName: "balanceOf",
            args: [address as `0x${string}`],
          },
          {
            address: m.addresses.genesis as `0x${string}`,
            abi: genesisViewABI,
            functionName: "claimable",
            args: [address as `0x${string}`],
          },
        ])
      : [],
    query: { enabled: isConnected && genesisMarkets.length > 0 },
  });

  // Oracle reads (decimals, latestAnswer)
  const { data: oracleReads } = useContractReads({
    contracts: genesisMarkets.flatMap(([_, m]) => [
      {
        address: m.addresses.priceOracle as `0x${string}`,
        abi: chainlinkOracleABI,
        functionName: "decimals",
      },
      {
        address: m.addresses.priceOracle as `0x${string}`,
        abi: chainlinkOracleABI,
        functionName: "latestAnswer",
      },
    ]),
    query: { enabled: genesisMarkets.length > 0 },
  });

  // Minter reads (collateralTokenBalance)
  const { data: minterReads } = useContractReads({
    contracts: genesisMarkets.map(([_, m]) => ({
      address: m.addresses.minter as `0x${string}`,
      abi: minterABI,
      functionName: "collateralTokenBalance",
    })),
    query: { enabled: genesisMarkets.length > 0 },
  });

  // Loosen types for indexed access to avoid deep TS instantiation
  const userR = (userReads as unknown as any[]) || [];
  const oracleR = (oracleReads as unknown as any[]) || [];
  const minterR = (minterReads as unknown as any[]) || [];
  // Safety reads: collateralRatio and rebalanceThreshold per market
  const { data: safetyReads } = useContractReads({
    contracts: genesisMarkets.flatMap(([_, m]) => [
      {
        address: m.addresses.minter as `0x${string}`,
        abi: minterABI,
        functionName: "collateralRatio",
      },
      {
        address: m.addresses.stabilityPoolManager as `0x${string}`,
        abi: STABILITY_POOL_MANAGER_ABI,
        functionName: "rebalanceThreshold",
      },
    ]),
    allowFailure: true,
  });
  const safetyR = (safetyReads as unknown as any[]) || [];

  return (
    <div className="min-h-screen text-[#F5F5F5] max-w-[1300px] mx-auto font-sans relative">
      <main className="container mx-auto px-4 sm:px-10">
        {/* Rewards Overview + Safety Stats side-by-side */}
        <section className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-stretch">
            <div className="md:col-span-2 h-full">
              <div
                className={`outline outline-1 outline-white/10 rounded-sm p-4 w-full h-full flex flex-col`}
              >
                <div className="relative inline-block mb-3">
                  <h2 className={`font-semibold font-mono text-white`}>
                    Rewards & Airdrops
                  </h2>
                </div>
                <div
                  className={`grid grid-cols-1 md:grid-cols-2 gap-3 auto-rows-fr flex-1`}
                >
                  {genesisMarkets.map(([id, m], idx) => {
                    const userOffset = idx * 2;
                    const balanceRaw = userR[userOffset]?.result as unknown;
                    const claimableRaw = userR[userOffset + 1]
                      ?.result as unknown;
                    const balance =
                      (balanceRaw as bigint | undefined) ?? undefined;
                    const claimable =
                      (claimableRaw as [bigint, bigint] | undefined) ??
                      undefined;

                    const oracleOffset = idx * 2;
                    const oracleDecRaw = oracleR[oracleOffset]
                      ?.result as unknown;
                    const oraclePriceRaw = oracleR[oracleOffset + 1]
                      ?.result as unknown;
                    const oracleDec =
                      (oracleDecRaw as number | undefined) ?? undefined;
                    const oracleVal =
                      (oraclePriceRaw as bigint | undefined) ?? undefined;
                    const price =
                      oracleDec !== undefined && oracleVal !== undefined
                        ? Number(oracleVal) / 10 ** Number(oracleDec)
                        : undefined;

                    const rewardPool = Number(m.rewardToken.amount);

                    const depositText = balance
                      ? (Number(balance) / 1e18).toFixed(4)
                      : MOCKS.depositWstEth.toFixed(4);
                    const claimableText = claimable
                      ? (Number(claimable[0] + claimable[1]) / 1e18).toFixed(4)
                      : MOCKS.claimableTotal.toFixed(4);

                    // Rewards-only neutral bar series
                    const rewardsVal = parseFloat(claimableText);
                    const weeks = 12;
                    const weekMs = 7 * 24 * 60 * 60 * 1000;
                    const now = Date.now();
                    const data: NeutralBarPoint[] = Array.from(
                      { length: weeks },
                      (_, i) => {
                        const factor = 0.6 + (i / (weeks - 1)) * 0.4;
                        return {
                          timestamp: now - (weeks - 1 - i) * weekMs,
                          rewards: Math.max(0, rewardsVal * factor),
                        } as NeutralBarPoint;
                      }
                    );
                    const series: NeutralBarSeries[] = [
                      { key: "rewards", label: "Rewards", fill: "#A3A3A3" },
                    ];

                    return (
                      <div
                        key={id}
                        className={` hover:outline-white/20 transition-colors rounded-sm h-full w-full`}
                      >
                        <div
                          className={`text-[11px] sm:text-xs text-white/70 uppercase tracking-wider mb-2`}
                        >
                          {m.name}
                        </div>
                        <NeutralBarChart
                          data={data}
                          series={series}
                          height={160}
                          formatTimestamp={(ts) =>
                            new Date(ts).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="h-full">
              <div
                className={`outline outline-1 outline-white/10 rounded-sm p-3 h-full flex flex-col`}
              >
                <div className="relative inline-block mb-3">
                  <h2 className={`font-semibold font-mono text-white`}>
                    Safety Stats
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-3 auto-rows-fr flex-1">
                  {genesisMarkets.map(([id, m], idx) => {
                    const ratioRaw = safetyR?.[idx * 2]?.result as
                      | bigint
                      | undefined;
                    const threshRaw = safetyR?.[idx * 2 + 1]?.result as
                      | bigint
                      | undefined;
                    const ratioPct = ratioRaw
                      ? Number(ratioRaw) / 1e16
                      : undefined;
                    const threshPct = threshRaw
                      ? Number(threshRaw) / 1e16
                      : undefined;
                    const dropToRebalance =
                      ratioPct && threshPct && ratioPct > 0
                        ? Math.max(0, 1 - threshPct / ratioPct) * 100
                        : undefined;
                    const dropToParity =
                      ratioPct && ratioPct > 0
                        ? Math.max(0, 1 - 100 / ratioPct) * 100
                        : undefined;

                    const fmt = (v?: number) =>
                      v === undefined ? "-" : `${v.toFixed(1)}%`;

                    return (
                      <div
                        key={id}
                        className={`outline outline-1 outline-white/10 hover:outline-white/20 transition-colors rounded-sm p-3 h-full w-full`}
                      >
                        <div
                          className={`text-[11px] sm:text-xs text-white/70 uppercase tracking-wider mb-2`}
                        >
                          {m.name}
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-white/70 text-xs">
                              Drop to rebalance
                            </div>
                            <div className="text-white font-mono text-lg">
                              {fmt(dropToRebalance)}
                            </div>
                          </div>
                          <div>
                            <div className="text-white/70 text-xs">
                              Drop to 100%
                            </div>
                            <div className="text-white font-mono text-lg">
                              {fmt(dropToParity)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
