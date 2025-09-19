"use client";

import React from "react";
import { useAccount, useContractReads } from "wagmi";
import Navigation from "../../components/Navigation";
import SystemHealth from "../../components/SystemHealth";
import { markets } from "../../config/markets";
import { minterABI } from "../../abis/minter";
import NeutralBarChart, {
  type NeutralBarPoint,
  type NeutralBarSeries,
} from "../../components/NeutralBarChart";
// safety stats removed; no extra ABI needed
import { useCurrency } from "@/contexts/CurrencyContext";
import GlobalHeatmap from "../../components/GlobalHeatmap";
import CountUp from "../../components/CountUp";

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
  const { formatFiat, selected } = useCurrency();

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
  const isSingleMarket = genesisMarkets.length === 1;

  // Currency selector removed from Portfolio; using global currency context

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
                <div className="relative inline-block mb-6">
                  <h2 className={`font-semibold font-mono text-white`}>
                    Rewards & Airdrops
                  </h2>
                </div>
                <div
                  className={`grid grid-cols-1 md:grid-cols-2 gap-3 auto-rows-fr flex-1 w-full`}
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
                      { key: "rewards", label: "Rewards", fill: "#4f46e5" },
                    ];

                    return (
                      <div
                        key={id}
                        className={` hover:outline-white/20 transition-colors rounded-sm h-full w-full min-w-0 ${
                          isSingleMarket ? "md:col-span-2" : ""
                        }`}
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
                          sprinkleAccent={false}
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
                    Portfolio
                  </h2>
                </div>
                {/* Total holdings in large text */}
                <div className="flex-1 flex items-center justify-center py-6">
                  <div className="text-center">
                    <div
                      className="text-white font-semibold"
                      style={{ fontSize: "clamp(1.75rem, 5.5vw, 3.25rem)" }}
                    >
                      {(() => {
                        const totalUSD = genesisMarkets.reduce(
                          (sum, [id, m], idx) => {
                            const userOffset = idx * 2;
                            const balanceRaw = userR[userOffset]
                              ?.result as unknown;
                            const balance =
                              (balanceRaw as bigint | undefined) ?? undefined;
                            const deposit = balance
                              ? Number(balance) / 1e18
                              : 0;
                            const oracleOffset = idx * 2;
                            const decRaw = oracleR[oracleOffset]
                              ?.result as unknown;
                            const priceRaw = oracleR[oracleOffset + 1]
                              ?.result as unknown;
                            const dec = (decRaw as number | undefined) ?? 8;
                            const price = (priceRaw as bigint | undefined)
                              ? Number(priceRaw as bigint) / 10 ** dec
                              : 0;
                            return sum + deposit * price;
                          },
                          440000
                        );
                        const converted = totalUSD * selected.rate;
                        return (
                          <span>
                            <span className="mr-2 text-white/80">
                              {selected.symbol}
                            </span>
                            <CountUp to={converted} separator="," />
                          </span>
                        );
                      })()}
                    </div>
                    <div className="mt-1">
                      {(() => {
                        const seed =
                          Math.sin(genesisMarkets.length * 1.23) * 0.5 + 0.5; // 0..1 deterministic
                        const pct = (seed - 0.5) * 6; // -3..+3
                        const isUp = pct >= 0;
                        return (
                          <span
                            className={
                              isUp
                                ? "text-emerald-400 text-sm"
                                : "text-rose-400 text-sm"
                            }
                          >
                            {isUp ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}% 24h
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                {/* Minimal breakdown */}
                <div className="px-2 pb-4">
                  <div className="flex items-center justify-center gap-4 text-xs sm:text-sm text-white/70">
                    {(() => {
                      const totals = genesisMarkets.reduce(
                        (acc, [id, m], idx) => {
                          const userOffset = idx * 2;
                          const balanceRaw = userR[userOffset]
                            ?.result as unknown;
                          const balance =
                            (balanceRaw as bigint | undefined) ?? undefined;
                          const deposit = balance ? Number(balance) / 1e18 : 0;
                          const oracleOffset = idx * 2;
                          const decRaw = oracleR[oracleOffset]
                            ?.result as unknown;
                          const priceRaw = oracleR[oracleOffset + 1]
                            ?.result as unknown;
                          const dec = (decRaw as number | undefined) ?? 8;
                          const price = (priceRaw as bigint | undefined)
                            ? Number(priceRaw as bigint) / 10 ** dec
                            : 0;
                          const marketUSD = deposit * price;
                          acc.total += marketUSD;
                          acc.pegged += marketUSD * 0.5;
                          acc.lev += marketUSD * 0.5;
                          return acc;
                        },
                        { total: 0, pegged: 0, lev: 0 }
                      );
                      const peggedShare =
                        totals.total > 0
                          ? (totals.pegged / totals.total) * 100
                          : 0;
                      const levShare =
                        totals.total > 0
                          ? (totals.lev / totals.total) * 100
                          : 0;
                      return (
                        <>
                          <span>
                            Pegged:{" "}
                            <span className="text-white font-mono">
                              <span className="mr-1 text-white/70">
                                {selected.symbol}
                              </span>
                              <CountUp
                                to={totals.pegged * selected.rate}
                                separator=","
                              />
                            </span>{" "}
                            ({peggedShare.toFixed(1)}%)
                          </span>
                          <span className="text-white/30">•</span>
                          <span>
                            Leveraged:{" "}
                            <span className="text-white font-mono">
                              <span className="mr-1 text-white/70">
                                {selected.symbol}
                              </span>
                              <CountUp
                                to={totals.lev * selected.rate}
                                separator=","
                              />
                            </span>{" "}
                            ({levShare.toFixed(1)}%)
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Activity + Buybacks */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-stretch">
            <div className="md:order-2 md:col-span-1 outline outline-1 outline-white/10 rounded-sm p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold font-mono text-white">Activity</h2>
                <div className="text-xs text-white/60">Last 3 months</div>
              </div>
              <GlobalHeatmap
                mode="github"
                weeks={(() => {
                  const now = new Date();
                  const end = new Date(
                    now.getFullYear(),
                    now.getMonth() + 1,
                    0
                  );
                  const start = new Date(
                    now.getFullYear(),
                    now.getMonth() - 2,
                    1
                  );
                  const startWeekday = start.getDay();
                  const dayCount =
                    Math.floor((end.getTime() - start.getTime()) / 86400000) +
                    1;
                  return Math.ceil((startWeekday + dayCount) / 7);
                })()}
                startDate={(() => {
                  const now = new Date();
                  return new Date(now.getFullYear(), now.getMonth() + 1, 0);
                })()}
                gapPx={6}
                dates={(() => {
                  const now = new Date();
                  const end = new Date(
                    now.getFullYear(),
                    now.getMonth() + 1,
                    0
                  );
                  const start = new Date(
                    now.getFullYear(),
                    now.getMonth() - 2,
                    1
                  );
                  const startWeekday = start.getDay();
                  const dayCount =
                    Math.floor((end.getTime() - start.getTime()) / 86400000) +
                    1;
                  const weeks = Math.ceil((startWeekday + dayCount) / 7);
                  const total = weeks * 7;
                  const out: Date[] = Array(total);
                  for (let idx = 0; idx < total; idx++) {
                    const d = new Date(start);
                    d.setDate(start.getDate() + (idx - startWeekday));
                    out[idx] = d;
                  }
                  return out;
                })()}
                actives={(() => {
                  const now = new Date();
                  const end = new Date(
                    now.getFullYear(),
                    now.getMonth() + 1,
                    0
                  );
                  const start = new Date(
                    now.getFullYear(),
                    now.getMonth() - 2,
                    1
                  );
                  const startWeekday = start.getDay();
                  const dayCount =
                    Math.floor((end.getTime() - start.getTime()) / 86400000) +
                    1;
                  const weeks = Math.ceil((startWeekday + dayCount) / 7);
                  const total = weeks * 7;
                  return Array.from({ length: total }, (_, idx) => {
                    const d = new Date(start);
                    d.setDate(start.getDate() + (idx - startWeekday));
                    return d >= start && d <= end;
                  });
                })()}
                values={(() => {
                  const now = new Date();
                  const end = new Date(
                    now.getFullYear(),
                    now.getMonth() + 1,
                    0
                  );
                  const start = new Date(
                    now.getFullYear(),
                    now.getMonth() - 2,
                    1
                  );
                  const startWeekday = start.getDay();
                  const dayCount =
                    Math.floor((end.getTime() - start.getTime()) / 86400000) +
                    1;
                  const weeks = Math.ceil((startWeekday + dayCount) / 7);
                  const total = weeks * 7;
                  const vals = Array(total).fill(0);
                  for (let idx = 0; idx < total; idx++) {
                    const dt = new Date(start);
                    dt.setDate(start.getDate() + (idx - startWeekday));
                    if (dt >= start && dt <= end) {
                      const dnum = Math.floor(
                        (dt.getTime() - start.getTime()) / 86400000
                      );
                      const seed = Math.sin((dnum + 1) * 1.37) * 0.5 + 0.5; // 0..1
                      vals[idx] = Math.max(0, Math.min(1, seed));
                    }
                  }
                  return vals as number[];
                })()}
                amounts={(() => {
                  // Base TVL approximation from deposits * price (fallback to mocks)
                  const totalUSD = genesisMarkets.reduce(
                    (sum, [id, m], idx) => {
                      const userOffset = idx * 2;
                      const balanceRaw = userR[userOffset]?.result as unknown;
                      const balance =
                        (balanceRaw as bigint | undefined) ?? undefined;
                      const deposit = balance
                        ? Number(balance) / 1e18
                        : MOCKS.depositWstEth;
                      const oracleOffset = idx * 2;
                      const decRaw = oracleR[oracleOffset]?.result as unknown;
                      const priceRaw = oracleR[oracleOffset + 1]
                        ?.result as unknown;
                      const dec = (decRaw as number | undefined) ?? 8;
                      const price = (priceRaw as bigint | undefined)
                        ? Number(priceRaw as bigint) / 10 ** dec
                        : MOCKS.stethPrice;
                      return sum + deposit * price;
                    },
                    0
                  );

                  const now = new Date();
                  const end = new Date(
                    now.getFullYear(),
                    now.getMonth() + 1,
                    0
                  );
                  const start = new Date(
                    now.getFullYear(),
                    now.getMonth() - 2,
                    1
                  );
                  const startWeekday = start.getDay();
                  const dayCount =
                    Math.floor((end.getTime() - start.getTime()) / 86400000) +
                    1;
                  const weeks = Math.ceil((startWeekday + dayCount) / 7);
                  const total = weeks * 7;
                  const arr = Array(total).fill(0);
                  for (let idx = 0; idx < total; idx++) {
                    const dt = new Date(start);
                    dt.setDate(start.getDate() + (idx - startWeekday));
                    if (dt >= start && dt <= end) {
                      const dnum = Math.floor(
                        (dt.getTime() - start.getTime()) / 86400000
                      );
                      const noise = Math.sin((dnum + 3.14) * 0.73) * 0.5 + 0.5; // 0..1
                      const factor = 0.005 + noise * 0.025; // 0.5%..3.0% of TVL
                      arr[idx] = Math.max(0, totalUSD * factor);
                    }
                  }
                  return arr as number[];
                })()}
                formatAmount={(n) => formatFiat(n)}
              />
            </div>
            <div className="outline outline-1 outline-white/10 rounded-sm p-4 h-full flex flex-col">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-semibold font-mono text-white">Buybacks</h2>
                <div className="text-xs text-white/50">Last 30 days</div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {(() => {
                  const total30d = 125000; // mock
                  const total7d = 42000; // mock
                  return (
                    <>
                      <div className="outline outline-1 outline-white/10 p-2">
                        <div className="text-white/60 text-xs">
                          30d Buybacks
                        </div>
                        <div className="text-white font-mono text-base">
                          {formatFiat(total30d)}
                        </div>
                      </div>
                      <div className="outline outline-1 outline-white/10 p-2">
                        <div className="text-white/60 text-xs">7d Buybacks</div>
                        <div className="text-white font-mono text-base">
                          {formatFiat(total7d)}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="text-white/60 text-xs mb-1">Recent</div>
              <div className="flex-1 overflow-auto">
                <div className="space-y-1">
                  {Array.from({ length: 6 }).map((_, i) => {
                    const amount = 2000 + i * 350;
                    const ts = new Date(Date.now() - i * 36 * 60 * 60 * 1000);
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs outline outline-1 outline-white/10 p-2"
                      >
                        <span className="text-white/80">
                          {ts.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span className="text-white font-mono">
                          {formatFiat(amount)}
                        </span>
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
