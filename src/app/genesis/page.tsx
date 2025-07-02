"use client";

import { useState, useEffect, useMemo } from "react";
import { Geo } from "next/font/google";
import {
  useAccount,
  useContractReads,
  useWriteContract,
  usePublicClient,
} from "wagmi";
import { parseEther } from "viem";
import {
  markets,
  getGenesisStatus,
  getPrimaryRewardToken,
  isGenesisActive,
  getGenesisPhaseInfo,
  type GenesisStatus,
} from "../../config/contracts";
import ConnectButton from "../../components/ConnectButton";
import Link from "next/link";
import Image from "next/image";
import Navigation from "../../components/Navigation";

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
      { name: "receiver", type: "address" },
      { name: "minCollateralOut", type: "uint256" },
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

interface MarketState {
  isExpanded: boolean;
  depositAmount: string;
  withdrawAmount: string;
  activeTab: "deposit" | "withdraw" | "rewards";
}

interface ContractReadResult<T = any> {
  error?: Error;
  result?: T;
  status: "success" | "failure";
}

interface TotalRewards {
  peggedAmount: bigint;
  leveragedAmount: bigint;
}

// Custom hook for countdown
function useCountdown(endDate: string) {
  const [countdown, setCountdown] = useState({ text: "", isEnded: false });

  useEffect(() => {
    const updateCountdown = () => {
      const end = new Date(endDate).getTime();
      const now = new Date().getTime();
      const distance = end - now;

      if (distance < 0) {
        setCountdown({ text: "Genesis Ended", isEnded: true });
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setCountdown({
          text: `${days}d ${hours}h ${minutes}m ${seconds}s`,
          isEnded: false,
        });
      }
    };

    const timer = setInterval(updateCountdown, 1000);
    updateCountdown(); // Initial update

    return () => clearInterval(timer);
  }, [endDate]);

  return countdown;
}

