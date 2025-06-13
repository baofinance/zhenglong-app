"use client";

import { useState, useEffect } from "react";
import { Geo } from "next/font/google";
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from "wagmi";
import { parseEther, formatEther } from "viem";
import { toast } from "react-hot-toast";
import ConnectButton from "@/components/ConnectButton";
import Navigation from "@/components/Navigation";
import { votingABI } from "@/abis/votingABI";
import { markets } from "../../config/contracts";

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

interface VotingPower {
  totalPower: bigint;
  usedPower: bigint;
  collateralWeight: bigint;
  leveragedWeight: bigint;
}

export default function Vote() {
  const { address, isConnected } = useAccount();
  const [votes, setVotes] = useState<GaugeVote[]>(
    Object.keys(markets).flatMap((marketId) => [
      { marketId, poolType: "collateral", weight: "0" },
      { marketId, poolType: "leveraged", weight: "0" },
    ])
  );
  const [isPending, setIsPending] = useState(false);
  const [votingPower, setVotingPower] = useState<VotingPower>({
    totalPower: BigInt(0),
    usedPower: BigInt(0),
    collateralWeight: BigInt(0),
    leveragedWeight: BigInt(0)
  });

  // Contract reads
  const { data: totalPower, isLoading: isLoadingTotalPower } = useContractRead({
    address: markets["steth-usd"].addresses.minter as `0x${string}`,
    abi: votingABI,
    functionName: "totalPower",
    args: [address as `0x${string}`],
    enabled: !!address,
  });

  const { data: usedPower, isLoading: isLoadingUsedPower } = useContractRead({
    address: markets["steth-usd"].addresses.minter as `0x${string}`,
    abi: votingABI,
    functionName: "usedPower",
    args: [address as `0x${string}`],
    enabled: !!address,
  });

  const { data: collateralWeight, isLoading: isLoadingCollateralWeight } = useContractRead({
    address: markets["steth-usd"].addresses.minter as `0x${string}`,
    abi: votingABI,
    functionName: "collateralWeight",
    args: [address as `0x${string}`],
    enabled: !!address,
  });

  const { data: leveragedWeight, isLoading: isLoadingLeveragedWeight } = useContractRead({
    address: markets["steth-usd"].addresses.minter as `0x${string}`,
    abi: votingABI,
    functionName: "leveragedWeight",
    args: [address as `0x${string}`],
    enabled: !!address,
  });

  // Contract write for voting
  const { write: vote, data: voteData } = useContractWrite({
    address: markets["steth-usd"].addresses.minter as `0x${string}`,
    abi: [
      {
        inputs: [
          { name: "marketId", type: "string" },
          { name: "poolType", type: "string" },
          { name: "weight", type: "uint256" },
        ],
        name: "vote",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
    ],
    functionName: "vote",
  });

  // Wait for transaction
  const { isLoading: isTransactionPending } = useWaitForTransaction({
    hash: voteData?.hash,
  });

  useEffect(() => {
    if (totalPower && usedPower && collateralWeight && leveragedWeight) {
      setVotingPower({
        totalPower: totalPower as bigint,
        usedPower: usedPower as bigint,
        collateralWeight: collateralWeight as bigint,
        leveragedWeight: leveragedWeight as bigint
      });
    }
  }, [totalPower, usedPower, collateralWeight, leveragedWeight]);

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
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (totalPercentage > 100) {
      toast.error("Total voting weight cannot exceed 100%");
      return;
    }

    try {
      setIsPending(true);
      
      // Filter out zero-weight votes
      const activeVotes = votes.filter((vote) => Number(vote.weight) > 0);
      
      // Submit each vote
      for (const voteData of activeVotes) {
        await vote?.({
          args: [voteData.marketId, voteData.poolType, parseEther(voteData.weight)],
        });
      }

      toast.success("Votes submitted successfully!");
    } catch (error) {
      console.error("Voting failed:", error);
      toast.error("Failed to submit votes. Please try again.");
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
    <div className="min-h-screen bg-gradient-to-b from-[#1A1A1A] to-black text-[#F5F5F5] font-sans relative">
      {/* Steam Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Large base squares */}
        <div className="absolute top-[15%] left-[20%] w-[600px] h-[400px] bg-[#4A7C59]/[0.06]"></div>
        <div className="absolute top-[25%] right-[15%] w-[500px] h-[450px] bg-[#4A7C59]/[0.05]"></div>
        <div className="absolute top-[20%] left-[35%] w-[400px] h-[300px] bg-[#4A7C59]/[0.07]"></div>

        {/* Medium squares - Layer 1 */}
        <div className="absolute top-[22%] left-[10%] w-[300px] h-[250px] bg-[#4A7C59]/[0.04] animate-float-1"></div>
        <div className="absolute top-[28%] right-[25%] w-[280px] h-[320px] bg-[#4A7C59]/[0.045] animate-float-2"></div>
        <div className="absolute top-[35%] left-[40%] w-[350px] h-[280px] bg-[#4A7C59]/[0.055] animate-float-3"></div>

        {/* Medium squares - Layer 2 */}
        <div className="absolute top-[30%] left-[28%] w-[250px] h-[200px] bg-[#4A7C59]/[0.065] animate-float-4"></div>
        <div className="absolute top-[25%] right-[30%] w-[220px] h-[180px] bg-[#4A7C59]/[0.05] animate-float-1"></div>
        <div className="absolute top-[40%] left-[15%] w-[280px] h-[240px] bg-[#4A7C59]/[0.06] animate-float-2"></div>

        {/* Small pixel squares */}
        <div className="absolute top-[20%] left-[45%] w-[120px] h-[120px] bg-[#4A7C59]/[0.075] animate-steam-1"></div>
        <div className="absolute top-[35%] right-[40%] w-[150px] h-[150px] bg-[#4A7C59]/[0.07] animate-steam-2"></div>
        <div className="absolute top-[30%] left-[25%] w-[100px] h-[100px] bg-[#4A7C59]/[0.08] animate-steam-3"></div>
      </div>

      <Navigation />

      <main className="container mx-auto px-6 pt-28 pb-20 relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className={`text-4xl text-[#4A7C59] ${geo.className}`}>
            VOTE
          </h1>
          <p className="text-[#F5F5F5]/60 text-sm mt-2 max-w-xl mx-auto">
            Vote for your favorite pools to earn rewards. The more voting power you have, the more influence you have on the distribution of rewards.
          </p>
        </div>

        {/* Voting Power */}
        <div className="max-w-5xl mx-auto mb-8">
          <div className="bg-[#0A0A0A] p-6 shadow-custom-dark">
            <h2 className={`text-2xl text-[#4A7C59] mb-4 ${geo.className}`}>
              Your Voting Power
            </h2>
            {isLoadingTotalPower || isLoadingUsedPower || isLoadingCollateralWeight || isLoadingLeveragedWeight ? (
              <div className="text-[#F5F5F5]/50">Loading voting power...</div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1A1A1A] p-4 border border-[#4A7C59]/20">
                  <p className="text-sm text-[#F5F5F5]/50 mb-1">Total Voting Power</p>
                  <p className="text-lg font-medium text-[#4A7C59]">
                    {formatEther(votingPower.totalPower)} veZHL
                  </p>
                </div>
                <div className="bg-[#1A1A1A] p-4 border border-[#4A7C59]/20">
                  <p className="text-sm text-[#F5F5F5]/50 mb-1">Used Voting Power</p>
                  <p className="text-lg font-medium text-[#4A7C59]">
                    {formatEther(votingPower.usedPower)} veZHL
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vote Form */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-[#0A0A0A] p-6 shadow-custom-dark">
            <h2 className={`text-2xl text-[#4A7C59] mb-4 ${geo.className}`}>
              Vote for Pools
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#F5F5F5]/50 mb-2">
                    Collateral Pool Weight
                  </label>
                  <input
                    type="number"
                    value={
                      votes.find(
                        (v) =>
                          v.marketId === "steth-usd" &&
                          v.poolType === "collateral"
                      )?.weight
                    }
                    onChange={(e) =>
                      handleWeightChange(
                        "steth-usd",
                        "collateral",
                        e.target.value
                      )
                    }
                    placeholder="0"
                    className="w-full bg-[#1A1A1A] text-[#F5F5F5] border border-[#4A7C59]/20 focus:border-[#4A7C59] outline-none transition-all p-3"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#F5F5F5]/50 mb-2">
                    Leveraged Pool Weight
                  </label>
                  <input
                    type="number"
                    value={
                      votes.find(
                        (v) =>
                          v.marketId === "steth-usd" &&
                          v.poolType === "leveraged"
                      )?.weight
                    }
                    onChange={(e) =>
                      handleWeightChange(
                        "steth-usd",
                        "leveraged",
                        e.target.value
                      )
                    }
                    placeholder="0"
                    className="w-full bg-[#1A1A1A] text-[#F5F5F5] border border-[#4A7C59]/20 focus:border-[#4A7C59] outline-none transition-all p-3"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleVote}
                  disabled={isPending || !votingPower.collateralWeight || !votingPower.leveragedWeight}
                  className={`px-6 py-2 text-sm font-medium transition-colors ${
                    isPending || !votingPower.collateralWeight || !votingPower.leveragedWeight
                      ? "bg-[#1F3529] text-[#4A7C59] cursor-not-allowed"
                      : "bg-[#4A7C59] text-white hover:bg-[#3A6147]"
                  }`}
                >
                  {isPending ? "Voting..." : "Vote"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
