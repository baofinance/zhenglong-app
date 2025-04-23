"use client";

import { Geo } from "next/font/google";

const geo = Geo({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export default function Stake() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A1A1A] to-black text-[#F5F5F5] font-sans relative">
      {/* Header */}
      <div className="container mx-auto text-center pt-32 pb-8">
        <h1 className={`text-4xl text-[#4A7C59] ${geo.className}`}>
          STAKE STEAM
        </h1>
        <p className="text-[#F5F5F5]/60 text-sm mt-2">
          Boost rewards, Share protocol revenue and vote on liquidity incentives
        </p>
      </div>

      <main className="container mx-auto px-6 pb-20 relative z-10">
        {/* Main Content */}
        <div className="max-w-5xl mx-auto bg-[#111111] p-8 rounded-lg relative z-10">
          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-black p-4 rounded">
              <p className="text-[#F5F5F5]/60 text-sm mb-2">Total Staked</p>
              <p className="text-[#4A7C59] text-xl">0 STEAM</p>
            </div>
            <div className="bg-black p-4 rounded">
              <p className="text-[#F5F5F5]/60 text-sm mb-2">
                Your Voting Power
              </p>
              <p className="text-[#4A7C59] text-xl">0 vSTEAM</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-8">
            <button className="bg-[#4A7C59] px-6 py-2 rounded text-white">
              Stake
            </button>
            <button className="bg-black px-6 py-2 rounded text-[#4A7C59] hover:bg-[#1A1A1A]">
              Increase
            </button>
            <button className="bg-black px-6 py-2 rounded text-[#4A7C59] hover:bg-[#1A1A1A]">
              Extend
            </button>
            <button className="bg-black px-6 py-2 rounded text-[#4A7C59] hover:bg-[#1A1A1A]">
              Withdraw
            </button>
          </div>

          {/* Input Section */}
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <p className="text-[#F5F5F5]/60">Amount</p>
                <p className="text-[#F5F5F5]/60">Balance: 0 STEAM</p>
              </div>
              <input
                type="text"
                placeholder="Enter amount in STEAM"
                className="w-full bg-black border border-[#4A7C59]/20 rounded px-4 py-3 text-[#F5F5F5] placeholder-[#F5F5F5]/30 focus:outline-none focus:border-[#4A7C59]"
              />
            </div>

            <div>
              <p className="text-[#F5F5F5]/60 mb-2">Lock Duration (weeks)</p>
              <input
                type="range"
                min="1"
                max="208"
                defaultValue="1"
                className="w-full"
              />
              <div className="flex justify-between mt-2">
                <span className="text-[#F5F5F5]/60 text-sm">1 week</span>
                <span className="text-[#F5F5F5]/60 text-sm">4 years</span>
              </div>
            </div>

            <button className="w-full bg-[#4A7C59] py-3 rounded text-white font-medium hover:bg-[#3A6147] transition-colors">
              Stake
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
