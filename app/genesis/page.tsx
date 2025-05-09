"use client";

import { useState, useEffect, useMemo } from "react";
import { Geo } from "next/font/google";
import { useAccount, useContractReads, useContractWrite } from "wagmi";
import { parseEther } from "viem";
import { markets } from "../../config/contracts";
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

interface ContractReadResult<T> {
  result?: T;
  error?: Error;
  status: "success" | "error" | "loading";
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

  type MarketWrites = {
    deposit: ReturnType<typeof useContractWrite>;
    withdraw: ReturnType<typeof useContractWrite>;
    claim: ReturnType<typeof useContractWrite>;
  };

  type ContractWrites = {
    [key: string]: MarketWrites;
  };

  // Custom hook for market contract writes
  function useMarketContractWrites(marketId: string): MarketWrites {
    const market = markets[marketId];

    const deposit = useContractWrite({
      address: market.addresses.genesis as `0x${string}`,
      abi: genesisABI,
      functionName: "deposit",
    });

    const withdraw = useContractWrite({
      address: market.addresses.genesis as `0x${string}`,
      abi: genesisABI,
      functionName: "withdraw",
    });

    const claim = useContractWrite({
      address: market.addresses.genesis as `0x${string}`,
      abi: genesisABI,
      functionName: "claim",
    });

    return { deposit, withdraw, claim };
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
        functionName: "totalDeposits",
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
    watch: true,
  }) as { data: ContractReadResult<any>[] };

  // Create individual hooks for each market
  const btcMarketWrites = useMarketContractWrites("steth-usd");
  const ethMarketWrites = useMarketContractWrites("steth-usd");

  // Combine all contract writes
  const contractWrites: ContractWrites = useMemo(
    () => ({
      "steth-usd": btcMarketWrites,
    }),
    [btcMarketWrites]
  );

  // Initialize countdowns for each market
  const stethUsdCountdown = useCountdown(markets["steth-usd"].genesis.endDate);

  // Group markets by status
  const { activeMarkets, completedMarkets } = useMemo(() => {
    const active: string[] = [];
    const completed: string[] = [];

    Object.entries(markets).forEach(([id, market], index) => {
      const dataOffset = index * (address ? 5 : 3);
      const isEnded =
        allMarketsData?.[dataOffset]?.result === true ||
        (id === "steth-usd" && stethUsdCountdown.isEnded);

      if (isEnded) {
        completed.push(id);
      } else {
        active.push(id);
      }
    });

    return { activeMarkets: active, completedMarkets: completed };
  }, [address, allMarketsData, stethUsdCountdown]);

  // Get token info for all markets
  const { data: allTokenData } = useContractReads({
    contracts: Object.entries(markets).flatMap(([id, market]) => [
      {
        address: market.addresses.collateralToken as `0x${string}`,
        abi: erc20ABI,
        functionName: "symbol",
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
    watch: true,
  }) as { data: ContractReadResult<any>[] };

  const formatEther = (value: bigint | undefined) => {
    if (!value) return "0";
    return (Number(value) / 1e18).toFixed(4);
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

  const handleDeposit = async (marketId: string) => {
    if (!isConnected || !marketStates[marketId]?.depositAmount || !address)
      return;

    try {
      setIsPending(true);
      const amount = parseEther(marketStates[marketId].depositAmount);
      const write = contractWrites[marketId].deposit;

      await write.writeAsync?.({
        args: [amount, address as `0x${string}`],
      });

      // Reset form
      setMarketStates((prev) => ({
        ...prev,
        [marketId]: { ...prev[marketId], depositAmount: "" },
      }));
    } catch (error: any) {
      console.error("Deposit failed:", error);
    } finally {
      setIsPending(false);
    }
  };

  const handleWithdraw = async (marketId: string) => {
    if (!isConnected || !marketStates[marketId]?.withdrawAmount || !address)
      return;

    try {
      setIsPending(true);
      const amount = parseEther(marketStates[marketId].withdrawAmount);
      const write = contractWrites[marketId].withdraw;

      await write.writeAsync?.({
        args: [address as `0x${string}`, amount],
      });

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

      await write.writeAsync?.({
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

      {/* Navigation */}
      <Navigation />

      <main className="container mx-auto px-6 pt-32 pb-20 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={`text-4xl text-[#4A7C59] ${geo.className}`}>
            GENESIS
          </h1>
          <p className="text-[#F5F5F5]/60 text-sm mt-2 max-w-xl mx-auto">
            Earn rewards for seeding liquidity into new markets. Seeding
            liquidity will give back pegged and leveraged tokens at the end of
            the genesis period resulting in the same net exposure as the
            collateral you deposit.
          </p>
        </div>

        {/* Markets List */}
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Active Markets */}
          <div className="space-y-4">
            <h2 className={`text-2xl text-[#4A7C59] ${geo.className}`}>
              Active Markets
            </h2>
            {activeMarkets.length === 0 ? (
              <div className="bg-black p-8 text-center text-[#F5F5F5]/50 border-none">
                No active markets available
              </div>
            ) : (
              activeMarkets.map((marketId) => {
                const market = markets[marketId];
                const marketIndex = Object.keys(markets).indexOf(marketId);
                const dataOffset = marketIndex * (address ? 5 : 3);
                const tokenDataOffset = marketIndex * (address ? 3 : 1);

                const totalDeposits = allMarketsData?.[dataOffset + 1]?.result;
                const totalRewards = allMarketsData?.[dataOffset + 2]?.result;
                const userBalance = allMarketsData?.[dataOffset + 3]?.result;
                const claimableAmounts =
                  allMarketsData?.[dataOffset + 4]?.result;
                const collateralSymbol =
                  allTokenData?.[tokenDataOffset]?.result;

                return (
                  <div
                    key={marketId}
                    className="bg-[#1A1A1A] p-4 relative z-20"
                  >
                    <div className="absolute inset-0 bg-[#1A1A1A] z-10"></div>
                    <div className="relative z-20">
                      {/* Market Header */}
                      <button
                        onClick={() => toggleMarket(marketId)}
                        className="w-full p-6 flex items-center justify-between hover:bg-[#1A1A1A] transition-colors"
                      >
                        <div className="flex-shrink-0 w-56">
                          <h3
                            className={`text-lg font-medium ${geo.className}`}
                          >
                            {market.description}
                          </h3>
                          <p className="text-sm text-[#F5F5F5]/50 mt-1">
                            Ends in {stethUsdCountdown.text}
                          </p>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-end items-start gap-2">
                            {/* Deposit Box */}
                            <div className="w-36 bg-black p-2 border border-[#4A7C59]/20 relative z-20">
                              <div className="absolute inset-0 bg-black z-10"></div>
                              <div className="relative z-20">
                                <p className="text-xs text-[#F5F5F5]/50 mb-0.5">
                                  Deposit
                                </p>
                                <p className="text-sm font-medium text-[#4A7C59]">
                                  wstETH
                                </p>
                              </div>
                            </div>

                            {/* Pegged Token Box */}
                            <div className="w-36 bg-black p-2 border border-[#4A7C59]/20 relative z-20">
                              <div className="absolute inset-0 bg-black z-10"></div>
                              <div className="relative z-20">
                                <p className="text-xs text-[#F5F5F5]/50 mb-0.5">
                                  Pegged Token
                                </p>
                                <p className="text-sm font-medium text-[#4A7C59]">
                                  zheUSD
                                </p>
                              </div>
                            </div>

                            {/* Leveraged Token Box */}
                            <div className="w-36 bg-black p-2 border border-[#4A7C59]/20 relative z-20">
                              <div className="absolute inset-0 bg-black z-10"></div>
                              <div className="relative z-20">
                                <p className="text-xs text-[#F5F5F5]/50 mb-0.5">
                                  Leveraged Token
                                </p>
                                <p className="text-sm font-medium text-[#4A7C59]">
                                  steamedETH
                                </p>
                              </div>
                            </div>

                            {/* Total Deposits Box */}
                            <div className="w-36 bg-black p-2 border border-[#4A7C59]/20 relative z-20">
                              <div className="absolute inset-0 bg-black z-10"></div>
                              <div className="relative z-20">
                                <p className="text-xs text-[#F5F5F5]/50 mb-0.5">
                                  Total Deposits
                                </p>
                                <p className="text-sm font-medium text-[#4A7C59] truncate">
                                  {formatEther(totalDeposits as bigint)}{" "}
                                  {collateralSymbol as string}
                                </p>
                              </div>
                            </div>

                            {/* Total Rewards Box */}
                            <div className="w-36 bg-black p-2 border border-[#4A7C59]/20 relative z-20">
                              <div className="absolute inset-0 bg-black z-10"></div>
                              <div className="relative z-20">
                                <p className="text-xs text-[#F5F5F5]/50 mb-0.5">
                                  Total Rewards
                                </p>
                                <div className="space-y-0.5">
                                  <p className="text-sm font-medium text-[#4A7C59] truncate">
                                    {formatEther(
                                      (totalRewards as TotalRewards)
                                        ?.peggedAmount
                                    )}{" "}
                                    {market.genesis.rewards.pegged.symbol}
                                  </p>
                                  <p className="text-sm font-medium text-[#4A7C59] truncate">
                                    {formatEther(
                                      (totalRewards as TotalRewards)
                                        ?.leveragedAmount
                                    )}{" "}
                                    {market.genesis.rewards.leveraged.symbol}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Expanded View */}
                      {marketStates[marketId].isExpanded && (
                        <div className="mt-4 p-6 border-t border-[#4A7C59]/20">
                          {/* User Info */}
                          {isConnected ? (
                            <div className="mb-6 grid grid-cols-2 gap-4">
                              <div className="bg-black p-4 border border-[#4A7C59]/20">
                                <p className="text-sm text-[#F5F5F5]/50 mb-1">
                                  Your Balance
                                </p>
                                <p className="text-lg font-medium text-[#4A7C59]">
                                  {formatEther(userBalance as bigint)}{" "}
                                  {collateralSymbol}
                                </p>
                              </div>
                              <div className="bg-black p-4 border border-[#4A7C59]/20">
                                <p className="text-sm text-[#F5F5F5]/50 mb-1">
                                  Claimable Rewards
                                </p>
                                <div className="space-y-1">
                                  <p className="text-lg font-medium text-[#4A7C59]">
                                    {formatEther(
                                      (claimableAmounts as any)?.peggedAmount
                                    )}{" "}
                                    {market.genesis.rewards.pegged.symbol}
                                  </p>
                                  <p className="text-lg font-medium text-[#4A7C59]">
                                    {formatEther(
                                      (claimableAmounts as any)?.leveragedAmount
                                    )}{" "}
                                    {market.genesis.rewards.leveraged.symbol}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="mb-6">
                              <ConnectButton />
                            </div>
                          )}

                          {/* Tabs */}
                          <div className="flex space-x-4 mb-6">
                            <button
                              onClick={() => setActiveTab(marketId, "deposit")}
                              className={`px-4 py-2 text-sm font-medium border border-[#4A7C59]/20 ${
                                marketStates[marketId].activeTab === "deposit"
                                  ? "bg-[#4A7C59] text-white"
                                  : "bg-black text-[#4A7C59] hover:bg-[#4A7C59]/10"
                              }`}
                            >
                              Deposit
                            </button>
                            <button
                              onClick={() => setActiveTab(marketId, "withdraw")}
                              className={`px-4 py-2 text-sm font-medium border border-[#4A7C59]/20 ${
                                marketStates[marketId].activeTab === "withdraw"
                                  ? "bg-[#4A7C59] text-white"
                                  : "bg-black text-[#4A7C59] hover:bg-[#4A7C59]/10"
                              }`}
                            >
                              Withdraw
                            </button>
                            <button
                              onClick={() => setActiveTab(marketId, "rewards")}
                              className={`px-4 py-2 text-sm font-medium border border-[#4A7C59]/20 ${
                                marketStates[marketId].activeTab === "rewards"
                                  ? "bg-[#4A7C59] text-white"
                                  : "bg-black text-[#4A7C59] hover:bg-[#4A7C59]/10"
                              }`}
                            >
                              Rewards
                            </button>
                          </div>

                          {/* Tab Content */}
                          <div className="bg-black p-6 border border-[#4A7C59]/20">
                            {marketStates[marketId].activeTab === "deposit" && (
                              <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                  <input
                                    type="text"
                                    value={marketStates[marketId].depositAmount}
                                    onChange={(e) =>
                                      setMarketStates((prev) => ({
                                        ...prev,
                                        [marketId]: {
                                          ...prev[marketId],
                                          depositAmount: e.target.value,
                                        },
                                      }))
                                    }
                                    placeholder="0.0"
                                    className="flex-1 bg-black text-white p-3 border border-[#4A7C59]/20 focus:outline-none focus:border-[#4A7C59]"
                                  />
                                  <button
                                    onClick={() => handleMaxDeposit(marketId)}
                                    className="px-4 py-2 text-sm bg-[#4A7C59]/10 text-[#4A7C59] hover:bg-[#4A7C59]/20 border border-[#4A7C59]/20"
                                  >
                                    MAX
                                  </button>
                                </div>
                                <button
                                  onClick={() => handleDeposit(marketId)}
                                  disabled={
                                    !isConnected ||
                                    isPending ||
                                    !marketStates[marketId].depositAmount
                                  }
                                  className="w-full py-3 bg-[#4A7C59] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4A7C59]/90"
                                >
                                  {isPending ? "Pending..." : "Deposit"}
                                </button>
                              </div>
                            )}

                            {marketStates[marketId].activeTab ===
                              "withdraw" && (
                              <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                  <input
                                    type="text"
                                    value={
                                      marketStates[marketId].withdrawAmount
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
                                    className="flex-1 bg-black text-white p-3 border border-[#4A7C59]/20 focus:outline-none focus:border-[#4A7C59]"
                                  />
                                  <button
                                    onClick={() => handleMaxWithdraw(marketId)}
                                    className="px-4 py-2 text-sm bg-[#4A7C59]/10 text-[#4A7C59] hover:bg-[#4A7C59]/20 border border-[#4A7C59]/20"
                                  >
                                    MAX
                                  </button>
                                </div>
                                <button
                                  onClick={() => handleWithdraw(marketId)}
                                  disabled={
                                    !isConnected ||
                                    isPending ||
                                    !marketStates[marketId].withdrawAmount
                                  }
                                  className="w-full py-3 bg-[#4A7C59] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4A7C59]/90"
                                >
                                  {isPending ? "Pending..." : "Withdraw"}
                                </button>
                              </div>
                            )}

                            {marketStates[marketId].activeTab === "rewards" && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-[#F5F5F5]/50 mb-1">
                                      Pegged Token Rewards
                                    </p>
                                    <p className="text-lg font-medium text-[#4A7C59]">
                                      {formatEther(
                                        (claimableAmounts as any)?.peggedAmount
                                      )}{" "}
                                      {market.genesis.rewards.pegged.symbol}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-[#F5F5F5]/50 mb-1">
                                      Leveraged Token Rewards
                                    </p>
                                    <p className="text-lg font-medium text-[#4A7C59]">
                                      {formatEther(
                                        (claimableAmounts as any)
                                          ?.leveragedAmount
                                      )}{" "}
                                      {market.genesis.rewards.leveraged.symbol}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleClaim(marketId)}
                                  disabled={!isConnected || isPending}
                                  className="w-full py-3 bg-[#4A7C59] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4A7C59]/90"
                                >
                                  {isPending ? "Pending..." : "Claim Rewards"}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Completed Markets */}
          <div className="space-y-4">
            <h2 className={`text-2xl text-[#4A7C59] ${geo.className}`}>
              Completed Markets
            </h2>
            {completedMarkets.length === 0 ? (
              <div className="bg-[#1A1A1A] p-8 text-center text-[#F5F5F5]/50">
                No completed markets available
              </div>
            ) : (
              completedMarkets.map((marketId) => {
                const market = markets[marketId];
                const marketIndex = Object.keys(markets).indexOf(marketId);
                const dataOffset = marketIndex * (address ? 5 : 3);
                const tokenDataOffset = marketIndex * (address ? 3 : 1);

                const totalDeposits = allMarketsData?.[dataOffset + 1]?.result;
                const totalRewards = allMarketsData?.[dataOffset + 2]?.result;
                const userBalance = allMarketsData?.[dataOffset + 3]?.result;
                const claimableAmounts =
                  allMarketsData?.[dataOffset + 4]?.result;
                const collateralSymbol =
                  allTokenData?.[tokenDataOffset]?.result;

                return (
                  <div
                    key={marketId}
                    className="bg-[#1A1A1A] p-4 relative z-20"
                  >
                    <div className="absolute inset-0 bg-[#1A1A1A] z-10"></div>
                    <div className="relative z-20">
                      {/* Market Header */}
                      <button
                        onClick={() => toggleMarket(marketId)}
                        className="w-full p-6 flex items-center justify-between hover:bg-[#1A1A1A] transition-colors"
                      >
                        <div className="flex-shrink-0 w-56">
                          <h3
                            className={`text-lg font-medium ${geo.className}`}
                          >
                            {market.description}
                          </h3>
                          <p className="text-sm text-[#F5F5F5]/50 mt-1">
                            Ends in {stethUsdCountdown.text}
                          </p>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-end items-start gap-2">
                            {/* Deposit Box */}
                            <div className="w-36 bg-black p-2 border border-[#4A7C59]/20 relative z-20">
                              <div className="absolute inset-0 bg-black z-10"></div>
                              <div className="relative z-20">
                                <p className="text-xs text-[#F5F5F5]/50 mb-0.5">
                                  Deposit
                                </p>
                                <p className="text-sm font-medium text-[#4A7C59]">
                                  wstETH
                                </p>
                              </div>
                            </div>

                            {/* Pegged Token Box */}
                            <div className="w-36 bg-black p-2 border border-[#4A7C59]/20 relative z-20">
                              <div className="absolute inset-0 bg-black z-10"></div>
                              <div className="relative z-20">
                                <p className="text-xs text-[#F5F5F5]/50 mb-0.5">
                                  Pegged Token
                                </p>
                                <p className="text-sm font-medium text-[#4A7C59]">
                                  zheUSD
                                </p>
                              </div>
                            </div>

                            {/* Leveraged Token Box */}
                            <div className="w-36 bg-black p-2 border border-[#4A7C59]/20 relative z-20">
                              <div className="absolute inset-0 bg-black z-10"></div>
                              <div className="relative z-20">
                                <p className="text-xs text-[#F5F5F5]/50 mb-0.5">
                                  Leveraged Token
                                </p>
                                <p className="text-sm font-medium text-[#4A7C59]">
                                  steamedETH
                                </p>
                              </div>
                            </div>

                            {/* Total Deposits Box */}
                            <div className="w-36 bg-black p-2 border border-[#4A7C59]/20 relative z-20">
                              <div className="absolute inset-0 bg-black z-10"></div>
                              <div className="relative z-20">
                                <p className="text-xs text-[#F5F5F5]/50 mb-0.5">
                                  Total Deposits
                                </p>
                                <p className="text-sm font-medium text-[#4A7C59] truncate">
                                  {formatEther(totalDeposits as bigint)}{" "}
                                  {collateralSymbol as string}
                                </p>
                              </div>
                            </div>

                            {/* Total Rewards Box */}
                            <div className="w-36 bg-black p-2 border border-[#4A7C59]/20 relative z-20">
                              <div className="absolute inset-0 bg-black z-10"></div>
                              <div className="relative z-20">
                                <p className="text-xs text-[#F5F5F5]/50 mb-0.5">
                                  Total Rewards
                                </p>
                                <div className="space-y-0.5">
                                  <p className="text-sm font-medium text-[#4A7C59] truncate">
                                    {formatEther(
                                      (totalRewards as TotalRewards)
                                        ?.peggedAmount
                                    )}{" "}
                                    {market.genesis.rewards.pegged.symbol}
                                  </p>
                                  <p className="text-sm font-medium text-[#4A7C59] truncate">
                                    {formatEther(
                                      (totalRewards as TotalRewards)
                                        ?.leveragedAmount
                                    )}{" "}
                                    {market.genesis.rewards.leveraged.symbol}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Expanded View */}
                      {marketStates[marketId].isExpanded && (
                        <div className="mt-4 p-6 border-t border-[#4A7C59]/20">
                          {/* User Info */}
                          {isConnected ? (
                            <div className="mb-6 grid grid-cols-2 gap-4">
                              <div className="bg-black p-4 border border-[#4A7C59]/20">
                                <p className="text-sm text-[#F5F5F5]/50 mb-1">
                                  Your Balance
                                </p>
                                <p className="text-lg font-medium text-[#4A7C59]">
                                  {formatEther(userBalance as bigint)}{" "}
                                  {collateralSymbol}
                                </p>
                              </div>
                              <div className="bg-black p-4 border border-[#4A7C59]/20">
                                <p className="text-sm text-[#F5F5F5]/50 mb-1">
                                  Claimable Rewards
                                </p>
                                <div className="space-y-1">
                                  <p className="text-lg font-medium text-[#4A7C59]">
                                    {formatEther(
                                      (claimableAmounts as any)?.peggedAmount
                                    )}{" "}
                                    {market.genesis.rewards.pegged.symbol}
                                  </p>
                                  <p className="text-lg font-medium text-[#4A7C59]">
                                    {formatEther(
                                      (claimableAmounts as any)?.leveragedAmount
                                    )}{" "}
                                    {market.genesis.rewards.leveraged.symbol}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="mb-6">
                              <ConnectButton />
                            </div>
                          )}

                          {/* Tabs */}
                          <div className="flex space-x-4 mb-6">
                            <button
                              onClick={() => setActiveTab(marketId, "deposit")}
                              className={`px-4 py-2 text-sm font-medium border border-[#4A7C59]/20 ${
                                marketStates[marketId].activeTab === "deposit"
                                  ? "bg-[#4A7C59] text-white"
                                  : "bg-black text-[#4A7C59] hover:bg-[#4A7C59]/10"
                              }`}
                            >
                              Deposit
                            </button>
                            <button
                              onClick={() => setActiveTab(marketId, "withdraw")}
                              className={`px-4 py-2 text-sm font-medium border border-[#4A7C59]/20 ${
                                marketStates[marketId].activeTab === "withdraw"
                                  ? "bg-[#4A7C59] text-white"
                                  : "bg-black text-[#4A7C59] hover:bg-[#4A7C59]/10"
                              }`}
                            >
                              Withdraw
                            </button>
                            <button
                              onClick={() => setActiveTab(marketId, "rewards")}
                              className={`px-4 py-2 text-sm font-medium border border-[#4A7C59]/20 ${
                                marketStates[marketId].activeTab === "rewards"
                                  ? "bg-[#4A7C59] text-white"
                                  : "bg-black text-[#4A7C59] hover:bg-[#4A7C59]/10"
                              }`}
                            >
                              Rewards
                            </button>
                          </div>

                          {/* Tab Content */}
                          <div className="bg-black p-6 border border-[#4A7C59]/20">
                            {marketStates[marketId].activeTab === "deposit" && (
                              <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                  <input
                                    type="text"
                                    value={marketStates[marketId].depositAmount}
                                    onChange={(e) =>
                                      setMarketStates((prev) => ({
                                        ...prev,
                                        [marketId]: {
                                          ...prev[marketId],
                                          depositAmount: e.target.value,
                                        },
                                      }))
                                    }
                                    placeholder="0.0"
                                    className="flex-1 bg-black text-white p-3 border border-[#4A7C59]/20 focus:outline-none focus:border-[#4A7C59]"
                                  />
                                  <button
                                    onClick={() => handleMaxDeposit(marketId)}
                                    className="px-4 py-2 text-sm bg-[#4A7C59]/10 text-[#4A7C59] hover:bg-[#4A7C59]/20 border border-[#4A7C59]/20"
                                  >
                                    MAX
                                  </button>
                                </div>
                                <button
                                  onClick={() => handleDeposit(marketId)}
                                  disabled={
                                    !isConnected ||
                                    isPending ||
                                    !marketStates[marketId].depositAmount
                                  }
                                  className="w-full py-3 bg-[#4A7C59] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4A7C59]/90"
                                >
                                  {isPending ? "Pending..." : "Deposit"}
                                </button>
                              </div>
                            )}

                            {marketStates[marketId].activeTab ===
                              "withdraw" && (
                              <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                  <input
                                    type="text"
                                    value={
                                      marketStates[marketId].withdrawAmount
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
                                    className="flex-1 bg-black text-white p-3 border border-[#4A7C59]/20 focus:outline-none focus:border-[#4A7C59]"
                                  />
                                  <button
                                    onClick={() => handleMaxWithdraw(marketId)}
                                    className="px-4 py-2 text-sm bg-[#4A7C59]/10 text-[#4A7C59] hover:bg-[#4A7C59]/20 border border-[#4A7C59]/20"
                                  >
                                    MAX
                                  </button>
                                </div>
                                <button
                                  onClick={() => handleWithdraw(marketId)}
                                  disabled={
                                    !isConnected ||
                                    isPending ||
                                    !marketStates[marketId].withdrawAmount
                                  }
                                  className="w-full py-3 bg-[#4A7C59] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4A7C59]/90"
                                >
                                  {isPending ? "Pending..." : "Withdraw"}
                                </button>
                              </div>
                            )}

                            {marketStates[marketId].activeTab === "rewards" && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-[#F5F5F5]/50 mb-1">
                                      Pegged Token Rewards
                                    </p>
                                    <p className="text-lg font-medium text-[#4A7C59]">
                                      {formatEther(
                                        (claimableAmounts as any)?.peggedAmount
                                      )}{" "}
                                      {market.genesis.rewards.pegged.symbol}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-[#F5F5F5]/50 mb-1">
                                      Leveraged Token Rewards
                                    </p>
                                    <p className="text-lg font-medium text-[#4A7C59]">
                                      {formatEther(
                                        (claimableAmounts as any)
                                          ?.leveragedAmount
                                      )}{" "}
                                      {market.genesis.rewards.leveraged.symbol}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleClaim(marketId)}
                                  disabled={!isConnected || isPending}
                                  className="w-full py-3 bg-[#4A7C59] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4A7C59]/90"
                                >
                                  {isPending ? "Pending..." : "Claim Rewards"}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
