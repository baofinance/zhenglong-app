"use client";

import React, { useState } from "react";
import { formatEther } from "viem";
import { Geo } from "next/font/google";
import Image from "next/image";
import {
  useMultiMarketGenesisAdmin,
  type MarketAdminData,
} from "../hooks/useMultiMarketGenesisAdmin";

const geo = Geo({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

interface MarketAdminCardProps {
  marketData: MarketAdminData;
  onEndGenesis: (marketId: string) => void;
  isPending: boolean;
}

function MarketAdminCard({
  marketData,
  onEndGenesis,
  isPending,
}: MarketAdminCardProps) {
  const {
    marketId,
    market,
    genesisEnded,
    totalCollateral,
    collateralSymbol,
    isOwner,
    genesisStatus,
  } = marketData;

  const statusColors = {
    live: "bg-green-900/30 text-green-400 border-green-500/30",
    completed: "bg-blue-900/30 text-blue-400 border-blue-500/30",
    scheduled: "bg-yellow-900/30 text-yellow-400 border-yellow-500/30",
    closed: "bg-orange-900/30 text-orange-400 border-orange-500/30",
  };

  const statusColor =
    statusColors[genesisStatus.onChainStatus] ||
    "bg-gray-900/30 text-gray-400 border-gray-500/30";

  return (
    <div className="bg-zinc-900/50 outline outline-1 outline-white/10 hover:outline-white/20 transition-colors p-4 sm:p-6">
      {/* Market Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Image
            src={market.chain.logo}
            alt={market.chain.name}
            width={32}
            height={32}
            className="flex-shrink-0"
          />
          <div>
            <h3 className={`text-xl font-medium ${geo.className}`}>
              {market.name}
            </h3>
            <p className="text-sm text-[#F5F5F5]/50">
              {market.chain.name} • Genesis Token Generation Event
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 border text-sm font-medium ${statusColor}`}
          >
            {genesisStatus.onChainStatus.toUpperCase()}
          </span>
          {!isOwner && (
            <span className="px-2 py-1 bg-gray-600/30 text-gray-400 text-xs">
              Read Only
            </span>
          )}
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 outline outline-1 outline-white/10 bg-black/10">
          <div className={`text-xl font-bold text-blue-400 ${geo.className}`}>
            {formatEther(totalCollateral)}
          </div>
          <div className="text-xs text-[#F5F5F5]/70">
            Total {collateralSymbol} Deposited
          </div>
        </div>
        <div className="text-center p-3 outline outline-1 outline-white/10 bg-black/10">
          <div className={`text-xl font-bold text-green-400 ${geo.className}`}>
            {totalCollateral > 0n ? formatEther(totalCollateral / 2n) : "0"}
          </div>
          <div className="text-xs text-[#F5F5F5]/70">
            Collateral for Pegged Tokens
          </div>
        </div>
        <div className="text-center p-3 outline outline-1 outline-white/10 bg-black/10">
          <div className={`text-xl font-bold text-purple-400 ${geo.className}`}>
            {totalCollateral > 0n
              ? formatEther(totalCollateral - totalCollateral / 2n)
              : "0"}
          </div>
          <div className="text-xs text-[#F5F5F5]/70">
            Collateral for Leveraged Tokens
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      {isOwner && (
        <div className="pt-4 border-t border-white/10">
          {genesisStatus.onChainStatus === "live" ? (
            <div>
              <p className="text-sm text-[#F5F5F5]/70 mb-3">
                Genesis is active for this market. Users can deposit collateral.
              </p>
              <button
                onClick={() => onEndGenesis(marketId)}
                disabled={isPending || totalCollateral === 0n}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 font-medium transition-colors"
              >
                {isPending ? "Processing Transaction..." : "End Genesis Phase"}
              </button>
              {totalCollateral === 0n && (
                <p className="text-yellow-400 mt-2 text-xs">
                  ⚠️ No collateral deposited yet
                </p>
              )}
            </div>
          ) : genesisStatus.onChainStatus === "scheduled" ? (
            <div className="text-blue-400 text-sm">
              ⏳ Genesis scheduled to start soon.
            </div>
          ) : genesisStatus.onChainStatus === "closed" ? (
            <div className="text-orange-400 text-sm">
              ⏸️ Genesis manually ended. Users can claim tokens.
            </div>
          ) : (
            <div className="text-gray-400 text-sm">⏸️ Genesis inactive.</div>
          )}
        </div>
      )}
    </div>
  );
}

export function MultiMarketGenesisAdmin() {
  const [selectedTab, setSelectedTab] = useState<
    "active" | "ended" | "scheduled" | "closed" | "all"
  >("active");

  const {
    marketsAdminData,
    groupedMarkets,
    overallAdminStatus,
    endGenesis,
    isPending,
    isLoading,
  } = useMultiMarketGenesisAdmin();

  if (isLoading) {
    return (
      <div className="min-h-screen text-[#F5F5F5] max-w-[1300px] mx-auto font-sans relative">
        <main className="container mx-auto px-4 sm:px-10 pt-[6rem] pb-6 relative z-10">
          <div className="text-center">
            <h1
              className={`text-4xl font-medium mb-4 text-white ${geo.className}`}
            >
              GENESIS ADMIN
            </h1>
            <p className="text-white/70">Loading market data...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!overallAdminStatus.hasAnyAdminAccess) {
    return (
      <div className="min-h-screen text-[#F5F5F5] max-w-[1300px] mx-auto font-sans relative">
        <main className="container mx-auto px-4 sm:px-10 pt-[6rem] pb-6 relative z-10">
          <div className="bg-zinc-900/50 outline outline-1 outline-white/10 p-6 text-center">
            <h2
              className={`text-2xl font-medium text-white mb-2 ${geo.className}`}
            >
              Access Denied
            </h2>
            <p className="text-white/70">
              You don't have admin access to any Genesis markets.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const getDisplayedMarkets = () => {
    switch (selectedTab) {
      case "active":
        return groupedMarkets.active;
      case "ended":
        return groupedMarkets.ended;
      case "scheduled":
        return groupedMarkets.scheduled;
      case "closed":
        return groupedMarkets.closed;
      default:
        return marketsAdminData;
    }
  };

  const displayedMarkets = getDisplayedMarkets();

  return (
    <div className="min-h-screen text-[#F5F5F5] max-w-[1300px] mx-auto font-sans relative">
      <main className="container mx-auto px-4 sm:px-10 pt-[6rem] pb-6 relative z-10">
        <h1 className={`text-4xl font-medium mb-6 text-white ${geo.className}`}>
          Multi-Market Genesis Admin
        </h1>

        {/* Overall Statistics */}
        <div className="bg-zinc-900/50 outline outline-1 outline-white/10 p-4 sm:p-6 mb-4">
          <h2
            className={`text-lg font-medium text-white mb-4 font-geo ${geo.className}`}
          >
            Platform Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 outline outline-1 outline-white/10 bg-black/10">
              <div
                className={`text-2xl font-semibold text-white ${geo.className}`}
              >
                {overallAdminStatus.totalActiveMarkets}
              </div>
              <div className="text-sm text-white/70">Active Markets</div>
            </div>
            <div className="text-center p-4 outline outline-1 outline-white/10 bg-black/10">
              <div
                className={`text-2xl font-semibold text-white ${geo.className}`}
              >
                {overallAdminStatus.totalEndedMarkets}
              </div>
              <div className="text-sm text-white/70">Ended Markets</div>
            </div>
            <div className="text-center p-4 outline outline-1 outline-white/10 bg-black/10">
              <div
                className={`text-2xl font-semibold text-white ${geo.className}`}
              >
                {overallAdminStatus.totalScheduledMarkets}
              </div>
              <div className="text-sm text-white/70">Scheduled Markets</div>
            </div>
            <div className="text-center p-4 outline outline-1 outline-white/10 bg-black/10">
              <div
                className={`text-2xl font-semibold text-white ${geo.className}`}
              >
                {formatEther(overallAdminStatus.totalCollateralAcrossMarkets)}
              </div>
              <div className="text-sm text-white/70">Total Collateral</div>
            </div>
          </div>
        </div>

        {/* Market Filter Tabs */}
        <div className="mb-4">
          <div className="flex space-x-1 bg-zinc-900/50 p-1">
            {["active", "ended", "scheduled", "closed", "all"].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab as any)}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  selectedTab === tab
                    ? "bg-[#4A7C59] text-white"
                    : "text-white/70 hover:text-white hover:bg-[#4A7C59]/20"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab !== "all" && (
                  <span className="ml-1 text-xs opacity-75">
                    (
                    {tab === "active"
                      ? groupedMarkets.active.length
                      : tab === "ended"
                      ? groupedMarkets.ended.length
                      : tab === "scheduled"
                      ? groupedMarkets.scheduled.length
                      : tab === "closed"
                      ? groupedMarkets.closed.length
                      : 0}
                    )
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Markets Grid */}
        <div className="space-y-4">
          {displayedMarkets.length === 0 ? (
            <div className="text-center py-12 text-white/50">
              <p>
                No {selectedTab === "all" ? "" : selectedTab} markets found.
              </p>
            </div>
          ) : (
            displayedMarkets.map((marketData) => (
              <MarketAdminCard
                key={marketData.marketId}
                marketData={marketData}
                onEndGenesis={endGenesis}
                isPending={isPending}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
