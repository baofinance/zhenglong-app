"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { markets } from "../../config/markets";

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
      console.log("Voting with weights:", votes);
    } catch (error) {
      console.error("Voting failed:", error);
    } finally {
      setIsPending(false);
    }
  };

  const totalPercentage = votes.reduce(
    (sum, vote) => sum + Number(vote.weight),
    0
  );

  return (
    <div className="min-h-screen text-[#F5F5F5] max-w-[1300px] mx-auto font-sans relative">
      <main className="container mx-auto px-4 sm:px-10 pt-[6rem] pb-20 relative z-10">
        <div className="text-left mb-4">
          <h1 className="text-3xl font-medium text-white">Vote</h1>
          <p className="text-[#F5F5F5]/60 text-sm mt-1">
            Allocate your voting power across the protocol's gauges.
          </p>
        </div>

        <div className="space-y-4">
          {Object.entries(markets).map(([marketId, market]) => (
            <div
              key={marketId}
              className="bg-[#1A1A1A] rounded-md outline outline-1 outline-white/10 p-6"
            >
              <h2 className="text-lg font-medium mb-4">{market.name}</h2>
              <div className="space-y-4">
                {/* Collateral Pool */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-md font-medium text-[#F5F5F5]">
                      Collateral Pool
                    </h3>
                    <p className="text-sm text-[#F5F5F5]/50">wstETH/zheUSD</p>
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
                      className="w-24 bg-neutral-800 text-white rounded-lg h-10 px-3 focus:outline-none focus:ring-2 focus:ring-green-400/50 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-[#F5F5F5]/70">%</span>
                  </div>
                </div>

                {/* Leveraged Pool */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-md font-medium text-[#F5F5F5]">
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
                      className="w-24 bg-neutral-800 text-white rounded-lg h-10 px-3 focus:outline-none focus:ring-2 focus:ring-green-400/50 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-[#F5F5F5]/70">%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 max-w-sm mx-auto space-y-4">
          <div className="flex items-center justify-between px-6 py-3 bg-[#1A1A1A] rounded-md outline outline-1 outline-white/10">
            <span className="text-lg font-medium text-white">Total</span>
            <span
              className={`text-lg font-semibold ${
                totalPercentage > 100 ? "text-red-500" : "text-green-400"
              }`}
            >
              {totalPercentage}%
            </span>
          </div>

          <button
            onClick={handleVote}
            disabled={!isConnected || isPending || totalPercentage > 100}
            className={`w-full p-3 text-center text-lg font-medium transition-colors rounded-lg ${
              !isConnected || isPending || totalPercentage > 100
                ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white"
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
      </main>
    </div>
  );
}
