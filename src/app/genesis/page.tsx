"use client";

import { useState, useEffect, useMemo } from "react";
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
import ConnectButton from "../../components/ConnectButton";
import Link from "next/link";
import Image from "next/image";
import Navigation from "../../components/Navigation";
import GenesisClaim from "../../components/GenesisClaim";
import GenesisDepositModal from "../../components/GenesisDepositModal";
import GenesisWithdrawModal from "../../components/GenesisWithdrawModal";
import GenesisClaimStatusModal from "../../components/GenesisClaimStatusModal";
import { minterABI } from "../../abis/minter";

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

interface MarketState {
  isExpanded: boolean;
  depositAmount: string;
  withdrawAmount: string;
  activeTab: "deposit" | "withdraw" | "rewards" | "claim";
  depositModalOpen: boolean;
  withdrawModalOpen: boolean;
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
          depositModalOpen: false,
          withdrawModalOpen: false,
        };
        return acc;
      }, {} as Record<string, MarketState>);
    }
  );
  const [isPending, setIsPending] = useState(false);
  const [pendingStep, setPendingStep] = useState<"approval" | "deposit" | null>(
    null
  );
  const [showNotice, setShowNotice] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastClaimedMarket, setLastClaimedMarket] = useState<any>(null);
  const [lastClaimedPegged, setLastClaimedPegged] = useState<bigint>(BigInt(0));
  const [lastClaimedLeveraged, setLastClaimedLeveraged] = useState<bigint>(
    BigInt(0)
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

  // Get all markets that have Genesis functionality (same filtering as admin)
  const genesisMarkets = Object.entries(markets).filter(
    ([_, market]) =>
      market.status === "genesis" ||
      market.status === "live" ||
      // Include markets that might have completed genesis but still have "genesis" status in config
      (market.addresses.genesis && market.addresses.genesis.length > 0)
  );

  // Get genesis contract state for all valid Genesis markets
  const { data: allMarketsData, refetch: refetchMarketsData } =
    useContractReads({
      contracts: genesisMarkets.flatMap(([id, market]) => [
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
      query: { enabled: genesisMarkets.length > 0 },
    });

  // Create individual hooks for each market
  const ethMarketWrites = useMarketContractWrites("eth-usd");

  // Track transaction receipt for claim success
  const { isSuccess: claimSuccess } = useWaitForTransactionReceipt({
    hash: ethMarketWrites.claim.data,
  });

  // Show modal when claim transaction is submitted
  useEffect(() => {
    if (ethMarketWrites.claim.data && lastClaimedMarket) {
      setShowSuccessModal(true);
    }
  }, [ethMarketWrites.claim.data, lastClaimedMarket]);

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

    genesisMarkets.forEach(([id, market]: [string, any], index) => {
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
  }, [address, allMarketsData, genesisMarkets]);

  // Get token info for all valid Genesis markets
  const { data: allTokenData, refetch: refetchTokenData } = useContractReads({
    contracts: genesisMarkets.flatMap(([id, market]) => [
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
    query: { enabled: genesisMarkets.length > 0 },
  });

  // Get collateral balances held in each Minter contract (used after genesis completion)
  const { data: allMinterData, refetch: refetchMinterData } = useContractReads({
    contracts: genesisMarkets.map(([id, market]) => ({
      address: market.addresses.minter as `0x${string}`,
      abi: minterABI,
      functionName: "collateralTokenBalance",
    })),
    query: { enabled: genesisMarkets.length > 0 },
  });

  // Function to refresh all contract data
  const refetchAllData = async () => {
    await Promise.all([
      refetchMarketsData(),
      refetchTokenData(),
      refetchMinterData(),
    ]);
  };

  // Refresh data when claim is successful
  useEffect(() => {
    if (claimSuccess) {
      refetchAllData();
    }
  }, [claimSuccess]);

  const formatEther = (value: bigint | undefined) => {
    if (!value) return "0";
    const num = Number(value) / 1e18;
    if (num > 0 && num < 0.0001) return "<0.0001";
    return num.toFixed(4);
  };

  const handleMaxDeposit = (marketId: string) => {
    const marketIndex = genesisMarkets.findIndex(([id]) => id === marketId);
    const tokenDataOffset = marketIndex * (address ? 4 : 2);
    const balance = allTokenData?.[tokenDataOffset + 2]?.result;

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
    const marketIndex = genesisMarkets.findIndex(([id]) => id === marketId);
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
      const market = (markets as any)[marketId];
      const approveTx = await contractWrites[marketId].approve.writeContract({
        address: market.addresses.collateralToken as `0x${string}`,
        abi: erc20ABI,
        functionName: "approve",
        args: [
          (typeof market.addresses.genesis === "string" &&
          market.addresses.genesis.length > 0
            ? market.addresses.genesis
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

      const market = (markets as any)[marketId];
      await deposit.writeContract({
        address: market.addresses.genesis as `0x${string}`,
        abi: genesisABI,
        functionName: "deposit",
        args: [
          amount,
          typeof (address ?? "") === "string" && (address ?? "").length > 0
            ? address ?? ""
            : ("0x0000000000000000000000000000000000000000" as `0x${string}`),
        ],
      });

      // Reset form
      setMarketStates((prev) => ({
        ...prev,
        [marketId]: { ...prev[marketId], depositAmount: "" },
      }));

      // Refresh data after successful deposit
      await refetchAllData();
    } catch (error: any) {
      console.error("Deposit failed:", error);
    } finally {
      setIsPending(false);
      setPendingStep(null);
    }
  };

  const handleWithdraw = async (marketId: string) => {
    if (!isConnected || !address) return;

    try {
      setIsPending(true);
      // Get user's balance for withdrawal
      const marketIndex = genesisMarkets.findIndex(([id]) => id === marketId);
      const dataOffset = marketIndex * (address ? 5 : 3);
      const userBalance = allMarketsData?.[dataOffset + 3]?.result;
      const withdrawAmount =
        userBalance && typeof userBalance === "bigint"
          ? userBalance // Withdraw user's full balance
          : BigInt(
              "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
            ); // MaxUint256 for max

      const write = contractWrites[marketId].withdraw;

      const market = (markets as any)[marketId];
      await write.writeContract({
        address: market.addresses.genesis as `0x${string}`,
        abi: genesisABI,
        functionName: "withdraw",
        args: [
          withdrawAmount, // Amount to withdraw
          address as `0x${string}`, // Receiver address
        ],
      });

      // Reset form
      setMarketStates((prev) => ({
        ...prev,
        [marketId]: { ...prev[marketId], withdrawAmount: "" },
      }));

      // Refresh data after successful withdrawal
      await refetchAllData();
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

      const market = (markets as any)[marketId];
      const marketIndex = genesisMarkets.findIndex(([id]) => id === marketId);
      const dataOffset = marketIndex * (address ? 5 : 3);
      const claimableAmounts = allMarketsData?.[dataOffset + 4]?.result as
        | [bigint, bigint]
        | undefined;

      // Store the claimed amounts and show modal immediately
      if (claimableAmounts) {
        setLastClaimedPegged(claimableAmounts[0] || BigInt(0));
        setLastClaimedLeveraged(claimableAmounts[1] || BigInt(0));
        setLastClaimedMarket(market);
        setShowSuccessModal(true);
      }

      write.writeContract({
        address: market.addresses.genesis as `0x${string}`,
        abi: genesisABI,
        functionName: "claim",
        args: [address as `0x${string}`],
      });

      // Refresh data after successful claim
      await refetchAllData();
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
    tab: "deposit" | "withdraw" | "rewards" | "claim"
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
        <div className="mb-2">
          <h2 className={`text-2xl text-[#4A7C59] mb-2 ${geo.className}`}>
            Active Markets
          </h2>
          {activeMarkets.length === 0 ? (
            <div className="bg-[#1A1A1A]/90 border border-[#4A7C59]/20 p-4 text-center text-[#F5F5F5]/50">
              No active markets available
            </div>
          ) : (
            <div className="space-y-1">
              {activeMarkets.map((marketId) => {
                const market = (markets as any)[marketId];
                const marketIndex = genesisMarkets.findIndex(
                  ([id]) => id === marketId
                );
                const dataOffset = marketIndex * (address ? 5 : 3);
                const tokenDataOffset = marketIndex * (address ? 4 : 2);

                const totalDeposits =
                  allTokenData?.[tokenDataOffset + 1]?.result;
                const totalRewards = allMarketsData?.[dataOffset + 2]?.result;
                const userBalance = address
                  ? allMarketsData?.[dataOffset + 3]?.result
                  : undefined;
                const claimableAmounts = address
                  ? allMarketsData?.[dataOffset + 4]?.result
                  : undefined;
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

                // Calculate the user's share of rewards
                const rewardPool = Number(market.rewardToken.amount);
                const userShare = (() => {
                  const user =
                    userBalance && typeof userBalance === "bigint"
                      ? userBalance
                      : BigInt(0);
                  const total =
                    totalRewards && typeof totalRewards === "bigint"
                      ? totalRewards
                      : BigInt(0);
                  if (total > 0n && user > 0n) {
                    // Calculate share as a float, then round to nearest integer for display
                    const share = (Number(user) / Number(total)) * rewardPool;
                    return Math.floor(share).toLocaleString();
                  }
                  return "0";
                })();

                return (
                  <div key={marketId} className="">
                    {/* Collapsed View / Header */}
                    <button
                      onClick={() => toggleMarket(marketId)}
                      className="w-full flex items-center justify-between bg-[#1A1A1A]/90 border border-[#4A7C59]/20 px-4 py-3"
                    >
                      {/* Left side: Market Info */}
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
                          } ${phaseStyles[genesisStatus.phase]}`}
                        >
                          {phaseInfo.title}
                        </span>
                      </div>

                      {/* Right side: Summary Stats and Tags */}
                      <div className="flex items-center gap-6">
                        {/* Collateral */}
                        <div className="text-center">
                          <div className="text-xs text-[#F5F5F5]/50 mb-1">
                            Collateral
                          </div>
                          <a
                            href={`https://etherscan.io/address/${market.addresses.collateralToken}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-lg font-medium ${geo.className} text-[#4A7C59] hover:text-[#3A6147] transition-colors underline decoration-dotted`}
                          >
                            {collateralSymbol}
                          </a>
                        </div>

                        {/* Price Feed */}
                        <div className="text-center">
                          <div className="text-xs text-[#F5F5F5]/50 mb-1">
                            Price Feed
                          </div>
                          <a
                            href={`https://etherscan.io/address/${market.addresses.priceOracle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-lg font-medium ${geo.className} text-[#4A7C59] hover:text-[#3A6147] transition-colors underline decoration-dotted`}
                          >
                            {market.name}
                          </a>
                        </div>

                        {/* Total Deposits */}
                        <div className="text-center">
                          <div className="text-xs text-[#F5F5F5]/50 mb-1">
                            Total Deposits
                          </div>
                          <div
                            className={`text-lg font-medium ${geo.className}`}
                          >
                            {totalDeposits && typeof totalDeposits === "bigint"
                              ? formatEther(totalDeposits)
                              : "0"}{" "}
                            {collateralSymbol}
                          </div>
                        </div>

                        {/* Total Rewards */}
                        <div className="text-center">
                          <div className="text-xs text-[#F5F5F5]/50 mb-1">
                            Total Rewards
                          </div>
                          <div
                            className={`text-lg font-medium ${geo.className}`}
                          >
                            {Number(market.rewardToken.amount).toLocaleString()}{" "}
                            {market.rewardToken.symbol}
                          </div>
                        </div>

                        {/* Claim Available Tag */}
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
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {marketStates[marketId].isExpanded && (
                      <div className="bg-[#1A1A1A] border border-[#4A7C59]/20 border-t-0 px-4 py-6 shadow-[0_4px_20px_rgba(0,0,0,0.3)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        {/* Main Content - Simplified Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                          {/* Left Column - User Participation */}
                          <div className="space-y-4">
                            {/* User Stats - Top Section */}
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
                                    if (
                                      !isConnected ||
                                      !claimableAmounts ||
                                      !totalRewards
                                    )
                                      return "0%";

                                    const totalRewardSupply =
                                      Array.isArray(totalRewards) &&
                                      totalRewards.length >= 2
                                        ? (
                                            totalRewards as [bigint, bigint]
                                          )[0] +
                                          (totalRewards as [bigint, bigint])[1]
                                        : BigInt(0);
                                    if (totalRewardSupply === 0n) return "0%";

                                    const userClaimableSum =
                                      Array.isArray(claimableAmounts) &&
                                      claimableAmounts.length >= 2
                                        ? (
                                            claimableAmounts as [bigint, bigint]
                                          )[0] +
                                          (
                                            claimableAmounts as [bigint, bigint]
                                          )[1]
                                        : BigInt(0);

                                    const percentage =
                                      (Number(userClaimableSum) /
                                        Number(totalRewardSupply)) *
                                      100;
                                    return `${percentage.toFixed(2)}%`;
                                  })()}
                                </div>
                              </div>
                            </div>

                            {/* Claimable Tokens Section - Bottom Section */}
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
                                    {Number(
                                      market.rewardToken.amount
                                    ).toLocaleString()}{" "}
                                    {market.rewardToken.symbol}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right Column - Genesis Summary */}
                          <div className="space-y-2 h-full flex flex-col">
                            {/* Genesis Status */}
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

                        {/* Claim Button - Outside boxes, bottom right */}
                        <div className="flex justify-end mt-2">
                          {isConnected && genesisStatus.canClaim ? (
                            (() => {
                              const hasClaimableTokens =
                                Array.isArray(claimableAmounts) &&
                                claimableAmounts[0] &&
                                claimableAmounts[1] &&
                                typeof claimableAmounts[0] === "bigint" &&
                                typeof claimableAmounts[1] === "bigint" &&
                                (claimableAmounts[0] > 0n ||
                                  claimableAmounts[1] > 0n);

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
              })}
            </div>
          )}
        </div>

        {/* Completed Markets */}
        <div className="mb-2">
          <h2 className={`text-2xl text-[#4A7C59] mb-2 ${geo.className}`}>
            Completed Markets
          </h2>
          {completedMarkets.length === 0 ? (
            <div className="bg-[#1A1A1A]/90 border border-[#4A7C59]/20 p-4 text-center text-[#F5F5F5]/50">
              No completed markets available
            </div>
          ) : (
            <div className="space-y-1">
              {completedMarkets.map((marketId) => {
                const market = (markets as any)[marketId];
                const marketIndex = genesisMarkets.findIndex(
                  ([id]) => id === marketId
                );
                const dataOffset = marketIndex * (address ? 5 : 3);
                const tokenDataOffset = marketIndex * (address ? 4 : 2);

                const totalRewards = allMarketsData?.[dataOffset + 2]?.result;
                const userBalance = address
                  ? allMarketsData?.[dataOffset + 3]?.result
                  : undefined;
                const claimableAmounts = address
                  ? (allMarketsData?.[dataOffset + 4]?.result as
                      | [bigint, bigint]
                      | undefined)
                  : undefined;
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
                } as const;

                // Determine total deposits source based on phase
                const totalDeposits =
                  genesisStatus.phase === "completed" ||
                  genesisStatus.phase === "closed"
                    ? allMinterData?.[marketIndex]?.result
                    : allTokenData?.[tokenDataOffset + 1]?.result;

                return (
                  <div key={marketId} className="">
                    {/* Collapsed View / Header */}
                    <button
                      onClick={() => toggleMarket(marketId)}
                      className="w-full flex items-center justify-between bg-[#1A1A1A]/90 border border-[#4A7C59]/20 px-4 py-3"
                    >
                      {/* Left side: Market Info */}
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
                          } ${phaseStyles[genesisStatus.phase]}`}
                        >
                          {phaseInfo.title}
                        </span>
                      </div>

                      {/* Right side: Summary Stats and Tags */}
                      <div className="flex items-center gap-6">
                        {/* Your Deposit */}
                        <div className="text-center">
                          <div className="text-xs text-[#F5F5F5]/50 mb-1">
                            Your Deposit
                          </div>
                          <div
                            className={`text-lg font-medium ${geo.className}`}
                          >
                            {isConnected &&
                            userBalance &&
                            typeof userBalance === "bigint"
                              ? formatEther(userBalance)
                              : "0"}{" "}
                            {collateralSymbol}
                          </div>
                        </div>

                        {/* Your Reward Share */}
                        <div className="text-center">
                          <div className="text-xs text-[#F5F5F5]/50 mb-1">
                            Your Reward Share
                          </div>
                          <div
                            className={`text-lg font-medium ${geo.className}`}
                          >
                            {(() => {
                              if (!isConnected || !claimableAmounts)
                                return "0%";

                              const userClaimableSum =
                                claimableAmounts[0] + claimableAmounts[1];
                              const rewardPool = Number(
                                market.rewardToken.amount
                              );
                              if (rewardPool === 0) return "0%";

                              const percentage =
                                (Number(userClaimableSum) * 100) / rewardPool;
                              return percentage.toFixed(2) + "%";
                            })()}
                          </div>
                        </div>

                        {/* Claim Available Tag */}
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
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {marketStates[marketId].isExpanded && (
                      <div className="bg-[#1A1A1A] border border-[#4A7C59]/20 border-t-0 px-6 py-6 shadow-[0_4px_20px_rgba(0,0,0,0.3)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        {/* Main Content - Claimable Tokens */}
                        <div className="space-y-4">
                          {/* Claimable Tokens Section */}
                          <div className="space-y-2">
                            <div className="text-xs text-zinc-400 uppercase tracking-wider">
                              Claimable Tokens
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-[#202020] border-2 border-[#4A7C59] p-3 text-center">
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
                              <div className="bg-[#202020] border-2 border-[#4A7C59] p-3 text-center">
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
                              <div className="bg-[#202020] border-2 border-[#4A7C59] p-3 text-center">
                                <div className="text-xs text-zinc-400 mb-1 uppercase tracking-wider">
                                  Rewards
                                </div>
                                <div
                                  className={`text-base font-medium text-yellow-400 ${geo.className}`}
                                >
                                  {Number(
                                    market.rewardToken.amount
                                  ).toLocaleString()}{" "}
                                  {market.rewardToken.symbol}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Claim Button */}
                          <div className="flex justify-end mt-2">
                            {isConnected && genesisStatus.canClaim ? (
                              (() => {
                                const hasClaimableTokens =
                                  Array.isArray(claimableAmounts) &&
                                  claimableAmounts[0] &&
                                  claimableAmounts[1] &&
                                  typeof claimableAmounts[0] === "bigint" &&
                                  typeof claimableAmounts[1] === "bigint" &&
                                  (claimableAmounts[0] > 0n ||
                                    claimableAmounts[1] > 0n);

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
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Transaction Status Modal */}
      <GenesisClaimStatusModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        market={lastClaimedMarket}
        claimedPegged={lastClaimedPegged}
        claimedLeveraged={lastClaimedLeveraged}
        transactionHash={ethMarketWrites.claim.data}
        onClaimSuccess={refetchAllData}
      />
    </div>
  );
}
