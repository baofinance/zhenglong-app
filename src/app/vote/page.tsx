"use client";

import { useState } from "react";
import { Geo } from "next/font/google";
import { useAccount, useContractReads, useContractWrite } from "wagmi";
import { markets } from "../../config/markets";
import Navigation from "../../components/Navigation";

const geo = Geo({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

interface GaugeVote {
  marketId: string;
  poolType: "collateral" | "leveraged";
  weight: string;
}

export default function Vote() {
  const { isConnected, address } = useAccount();
  const [votes, setVotes] = useState<GaugeVote[]>(
    Object.keys(markets).flatMap((marketId) => [
      { marketId, poolType: "collateral", weight: "0" },
      { marketId, poolType: "leveraged", weight: "0" },
    ])
  );
  const [isPending, setIsPending] = useState(false);

  const handleWeightChange = (
    marketId: string,
    poolType: "collateral" | "leveraged",
    value: string
  ) => {
    // Ensure value is between 0 and 100
    const numValue = Math.min(Math.max(Number(value) || 0, 0), 100);

    setVotes((prev) =>
      prev.map((vote) =>
        vote.marketId === marketId && vote.poolType === poolType
          ? { ...vote, weight: String(numValue) }
          : vote
      )
    );
  };

  const handleVote = async () => {
    if (!isConnected) return;

    try {
      setIsPending(true);
      // TODO: Implement voting contract interaction
      console.log("Voting with weights:", votes);
    } catch (error) {
      console.error("Voting failed:", error);
    } finally {
      setIsPending(false);
    }
  };

  // Calculate total percentage
  const totalPercentage = votes.reduce(
    (sum, vote) => sum + Number(vote.weight),
    0
  );

  return (
    <div className="min-h-screen text-[#F5F5F5] font-sans relative max-w-[1500px] mx-auto">
      <main className="container mx-auto px-6 pt-32">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className={`text-4xl text-[#4A7C59] ${geo.className}`}>VOTE</h1>
            <p className="text-[#F5F5F5]/60 text-sm mt-2">
              Allocate your voting power across the protocol's gauges
            </p>
          </div>

          {/* Markets List */}
          <div className="space-y-8 mb-8">
            {Object.entries(markets).map(([marketId, market]) => (
              <div key={marketId} className="bg-[#0A0A0A] p-6 relative z-20">
                <div className="absolute inset-0 bg-[#0A0A0A] z-10"></div>
                <div className="relative z-20 space-y-6">
                  {/* Market Header */}
                  <div className="flex items-center justify-between">
                    <h2 className={`text-2xl text-[#4A7C59] ${geo.className}`}>
                      {market.name}
                    </h2>
                  </div>

                  {/* Gauge List */}
                  <div className="space-y-4">
                    {/* Collateral Pool */}
                    <div className="bg-[#1A1A1A] p-6 relative z-20">
                      <div className="absolute inset-0 bg-[#1A1A1A] z-10"></div>
                      <div className="relative z-20">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h3
                              className={`text-xl text-[#F5F5F5] mb-1 ${geo.className}`}
                            >
                              Collateral Pool
                            </h3>
                            <p className="text-sm text-[#F5F5F5]/50">
                              wstETH/zheUSD
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={
                                votes.find(
                                  (v) =>
                                    v.marketId === marketId &&
                                    v.poolType === "collateral"
                                )?.weight
                              }
                              onChange={(e) =>
                                handleWeightChange(
                                  marketId,
                                  "collateral",
                                  e.target.value
                                )
                              }
                              min="0"
                              max="100"
                              className="w-24 bg-[#1A1A1A] text-[#F5F5F5] border border-[#4A7C59]/20 focus:border-[#4A7C59] outline-none transition-all p-2 text-right"
                            />
                            <span className="text-[#F5F5F5]/70">%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Leveraged Pool */}
                    <div className="bg-[#1A1A1A] p-6 relative z-20">
                      <div className="absolute inset-0 bg-[#1A1A1A] z-10"></div>
                      <div className="relative z-20">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h3
                              className={`text-xl text-[#F5F5F5] mb-1 ${geo.className}`}
                            >
                              Leveraged Pool
                            </h3>
                            <p className="text-sm text-[#F5F5F5]/50">
                              wstETH/steamedETH
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={
                                votes.find(
                                  (v) =>
                                    v.marketId === marketId &&
                                    v.poolType === "leveraged"
                                )?.weight
                              }
                              onChange={(e) =>
                                handleWeightChange(
                                  marketId,
                                  "leveraged",
                                  e.target.value
                                )
                              }
                              min="0"
                              max="100"
                              className="w-24 bg-[#1A1A1A] text-[#F5F5F5] border border-[#4A7C59]/20 focus:border-[#4A7C59] outline-none transition-all p-2 text-right"
                            />
                            <span className="text-[#F5F5F5]/70">%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total and Submit */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-6">
              <span className="text-[#F5F5F5]/70">Total</span>
              <span
                className={`text-xl ${
                  totalPercentage > 100 ? "text-red-500" : "text-[#4A7C59]"
                }`}
              >
                {totalPercentage}%
              </span>
            </div>

            <button
              onClick={handleVote}
              disabled={!isConnected || isPending || totalPercentage > 100}
              className={`w-full p-4 text-center text-2xl transition-colors ${
                geo.className
              } ${
                !isConnected || isPending || totalPercentage > 100
                  ? "bg-[#1F3529] text-[#4A7C59] cursor-not-allowed"
                  : "bg-[#4A7C59] hover:bg-[#3A6147] text-white"
              }`}
            >
              {!isConnected
                ? "Connect Wallet"
                : isPending
                ? "Voting..."
                : totalPercentage > 100
                ? "Total Exceeds 100%"
                : "Vote"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
