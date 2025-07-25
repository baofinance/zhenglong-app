"use client";

import { useState, useEffect } from "react";
import { Geo } from "next/font/google";
import {
  useAccount,
  useContractReads,
  useWriteContract,
  usePublicClient,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther } from "viem";
import {
  markets,
  getGenesisStatus,
  getPrimaryRewardToken,
  isGenesisActive,
  getGenesisPhaseInfo,
} from "../../config/markets";
import Image from "next/image";
import { minterABI } from "../../abis/minter";
import { MarketState } from "./page";

const geo = Geo({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

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

interface MarketRowProps {
  marketId: string;
  market: any;
  allMarketsData: any;
  allTokenData: any;
  allMinterData: any;
  refetchAllData: () => void;
  genesisMarkets: any[];
}

export function MarketRow({
  marketId,
  market,
  allMarketsData,
  allTokenData,
  allMinterData,
  refetchAllData,
  genesisMarkets,
}: MarketRowProps) {
  const { address, isConnected } = useAccount();
  const [isExpanded, setIsExpanded] = useState(false);
  const [marketState, setMarketState] = useState<
    Omit<MarketState, "isExpanded">
  >({
    depositAmount: "",
    withdrawAmount: "",
    activeTab: "deposit",
    depositModalOpen: false,
    withdrawModalOpen: false,
  });
  const [isPending, setIsPending] = useState(false);

  const { writeContract: write } = useWriteContract();

  const handleClaim = async (marketId: string) => {
    if (!isConnected || !address) return;

    try {
      setIsPending(true);

      const market = (markets as any)[marketId];
      const marketIndex = genesisMarkets.findIndex(([id]) => id === marketId);
      const dataOffset = marketIndex * (address ? 5 : 3);
      const claimableAmounts = allMarketsData?.[dataOffset + 4]?.result as
        | [bigint, bigint]
        | undefined;

      await write({
        address: market.addresses.genesis as `0x${string}`,
        abi: genesisABI,
        functionName: "claim",
        args: [address as `0x${string}`],
      });

      await refetchAllData();
    } catch (error: any) {
      console.error("Claim failed:", error);
    } finally {
      setIsPending(false);
    }
  };

  const toggleMarket = () => {
    setIsExpanded((prev) => !prev);
  };

  const formatEther = (value: bigint | undefined) => {
    if (!value) return "0";
    const num = Number(value) / 1e18;
    if (num > 0 && num < 0.0001) return "<0.0001";
    return num.toFixed(4);
  };

  const marketIndex = genesisMarkets.findIndex(([id]) => id === marketId);
  const dataOffset = marketIndex * (address ? 5 : 3);
  const tokenDataOffset = marketIndex * (address ? 4 : 2);

  const totalDeposits = allTokenData?.[tokenDataOffset + 1]?.result;
  const totalRewards = allMarketsData?.[dataOffset + 2]?.result;
  const userBalance = address
    ? allMarketsData?.[dataOffset + 3]?.result
    : undefined;
  const claimableAmounts = address
    ? allMarketsData?.[dataOffset + 4]?.result
    : undefined;
  const collateralSymbol = allTokenData?.[tokenDataOffset]?.result;

  const onChainGenesisEnded = allMarketsData?.[dataOffset]?.result === true;
  const genesisStatus = getGenesisStatus(market, onChainGenesisEnded);
  const phaseInfo = getGenesisPhaseInfo(genesisStatus.phase);
  const phaseStyles = {
    scheduled: "text-blue-400 bg-blue-400/10",
    live: "text-green-400 bg-green-400/10",
    closed: "text-yellow-400 bg-yellow-400/10",
    completed: "text-purple-400 bg-purple-400/10",
  };

  return (
    <div key={marketId} className="">
      <button
        onClick={toggleMarket}
        className="w-full flex items-center justify-between bg-[#1A1A1A]/90 border border-[#4A7C59]/20 px-4 py-3"
      >
        <div className="flex items-center gap-4">
          <Image
            src={market.chain.logo}
            alt={market.chain.name}
            width={24}
            height={24}
            className="flex-shrink-0"
          />
          <h3 className={`text-2xl font-medium ${geo.className}`}>
            {market.name}
          </h3>
          <span
            className={`text-sm inline-block px-3 py-1 border font-bold ${
              geo.className
            } ${phaseStyles[genesisStatus.phase as keyof typeof phaseStyles]}`}
          >
            {phaseInfo.title}
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-xs text-[#F5F5F5]/50 mb-1">Collateral</div>
            <a
              href={`https://etherscan.io/address/${market.addresses.collateralToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-lg font-medium ${geo.className} text-[#4A7C59] hover:text-[#3A6147] transition-colors underline decoration-dotted`}
            >
              {collateralSymbol}
            </a>
          </div>

          <div className="text-center">
            <div className="text-xs text-[#F5F5F5]/50 mb-1">Price Feed</div>
            <a
              href={`https://etherscan.io/address/${market.addresses.priceOracle}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-lg font-medium ${geo.className} text-[#4A7C59] hover:text-[#3A6147] transition-colors underline decoration-dotted`}
            >
              {market.name}
            </a>
          </div>

          <div className="text-center">
            <div className="text-xs text-[#F5F5F5]/50 mb-1">Total Deposits</div>
            <div className={`text-lg font-medium ${geo.className}`}>
              {totalDeposits && typeof totalDeposits === "bigint"
                ? formatEther(totalDeposits)
                : "0"}{" "}
              {collateralSymbol}
            </div>
          </div>

          <div className="text-center">
            <div className="text-xs text-[#F5F5F5]/50 mb-1">Total Rewards</div>
            <div className={`text-lg font-medium ${geo.className}`}>
              {Number(market.rewardToken.amount).toLocaleString()}{" "}
              {market.rewardToken.symbol}
            </div>
          </div>

          {isConnected &&
            genesisStatus.canClaim &&
            userBalance &&
            BigInt(userBalance.toString()) > 0n && (
              <span
                className={`text-sm inline-block px-3 py-1 border border-green-400 font-bold text-green-400 bg-green-400/10 ${geo.className}`}
              >
                CLAIM AVAILABLE
              </span>
            )}

          <div className="w-6 h-6 flex-shrink-0 ml-4">
            <svg
              className={`w-6 h-6 text-[#4A7C59] transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="bg-[#1A1A1A] border border-[#4A7C59]/20 border-t-0 px-4 py-6 shadow-[0_4px_20px_rgba(0,0,0,0.3)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#202020] border-2 border-[#4A7C59] p-2 text-center">
                  <div className="text-xs text-zinc-400 mb-1 uppercase tracking-wider">
                    Your Deposit
                  </div>
                  <div
                    className={`text-lg font-medium text-[#4A7C59] ${geo.className}`}
                  >
                    {isConnected &&
                    userBalance &&
                    typeof userBalance === "bigint"
                      ? formatEther(userBalance)
                      : "0"}{" "}
                    {collateralSymbol}
                  </div>
                </div>

                <div className="bg-[#202020] border-2 border-[#4A7C59] p-2 text-center">
                  <div className="text-xs text-zinc-400 mb-1 uppercase tracking-wider">
                    Your Reward Share
                  </div>
                  <div
                    className={`text-lg font-medium text-[#4A7C59] ${geo.className}`}
                  >
                    {(() => {
                      if (!isConnected || !claimableAmounts || !totalRewards)
                        return "0%";

                      const totalRewardSupply =
                        Array.isArray(totalRewards) && totalRewards.length >= 2
                          ? (totalRewards as [bigint, bigint])[0] +
                            (totalRewards as [bigint, bigint])[1]
                          : BigInt(0);
                      if (totalRewardSupply === 0n) return "0%";

                      const userClaimableSum =
                        Array.isArray(claimableAmounts) &&
                        claimableAmounts.length >= 2
                          ? (claimableAmounts as [bigint, bigint])[0] +
                            (claimableAmounts as [bigint, bigint])[1]
                          : BigInt(0);

                      const percentage =
                        (Number(userClaimableSum) / Number(totalRewardSupply)) *
                        100;
                      return `${percentage.toFixed(2)}%`;
                    })()}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-zinc-400 uppercase tracking-wider">
                  Claimable Tokens
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#202020] border-2 border-[#4A7C59] p-2 text-center">
                    <div className="text-xs text-zinc-400 mb-1 uppercase tracking-wider">
                      {market.peggedToken.name}
                    </div>
                    <div
                      className={`text-base font-medium text-blue-400 ${geo.className}`}
                    >
                      {Array.isArray(claimableAmounts) &&
                      claimableAmounts[0] &&
                      typeof claimableAmounts[0] === "bigint"
                        ? formatEther(claimableAmounts[0])
                        : "0"}
                    </div>
                  </div>
                  <div className="bg-[#202020] border-2 border-[#4A7C59] p-2 text-center">
                    <div className="text-xs text-zinc-400 mb-1 uppercase tracking-wider">
                      {market.leveragedToken.name}
                    </div>
                    <div
                      className={`text-base font-medium text-purple-400 ${geo.className}`}
                    >
                      {Array.isArray(claimableAmounts) &&
                      claimableAmounts[1] &&
                      typeof claimableAmounts[1] === "bigint"
                        ? formatEther(claimableAmounts[1])
                        : "0"}
                    </div>
                  </div>
                  <div className="bg-[#202020] border-2 border-[#4A7C59] p-2 text-center">
                    <div className="text-xs text-zinc-400 mb-1 uppercase tracking-wider">
                      Rewards
                    </div>
                    <div
                      className={`text-base font-medium text-yellow-400 ${geo.className}`}
                    >
                      {Number(market.rewardToken.amount).toLocaleString()}{" "}
                      {market.rewardToken.symbol}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 h-full flex flex-col">
              <div className="bg-[#202020] border-2 border-[#4A7C59] p-3">
                <div className="text-xs text-zinc-400 mb-1 uppercase tracking-wider">
                  Genesis Status
                </div>
                <div className="text-xs text-zinc-300 space-y-2">
                  <p>
                    <span className="text-[#4A7C59] font-medium">
                      Genesis ended.
                    </span>{" "}
                    Collateral was split 50/50:
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                      <span className="text-blue-400 font-medium text-xs">
                        ZHE
                      </span>
                      <span className="text-zinc-400 text-xs">
                        - Tracks {market.name} price feed
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                      <span className="text-purple-400 font-medium text-xs">
                        STEAMED
                      </span>
                      <span className="text-zinc-400 text-xs">
                        - Leveraged collateral vs feed
                      </span>
                    </div>
                  </div>
                  <p className="text-xs">
                    Both tokens are now{" "}
                    <span className="text-[#4A7C59] font-medium">
                      fully functional
                    </span>{" "}
                    and tradeable.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-2">
            {isConnected && genesisStatus.canClaim ? (
              (() => {
                const hasClaimableTokens =
                  Array.isArray(claimableAmounts) &&
                  claimableAmounts[0] &&
                  claimableAmounts[1] &&
                  typeof claimableAmounts[0] === "bigint" &&
                  typeof claimableAmounts[1] === "bigint" &&
                  (claimableAmounts[0] > 0n || claimableAmounts[1] > 0n);

                return hasClaimableTokens ? (
                  <button
                    onClick={() => handleClaim(marketId)}
                    className={`px-8 py-3 bg-[#4A7C59] hover:bg-[#3A6147] text-white font-medium shadow-lg transition-colors duration-200 ${geo.className}`}
                  >
                    CLAIM TOKENS
                  </button>
                ) : (
                  <button
                    disabled
                    className={`px-8 py-3 bg-gray-600 text-gray-400 font-medium shadow-lg cursor-not-allowed ${geo.className}`}
                  >
                    NO TOKENS TO CLAIM
                  </button>
                );
              })()
            ) : (
              <div className="px-8 py-3 text-center text-[#F5F5F5]/50 text-sm">
                {genesisStatus.canClaim
                  ? "Connect wallet to claim"
                  : "Claiming not available"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