export default function Genesis() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [marketStates, setMarketStates] = useState<Record<string, MarketState>>(
    () => {
      // Initialize market states with default values
      return Object.keys(markets).reduce((acc, id) => {
        acc[id] = {
          isExpanded: false,
          depositAmount: "",
          withdrawAmount: "",
          activeTab: "deposit",
        };
        return acc;
      }, {} as Record<string, MarketState>);
    }
  );
  const [isPending, setIsPending] = useState(false);
  const [pendingStep, setPendingStep] = useState<"approval" | "deposit" | null>(
    null
  );

  const publicClient = usePublicClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  type MarketWrites = {
    approve: ReturnType<typeof useWriteContract>;
    deposit: ReturnType<typeof useWriteContract>;
    withdraw: ReturnType<typeof useWriteContract>;
    claim: ReturnType<typeof useWriteContract>;
  };

  type ContractWrites = {
    [marketId: string]: MarketWrites;
  };

  // Custom hook for market contract writes
  function useMarketContractWrites(marketId: string): MarketWrites {
    const approve = useWriteContract();
    const deposit = useWriteContract();
    const withdraw = useWriteContract();
    const claim = useWriteContract();

    return { approve, deposit, withdraw, claim };
  }

  // Get genesis contract state for all markets
  const { data: allMarketsData } = useContractReads({
    contracts: Object.entries(markets).flatMap(([id, market]) => [
      {
        address: market.addresses.genesis as `0x${string}`,
        abi: genesisABI,
        functionName: "genesisIsEnded",
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
    query: { enabled: true },
  });

  // Create individual hooks for each market
  const ethMarketWrites = useMarketContractWrites("eth-usd");

  // Combine all contract writes
  const contractWrites: ContractWrites = useMemo(
    () => ({
      "eth-usd": ethMarketWrites,
    }),
    [ethMarketWrites]
  );

  // Initialize countdowns for each market
  const ethUsdCountdown = useCountdown(markets["eth-usd"].genesis.endDate);

  // Group markets by status using hybrid on-chain + config system
  const { activeMarkets, completedMarkets } = useMemo(() => {
    const active: string[] = [];
    const completed: string[] = [];

    Object.entries(markets).forEach(([id, market], index) => {
      const dataOffset = index * (address ? 5 : 3);
      const onChainGenesisEnded = allMarketsData?.[dataOffset]?.result === true;
      const genesisStatus = getGenesisStatus(market, onChainGenesisEnded);

      if (
        genesisStatus.onChainStatus === "completed" ||
        genesisStatus.onChainStatus === "closed"
      ) {
        completed.push(id);
      } else {
        active.push(id);
      }
    });

    return { activeMarkets: active, completedMarkets: completed };
  }, [address, allMarketsData]);

  // Get token info for all markets, including total collateral in Genesis contract
  const { data: allTokenData } = useContractReads({
    contracts: Object.entries(markets).flatMap(([id, market]) => [
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
    query: { enabled: true },
  });

  const formatEther = (value: bigint | undefined) => {
    if (!value) return "0";
    const num = Number(value) / 1e18;
    if (num > 0 && num < 0.0001) return "<0.0001";
    return num.toFixed(4);
  };

  const handleMaxDeposit = (marketId: string) => {
    const marketIndex = Object.keys(markets).indexOf(marketId);
    const tokenDataOffset = marketIndex * (address ? 3 : 1);
    const balance = allTokenData?.[tokenDataOffset + 1]?.result;

    if (balance) {
      setMarketStates((prev) => ({
        ...prev,
        [marketId]: {
          ...prev[marketId],
          depositAmount: (Number(balance) / 1e18).toString(),
        },
      }));
    }
  };

  const handleMaxWithdraw = (marketId: string) => {
    const marketIndex = Object.keys(markets).indexOf(marketId);
    const dataOffset = marketIndex * (address ? 5 : 3);
    const balance = allMarketsData?.[dataOffset + 3]?.result;

    if (balance) {
      setMarketStates((prev) => ({
        ...prev,
        [marketId]: {
          ...prev[marketId],
          withdrawAmount: (Number(balance) / 1e18).toString(),
        },
      }));
    }
  };

  const handleApprove = async (marketId: string) => {
    if (!isConnected || !marketStates[marketId]?.depositAmount || !address)
      return;

    const amount = parseEther(marketStates[marketId].depositAmount);
    if (amount <= 0) return;

    try {
      setIsPending(true);
      setPendingStep("approval");
      const approveTx = await contractWrites[marketId].approve.writeContract({
        address: markets[marketId].addresses.collateralToken as `0x${string}`,
        abi: erc20ABI,
        functionName: "approve",
        args: [
          (typeof markets[marketId].addresses.genesis === "string" &&
          markets[marketId].addresses.genesis.length > 0
            ? markets[marketId].addresses.genesis
            : "0x0000000000000000000000000000000000000000") as `0x${string}`,
          amount,
        ],
      });

      // After a successful approval, allowance should update automatically shortly
    } catch (e) {
      console.error("Approval failed", e);
    } finally {
      setIsPending(false);
      setPendingStep(null);
    }
  };

  const handleDeposit = async (marketId: string) => {
    if (!isConnected || !marketStates[marketId]?.depositAmount || !address)
      return;

    try {
      setIsPending(true);
      setPendingStep("deposit");
      const amount = parseEther(marketStates[marketId].depositAmount);
      const { deposit } = contractWrites[marketId];

      const hash = await deposit.writeContract({
        address: markets[marketId].addresses.genesis as `0x${string}`,
        abi: genesisABI,
        functionName: "deposit",
        args: [
          amount,
          typeof (address ?? "") === "string" && (address ?? "").length > 0
            ? address ?? ""
            : ("0x0000000000000000000000000000000000000000" as `0x${string}`),
        ],
      });

      await publicClient?.waitForTransactionReceipt({ hash });

      // Reset form
      setMarketStates((prev) => ({
        ...prev,
        [marketId]: { ...prev[marketId], depositAmount: "" },
      }));
    } catch (error: any) {
      console.error("Deposit failed:", error);
    } finally {
      setIsPending(false);
      setPendingStep(null);
    }
  };

  const handleWithdraw = async (marketId: string) => {
    if (!isConnected || !marketStates[marketId]?.withdrawAmount || !address)
      return;

    try {
      setIsPending(true);
      const amount = parseEther(marketStates[marketId].withdrawAmount);
      const write = contractWrites[marketId].withdraw;

      const hashW = await write.writeContract({
        address: markets[marketId].addresses.genesis as `0x${string}`,
        abi: genesisABI,
        functionName: "withdraw",
        args: [
          typeof (address ?? "") === "string" && (address ?? "").length > 0
            ? address ?? ""
            : ("0x0000000000000000000000000000000000000000" as `0x${string}`),
          amount,
        ],
      });

      await publicClient?.waitForTransactionReceipt({ hash: hashW });

      // Reset form
      setMarketStates((prev) => ({
        ...prev,
        [marketId]: { ...prev[marketId], withdrawAmount: "" },
      }));
    } catch (error: any) {
      console.error("Withdraw failed:", error);
    } finally {
      setIsPending(false);
    }
  };

  const handleClaim = async (marketId: string) => {
    if (!isConnected || !address) return;

    try {
      setIsPending(true);
      const write = contractWrites[marketId].claim;

      await write.writeContract({
        address: markets[marketId].addresses.genesis as `0x${string}`,
        abi: genesisABI,
        functionName: "claim",
        args: [address as `0x${string}`],
      });
    } catch (error: any) {
      console.error("Claim failed:", error);
    } finally {
      setIsPending(false);
    }
  };

  const toggleMarket = (marketId: string) => {
    setMarketStates((prev) => ({
      ...prev,
      [marketId]: {
        ...prev[marketId],
        isExpanded: !prev[marketId].isExpanded,
      },
    }));
  };

  const setActiveTab = (
    marketId: string,
    tab: "deposit" | "withdraw" | "rewards"
  ) => {
    setMarketStates((prev) => ({
      ...prev,
      [marketId]: {
        ...prev[marketId],
        activeTab: tab,
      },
    }));
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1A1A1A] to-black text-[#F5F5F5] font-sans relative">
        <Navigation />
        <main className="container mx-auto max-w-full px-6 sm:px-8 lg:px-16 xl:px-24 2xl:px-32 pt-28 pb-20">
          <div className="text-center">
            <h1 className={`text-4xl text-[#4A7C59] ${geo.className}`}>
              GENESIS
            </h1>
            <p className="text-[#F5F5F5]/60 text-lg mt-4">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A1A1A] to-black text-[#F5F5F5] font-sans relative">
      {/* Steam Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Large base squares */}
        <div className="absolute top-[10%] left-[20%] w-[200px] h-[200px] bg-[#4A7C59]/[0.06]"></div>
        <div className="absolute top-[15%] left-[35%] w-[180px] h-[180px] bg-[#4A7C59]/[0.05]"></div>
        <div className="absolute top-[20%] left-[50%] w-[160px] h-[160px] bg-[#4A7C59]/[0.07]"></div>

        {/* Medium squares - Layer 1 */}
        <div className="absolute top-[30%] left-[15%] w-[150px] h-[150px] bg-[#4A7C59]/[0.04] animate-float-1"></div>
        <div className="absolute top-[35%] left-[30%] w-[140px] h-[140px] bg-[#4A7C59]/[0.045] animate-float-2"></div>
        <div className="absolute top-[40%] left-[45%] w-[130px] h-[130px] bg-[#4A7C59]/[0.055] animate-float-3"></div>

        {/* Medium squares - Layer 2 */}
        <div className="absolute top-[50%] left-[25%] w-[120px] h-[120px] bg-[#4A7C59]/[0.065] animate-float-4"></div>
        <div className="absolute top-[55%] left-[40%] w-[110px] h-[110px] bg-[#4A7C59]/[0.05] animate-float-1"></div>
        <div className="absolute top-[60%] left-[55%] w-[100px] h-[100px] bg-[#4A7C59]/[0.06] animate-float-2"></div>

        {/* Small squares */}
        <div className="absolute top-[70%] left-[20%] w-[80px] h-[80px] bg-[#4A7C59]/[0.075] animate-steam-1"></div>
        <div className="absolute top-[75%] left-[35%] w-[70px] h-[70px] bg-[#4A7C59]/[0.07] animate-steam-2"></div>
        <div className="absolute top-[80%] left-[50%] w-[60px] h-[60px] bg-[#4A7C59]/[0.08] animate-steam-3"></div>
        <div className="absolute top-[85%] left-[65%] w-[50px] h-[50px] bg-[#4A7C59]/[0.065] animate-steam-1"></div>
        <div className="absolute top-[90%] left-[80%] w-[40px] h-[40px] bg-[#4A7C59]/[0.075] animate-steam-2"></div>
        <div className="absolute top-[95%] left-[95%] w-[30px] h-[30px] bg-[#4A7C59]/[0.07] animate-steam-3"></div>
      </div>

      <Navigation />

      <main className="container mx-auto max-w-full px-6 sm:px-8 lg:px-16 xl:px-24 2xl:px-32 pt-28 pb-20 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl text-[#4A7C59] ${geo.className}`}>
            GENESIS
          </h1>
          <p className="text-[#F5F5F5]/60 text-lg mt-4">
            Seed liquidity and earn rewards. Receive pegged and leveraged tokens
            with the same net exposure as your collateral.
          </p>
        </div>

        {/* Active Markets */}
        <div className="mb-8">
          <h2 className={`text-2xl text-[#4A7C59] mb-6 ${geo.className}`}>
            Active Markets
          </h2>
          {activeMarkets.length === 0 ? (
            <div className="bg-[#1A1A1A]/90 border border-[#4A7C59]/20 p-8 text-center text-[#F5F5F5]/50">
              No active markets available
            </div>
          ) : (
            <div className="space-y-4">
              {activeMarkets.map((marketId) => {
                const market = markets[marketId];
                const marketIndex = Object.keys(markets).indexOf(marketId);
                const dataOffset = marketIndex * (address ? 5 : 3);
                const tokenDataOffset = marketIndex * (address ? 3 : 1);

                const totalRewards = allMarketsData?.[dataOffset + 1]?.result;
                const userBalance = allMarketsData?.[dataOffset + 2]?.result;
                const walletBalance = address
                  ? allTokenData?.[tokenDataOffset + 1]?.result
                  : undefined;
                const claimableAmounts =
                  allMarketsData?.[dataOffset + 3]?.result;
                const collateralSymbol =
                  allTokenData?.[tokenDataOffset]?.result;

                const onChainGenesisEnded =
                  allMarketsData?.[dataOffset]?.result === true;
                const genesisStatus = getGenesisStatus(
                  market,
                  onChainGenesisEnded
                );
                const phaseInfo = getGenesisPhaseInfo(genesisStatus.phase);
                const phaseStyles = {
                  scheduled: "text-blue-400 bg-blue-400/10",
                  live: "text-green-400 bg-green-400/10",
                  closed: "text-yellow-400 bg-yellow-400/10",
                  completed: "text-purple-400 bg-purple-400/10",
                };

                const totalDeposits =
                  allTokenData?.[tokenDataOffset + 1]?.result;

                // Calculate the user's share of rewards
                const userShare = (() => {
                  const user =
                    typeof userBalance === "bigint"
                      ? userBalance
                      : BigInt(userBalance || 0);
                  const total =
                    typeof totalDeposits === "bigint"
                      ? totalDeposits
                      : typeof totalDeposits === "string" &&
                        totalDeposits.length > 0
                      ? BigInt(totalDeposits)
                      : BigInt(0);
                  const totalRewards = Number(market.rewardToken.amount);
                  if (total > 0n && user > 0n) {
                    // Calculate share as a float, then round to nearest integer for display
                    const share = (Number(user) / Number(total)) * totalRewards;
                    return Math.floor(share).toLocaleString();
                  }
                  return "0";
                })();

                return (
                  <div
                    key={marketId}
                    className="bg-[#1A1A1A]/90 border border-[#4A7C59]/20 hover:border-[#4A7C59]/40 transition-colors"
                  >
                    {/* Collapsed View / Header */}
                    <button
                      onClick={() => toggleMarket(marketId)}
                      className="w-full p-6 flex items-center justify-between hover:bg-[#1A1A1A]/50 transition-colors"
                    >
                      {/* Left side: Market Name, Status, End Date inline */}
                      <div className="flex-shrink-0 w-1/3 text-left flex items-center gap-4">
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
                          className={`text-sm inline-block px-3 py-1 border border-green-400 font-bold ${
                            geo.className
                          } ${phaseStyles[genesisStatus.phase]}`}
                        >
                          {phaseInfo.title}
                        </span>
                        <span className="text-xs text-[#F5F5F5]/50 whitespace-nowrap">
                          Ends:{" "}
                          {new Date(
                            market.genesis.endDate
                          ).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Right side: Key Stats */}
                      <div className="grid grid-cols-3 gap-8 flex-1 max-w-2xl text-center">
                        <div>
                          <div className="text-xs text-[#F5F5F5]/50 mb-1">
                            Total Deposits
                          </div>
                          <div
                            className={`text-xl font-medium ${geo.className}`}
                          >
                            {formatEther(
                              typeof totalDeposits === "bigint"
                                ? totalDeposits
                                : typeof totalDeposits === "string" &&
                                  totalDeposits !== undefined &&
                                  (totalDeposits as string).length > 0
                                ? BigInt(totalDeposits as string)
                                : undefined
                            )}{" "}
                            {collateralSymbol}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-[#F5F5F5]/50 mb-1">
                            Total Rewards
                          </div>
                          <div
                            className={`text-xl font-medium ${geo.className}`}
                          >
                            {Number(market.rewardToken.amount).toLocaleString()}{" "}
                            {market.rewardToken.symbol}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-[#F5F5F5]/50 mb-1">
                            Token Split
                          </div>
                          <div
                            className={`text-xl font-medium ${geo.className}`}
                          >
                            {market.genesis.tokenDistribution.pegged.percentage}
                            % /{" "}
                            {
                              market.genesis.tokenDistribution.leveraged
                                .percentage
                            }
                            %
                          </div>
                        </div>
                      </div>

                      {/* Expand Arrow */}
                      <div className="w-6 h-6 flex-shrink-0 ml-4">
                        <svg
                          className={`w-6 h-6 text-[#4A7C59] transition-transform ${
                            marketStates[marketId].isExpanded
                              ? "rotate-180"
                              : ""
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
                    </button>

                    {/* Expanded Content */}
                    {marketStates[marketId].isExpanded && (
                      <div className="border-t border-[#4A7C59]/20 px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {/* Left Column: Genesis Info */}
                          <div className="md:col-span-1 space-y-2 flex flex-col h-full">
                            <div className="bg-[#1A1A1A]/90 border border-[#4A7C59]/20 px-4 py-4 flex-1">
                              <h4
                                className={`font-bold text-[#F5F5F5]/70 mb-3 text-xl uppercase tracking-wider ${geo.className}`}
                              >
                                Genesis Details
                              </h4>
                              <p className="text-sm text-[#F5F5F5]/50 mb-3">
                                {market.genesis.description}
                              </p>
                              <p className="text-sm text-[#F5F5F5]/50">
                                Participants in Genesis will earn{" "}
                                <b className={`${geo.className} text-2xl`}>
                                  {Number(
                                    market.rewardToken.amount
                                  ).toLocaleString()}{" "}
                                  {market.rewardToken.symbol}
                                </b>{" "}
                                as rewards, distributed pro-rata to all
                                deposits.
                              </p>
                            </div>
                            <div className="bg-[#1A1A1A]/90 border border-[#4A7C59]/20 px-4 py-4">
                              <h4
                                className={`font-bold text-[#F5F5F5]/70 mb-3 text-xl uppercase tracking-wider ${geo.className}`}
                              >
                                Schedule
                              </h4>
                              <p className="text-sm text-[#F5F5F5]/50 mb-2">
                                Start Date:{" "}
                                <span className={`${geo.className} text-xl`}>
                                  {new Date(
                                    market.genesis.startDate
                                  ).toLocaleString()}
                                </span>
                              </p>
                              <p className="text-sm text-[#F5F5F5]/50">
                                End Date:{" "}
                                <span className={`${geo.className} text-xl`}>
                                  {new Date(
                                    market.genesis.endDate
                                  ).toLocaleString()}
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Right Column: User Stats & Actions */}
                          <div className="md:col-span-2 space-y-2 flex flex-col h-full">
                            {/* User Info */}
                            {isConnected ? (
                              <div className="grid grid-cols-2 gap-2">
                                <div className="bg-[#1A1A1A]/90 border border-[#4A7C59]/20 px-4 py-4 text-center">
                                  <p className="text-[10px] text-[#F5F5F5]/50 mb-1 uppercase tracking-wider">
                                    Your Deposits
                                  </p>
                                  <p
                                    className={`text-2xl font-bold text-[#4A7C59] ${geo.className}`}
                                  >
                                    {formatEther(userBalance as bigint)}{" "}
                                    {collateralSymbol}
                                  </p>
                                </div>
                                <div className="bg-[#1A1A1A]/90 border border-[#4A7C59]/20 px-4 py-4 text-center">
                                  <p className="text-[10px] text-[#F5F5F5]/50 mb-1 uppercase tracking-wider flex items-center justify-center gap-1">
                                    Your Share of Rewards
                                    <span
                                      className="inline-block align-middle cursor-pointer text-[#4A7C59] font-bold"
                                      title="Your share can change based on deposits and withdrawals up until genesis is closed."
                                      style={{
                                        border: "1px solid #4A7C59",
                                        borderRadius: "50%",
                                        width: "14px",
                                        height: "14px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "10px",
                                        marginLeft: "4px",
                                      }}
                                    >
                                      i
                                    </span>
                                  </p>
                                  <p
                                    className={`text-2xl font-bold text-[#4A7C59] ${geo.className}`}
                                  >
                                    {userShare} {market.rewardToken.symbol}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center">
                                <ConnectButton />
                              </div>
                            )}

                            {/* Action Tabs and Forms */}
                            <div className="bg-[#1A1A1A]/90 border border-[#4A7C59]/20 flex-1 flex flex-col">
                              {/* Tabs */}
                              <div className="flex border-b border-[#4A7C59]/20">
                                {(() => {
                                  const marketIndex =
                                    Object.keys(markets).indexOf(marketId);
                                  const dataOffset =
                                    marketIndex * (address ? 5 : 3);
                                  const onChainGenesisEnded =
                                    allMarketsData?.[dataOffset]?.result ===
                                    true;
                                  const genesisStatus = getGenesisStatus(
                                    market,
                                    onChainGenesisEnded
                                  );

                                  const availableTabs = [];
                                  if (genesisStatus.canDeposit)
                                    availableTabs.push("deposit");
                                  if (genesisStatus.canWithdraw)
                                    availableTabs.push("withdraw");
                                  if (genesisStatus.canClaim)
                                    availableTabs.push("rewards");

                                  return availableTabs.map((tab) => (
                                    <button
                                      key={tab}
                                      onClick={() =>
                                        setActiveTab(marketId, tab as any)
                                      }
                                      className={`flex-1 px-4 py-3 text-sm font-medium capitalize transition-colors ${
                                        marketStates[marketId].activeTab === tab
                                          ? "text-[#4A7C59] border-b-2 border-[#4A7C59]"
                                          : "text-[#F5F5F5]/50 hover:text-[#F5F5F5]"
                                      }`}
                                    >
                                      {tab}
                                    </button>
                                  ));
                                })()}
                              </div>

                              {/* Tab Content */}
                              <div className="p-6 flex-1">
                                {marketStates[marketId].activeTab ===
                                  "deposit" &&
                                  (() => {
                                    const marketIndex =
                                      Object.keys(markets).indexOf(marketId);
                                    const tokenDataOffset =
                                      marketIndex * (address ? 3 : 1);
                                    const allowance = allTokenData?.[
                                      tokenDataOffset + 2
                                    ]?.result as bigint | undefined;
                                    const depositAmountBN = marketStates[
                                      marketId
                                    ].depositAmount
                                      ? parseEther(
                                          marketStates[marketId].depositAmount
                                        )
                                      : BigInt(0);
                                    const needsApproval =
                                      depositAmountBN > 0 &&
                                      (!allowance ||
                                        allowance < depositAmountBN);

                                    return (
                                      <div className="space-y-2">
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between">
                                            <label className="text-sm text-zinc-400">
                                              From
                                            </label>
                                            <span className="text-xs text-zinc-500">
                                              Balance:{" "}
                                              {formatEther(
                                                walletBalance as bigint
                                              )}{" "}
                                              {collateralSymbol}
                                            </span>
                                          </div>
                                          <div className="relative">
                                            <input
                                              type="number"
                                              value={
                                                marketStates[marketId]
                                                  .depositAmount
                                              }
                                              onChange={(e) =>
                                                setMarketStates((prev) => ({
                                                  ...prev,
                                                  [marketId]: {
                                                    ...prev[marketId],
                                                    depositAmount:
                                                      e.target.value,
                                                  },
                                                }))
                                              }
                                              placeholder="0.0"
                                              className="w-full p-4 bg-[#0F0F0F] text-white border border-zinc-700/50 focus:border-[#4A7C59] focus:ring-1 focus:ring-[#4A7C59]/50 outline-none transition-all pr-24 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleMaxDeposit(marketId)
                                                }
                                                className="text-[#4A7C59] hover:text-[#3A6147] text-sm transition-colors"
                                              >
                                                MAX
                                              </button>
                                              <span className="text-[#F5F5F5]/70">
                                                {collateralSymbol}
                                              </span>
                                            </div>
                                          </div>
                                          <button
                                            onClick={() =>
                                              window.open(
                                                `https://swap.defillama.com/?chain=ethereum&from=0x0000000000000000000000000000000000000000&tab=swap&to=${market.addresses.collateralToken}`,
                                                "_blank"
                                              )
                                            }
                                            className="text-[#4A7C59] hover:text-[#3A6147] text-[10px] transition-colors mt-2 block"
                                          >
                                            Get {collateralSymbol}
                                          </button>
                                        </div>
                                        <button
                                          onClick={() =>
                                            needsApproval
                                              ? handleApprove(marketId)
                                              : handleDeposit(marketId)
                                          }
                                          disabled={
                                            !isConnected ||
                                            isPending ||
                                            !marketStates[marketId]
                                              .depositAmount ||
                                            !(() => {
                                              const marketIndex =
                                                Object.keys(markets).indexOf(
                                                  marketId
                                                );
                                              const dataOffset =
                                                marketIndex * (address ? 5 : 3);
                                              const onChainGenesisEnded =
                                                allMarketsData?.[dataOffset]
                                                  ?.result === true;
                                              const genesisStatus =
                                                getGenesisStatus(
                                                  market,
                                                  onChainGenesisEnded
                                                );
                                              return genesisStatus.canDeposit;
                                            })()
                                          }
                                          className="w-full py-3 bg-[#4A7C59] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4A7C59]/90 transition-colors"
                                        >
                                          {isPending
                                            ? pendingStep === "approval"
                                              ? "Approving..."
                                              : "Depositing..."
                                            : needsApproval
                                            ? "Approve"
                                            : "Deposit"}
                                        </button>
                                      </div>
                                    );
                                  })()}

                                {marketStates[marketId].activeTab ===
                                  "withdraw" && (
                                  <div className="space-y-2">
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <label className="text-sm text-zinc-400">
                                          Withdraw
                                        </label>
                                        <span className="text-xs text-zinc-500">
                                          Balance:{" "}
                                          {formatEther(userBalance as bigint)}{" "}
                                          {collateralSymbol}
                                        </span>
                                      </div>
                                      <div className="relative">
                                        <input
                                          type="number"
                                          value={
                                            marketStates[marketId]
                                              .withdrawAmount
                                          }
                                          onChange={(e) =>
                                            setMarketStates((prev) => ({
                                              ...prev,
                                              [marketId]: {
                                                ...prev[marketId],
                                                withdrawAmount: e.target.value,
                                              },
                                            }))
                                          }
                                          placeholder="0.0"
                                          className="w-full p-4 bg-[#0F0F0F] text-white border border-zinc-700/50 focus:border-[#4A7C59] focus:ring-1 focus:ring-[#4A7C59]/50 outline-none transition-all pr-24 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleMaxWithdraw(marketId)
                                            }
                                            className="text-[#4A7C59] hover:text-[#3A6147] text-sm transition-colors"
                                          >
                                            MAX
                                          </button>
                                          <span className="text-[#F5F5F5]/70">
                                            {collateralSymbol}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleWithdraw(marketId)}
                                      disabled={
                                        !isConnected ||
                                        isPending ||
                                        !marketStates[marketId].withdrawAmount
                                      }
                                      className="w-full py-3 bg-[#4A7C59] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4A7C59]/90 transition-colors"
                                    >
                                      {isPending ? "Pending..." : "Withdraw"}
                                    </button>
                                  </div>
                                )}

                                {marketStates[marketId].activeTab ===
                                  "rewards" && (
                                  <div className="space-y-2">
                                    <div>
                                      <p className="text-sm text-[#F5F5F5]/50 mb-1">
                                        STEAM Rewards
                                      </p>
                                      <p
                                        className={`text-2xl font-medium text-[#4A7C59] ${geo.className}`}
                                      >
                                        {formatEther(
                                          (claimableAmounts as any)
                                            ?.leveragedAmount
                                        )}{" "}
                                        {market.rewardToken.symbol}
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => handleClaim(marketId)}
                                      disabled={!isConnected || isPending}
                                      className="w-full py-3 bg-[#4A7C59] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4A7C59]/90 transition-colors"
                                    >
                                      {isPending
                                        ? "Pending..."
                                        : "Claim Rewards"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed Markets */}
        <div className="mb-8">
          <h2 className={`text-2xl text-[#4A7C59] mb-6 ${geo.className}`}>
            Completed Markets
          </h2>
          {completedMarkets.length === 0 ? (
            <div className="bg-[#1A1A1A]/90 border border-[#4A7C59]/20 p-8 text-center text-[#F5F5F5]/50">
              No completed markets available
            </div>
          ) : (
            <div className="space-y-4">
              {/* Similar structure as active markets but for completed ones */}
              {completedMarkets.map((marketId) => {
                // ... same structure as active markets but without deposit/withdraw options
                return (
                  <div
                    key={marketId}
                    className="bg-[#1A1A1A]/90 border border-[#4A7C59]/20"
                  >
                    {/* Completed market content */}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
