"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
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
import Info from "pixelarticons/svg/info-box.svg";
import Navigation from "../../components/Navigation";
import GenesisClaim from "../../components/GenesisClaim";
import { GenesisDepositModal } from "../../components/GenesisDepositModal";
import { GenesisWithdrawModal } from "../../components/GenesisWithdrawModal";
import GenesisClaimStatusModal from "../../components/GenesisClaimStatusModal";
import GenesisSummaryModal from "../../components/GenesisSummaryModal";
import { minterABI } from "../../abis/minter";
import GenesisAPRCalculator from "../../components/GenesisAPRCalculator";

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
  const [isSummaryModalOpen, setSummaryModalOpen] = useState(false);
  const [selectedMarketForSummary, setSelectedMarketForSummary] =
    useState<string>("");

  const publicClient = usePublicClient();

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

  // Track transaction receipt for claim success (narrow hash type to avoid deep TS instantiation)
  const claimTxHash = (ethMarketWrites.claim.data ?? undefined) as
    | `0x${string}`
    | undefined;
  const { isSuccess: claimSuccess } = useWaitForTransactionReceipt({
    hash: claimTxHash,
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
  const activeMarkets: string[] = [];
  const completedMarkets: string[] = [];
  genesisMarkets.forEach(([id], index) => {
    const dataOffset = index * (address ? 5 : 3);
    const onChainGenesisEnded = allMarketsData?.[dataOffset]?.result === true;
    const genesisStatus = getGenesisStatus(
      (markets as any)[id],
      onChainGenesisEnded
    );
    if (
      genesisStatus.onChainStatus === "completed" ||
      genesisStatus.onChainStatus === "closed"
    ) {
      completedMarkets.push(id);
    } else {
      activeMarkets.push(id);
    }
  });

  // Note: APR calculator will read per-row totals directly from table offsets

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
    // Sequential to avoid deep generic instantiation in Promise.all
    await refetchMarketsData();
    await refetchTokenData();
    await refetchMinterData();
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

  return (
    <div className="min-h-screen text-[#F5F5F5] max-w-[1300px] mx-auto font-sans relative">
      <main className="container mx-auto px-4 sm:px-10 pt-[6rem] pb-3 relative z-10">
        {/* Header */}
        <div className="text-center mb-4 flex items-center">
          <button
            onClick={() => {
              setSelectedMarketForSummary("eth-usd"); // Or dynamically set based on context
              setSummaryModalOpen(true);
            }}
            className="mr-4"
          >
            <Image
              src={Info}
              alt="Info"
              width={24}
              height={24}
              className="w-6 h-6 filter invert brightness-0"
            />
          </button>
          <h1
            className={`text-4xl font-medium text-left text-white ${geo.className}`}
          >
            GENESIS
          </h1>
          <div className="ml-auto"></div>
        </div>

        {/* Active Markets */}
        <div className="space-y-4">
          <div className="shadow-lg bg-zinc-900/50 outline pb-2 outline-1 outline-white/10 overflow-x-auto">
            <h2 className={`text-xl text-white mb-2 font-space-grotesk uppercase font-bold p-6 pb-2`}>
              Active Markets
            </h2>
            {activeMarkets.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-white/60">No active markets available</p>
              </div>
            ) : (
              <table className="min-w-full text-left text-lg font-space-grotesk table-fixed">
                <thead>
                  <tr className="border-b border-white/10 uppercase font-space-grotesk font-bold text-xs">
                    <th className="py-4 px-8 font-normal">Market</th>
                    <th className="w-48 py-3 px-6 text-right font-normal">
                      Collateral
                    </th>
                    <th className="w-48 py-3 px-6 text-right font-normal">
                      Total Deposits
                    </th>
                    <th className="w-48 py-3 px-6 text-right font-normal">
                      Total Rewards
                    </th>
                    <th className="w-48 py-3 px-6 text-right font-normal">
                      Your Deposit
                    </th>
                    <th className="w-48 py-3 px-6 text-right font-normal">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activeMarkets.map((marketId) => {
                    const market = (markets as any)[marketId];
                    const marketIndex = genesisMarkets.findIndex(
                      ([id]) => id === marketId
                    );
                    const dataOffset = marketIndex * (address ? 5 : 3);
                    const tokenDataOffset = marketIndex * (address ? 4 : 2);

                    const totalDeposits =
                      allTokenData?.[tokenDataOffset + 1]?.result;
                    const totalRewards =
                      allMarketsData?.[dataOffset + 2]?.result;
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

                    return (
                      <Fragment key={marketId}>
                        <tr
                          id={`genesis-row-${marketId}`}
                          onClick={() => toggleMarket(marketId)}
                          className="transition hover:bg-grey-light/20 text-sm cursor-pointer border-t border-white/10"
                        >
                          <td className="py-2 px-8 whitespace-nowrap">
                            <div className="flex items-center gap-4">
                              <Image
                                src={market.chain.logo}
                                alt={market.chain.name}
                                width={32}
                                height={32}
                                className="flex-shrink-0"
                              />
                              <div className="flex flex-col items-start gap-1">
                                <span className="font-medium">
                                  {market.name}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-6 text-right">
                            <a
                              href={`https://etherscan.io/address/${market.addresses.collateralToken}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`text-sm font-medium text-white hover:text-grey-light transition-colors underline decoration-dotted`}
                            >
                              {collateralSymbol}
                            </a>
                          </td>
                          <td className="py-2 px-6 text-right">
                            {totalDeposits && typeof totalDeposits === "bigint"
                              ? formatEther(totalDeposits)
                              : "0"}{" "}
                            {collateralSymbol}
                          </td>
                          <td className="py-2 px-6 text-right">
                            {Number(market.rewardToken.amount).toLocaleString()}{" "}
                            {market.rewardToken.symbol}
                          </td>
                          <td className="py-2 px-6 text-right">
                            {isConnected &&
                            userBalance &&
                            typeof userBalance === "bigint"
                              ? formatEther(userBalance)
                              : "0"}{" "}
                            {collateralSymbol}
                          </td>
                          <td className="py-2 px-6 text-right">
                            <span
                              className={`text-sm inline-block px-3 py-1 border font-bold ${
                                phaseStyles[genesisStatus.phase]
                              }`}
                            >
                              {phaseInfo.title}
                            </span>
                          </td>
                        </tr>
                        {marketStates[marketId].isExpanded && (
                          <tr>
                            <td colSpan={6} className="bg-black/20 p-6">
                              {/* Stats strip */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-zinc-900/40 border border-white/10 p-3">
                                  <div className="text-[10px] uppercase text-white/50 font-bold tracking-wider">Your Deposit</div>
                                  <div className="text-sm font-mono text-white mt-1">
                                    {isConnected && userBalance && typeof userBalance === "bigint"
                                      ? formatEther(userBalance)
                                      : "0"} {collateralSymbol}
                                  </div>
                                </div>
                                <div className="bg-zinc-900/40 border border-white/10 p-3">
                                  <div className="text-[10px] uppercase text-white/50 font-bold tracking-wider">Total Deposits</div>
                                  <div className="text-sm font-mono text-white mt-1">
                                    {totalDeposits && typeof totalDeposits === "bigint" ? formatEther(totalDeposits) : "0"} {collateralSymbol}
                                  </div>
                                </div>
                                <div className="bg-zinc-900/40 border border-white/10 p-3">
                                  <div className="text-[10px] uppercase text-white/50 font-bold tracking-wider">Rewards</div>
                                  <div className="text-sm font-mono text-white mt-1">
                                    {Number(market.rewardToken.amount).toLocaleString()} {market.rewardToken.symbol}
                                  </div>
                                </div>
                                <div className="bg-zinc-900/40 border border-white/10 p-3">
                                  <div className="text-[10px] uppercase text-white/50 font-bold tracking-wider">Status</div>
                                  <div className="mt-1">
                                    <span className={`text-xs inline-block px-2 py-0.5 border font-bold ${phaseStyles[genesisStatus.phase]}`}>{phaseInfo.title}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex flex-wrap gap-3 mb-6">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMarketStates((prev) => ({
                                      ...prev,
                                      [marketId]: { ...prev[marketId], depositModalOpen: true },
                                    }));
                                  }}
                                  className="px-4 py-2 bg-[#4A7C59] hover:bg-[#3A6147] text-white text-sm"
                                >
                                  Deposit
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMarketStates((prev) => ({
                                      ...prev,
                                      [marketId]: { ...prev[marketId], withdrawModalOpen: true },
                                    }));
                                  }}
                                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm"
                                >
                                  Withdraw
                                </button>
                                {isConnected && genesisStatus.canClaim ? (
                                  (() => {
                                    const hasClaimableTokens =
                                      Array.isArray(claimableAmounts) &&
                                      claimableAmounts[0] &&
                                      claimableAmounts[1] &&
                                      typeof claimableAmounts[0] === "bigint" &&
                                      typeof claimableAmounts[1] === "bigint" &&
                                      (claimableAmounts[0] > 0n || claimableAmounts[1] > 0n);

                                    return (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleClaim(marketId);
                                        }}
                                        disabled={!hasClaimableTokens}
                                        className={`px-4 py-2 text-sm ${hasClaimableTokens ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-zinc-700 text-zinc-400 cursor-not-allowed"}`}
                                      >
                                        {hasClaimableTokens ? "Claim" : "No Tokens"}
                                      </button>
                                    );
                                  })()
                                ) : (
                                  <div className="px-3 py-2 text-xs text-[#F5F5F5]/50">{genesisStatus.canClaim ? "Connect wallet to claim" : "Claiming not available"}</div>
                                )}
                              </div>

                              {/* Claimable list */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                <div className="bg-zinc-900/30 border border-white/10 p-3">
                                  <div className="text-[10px] uppercase text-white/50 font-bold tracking-wider">{market.peggedToken.name}</div>
                                  <div className="text-sm font-mono text-white mt-1">
                                    {Array.isArray(claimableAmounts) && claimableAmounts[0] && typeof claimableAmounts[0] === "bigint"
                                      ? formatEther(claimableAmounts[0])
                                      : "0"}
                                  </div>
                                </div>
                                <div className="bg-zinc-900/30 border border-white/10 p-3">
                                  <div className="text-[10px] uppercase text-white/50 font-bold tracking-wider">{market.leveragedToken.name}</div>
                                  <div className="text-sm font-mono text-white mt-1">
                                    {Array.isArray(claimableAmounts) && claimableAmounts[1] && typeof claimableAmounts[1] === "bigint"
                                      ? formatEther(claimableAmounts[1])
                                      : "0"}
                                  </div>
                                </div>
                                <div className="bg-zinc-900/30 border border-white/10 p-3">
                                  <div className="text-[10px] uppercase text-white/50 font-bold tracking-wider">Reward Pool</div>
                                  <div className="text-sm font-mono text-white mt-1">
                                    {Number(market.rewardToken.amount).toLocaleString()} {market.rewardToken.symbol}
                                  </div>
                                </div>
                              </div>

                              {/* APR Calculator collapsible */}
                              <details className="group">
                                <summary className="list-none cursor-pointer select-none text-xs uppercase text-white/60 tracking-wider">
                                  <span className="group-open:hidden">Show APR Calculator</span>
                                  <span className="hidden group-open:inline">Hide APR Calculator</span>
                                </summary>
                                <div className="mt-3">
                                  <GenesisAPRCalculator
                                    marketId={marketId}
                                    rewardTokenSymbol={market.rewardToken.symbol}
                                    rewardPoolAmount={Number(market.rewardToken.amount)}
                                    totalDeposits={(allTokenData?.[tokenDataOffset + 1]?.result as bigint | undefined) ?? undefined}
                                    collateralSymbol={(allTokenData?.[tokenDataOffset]?.result as string | undefined) ?? "COLL"}
                                  />
                                </div>
                              </details>

                              {/* Modals */}
                              <GenesisDepositModal
                                isOpen={marketStates[marketId].depositModalOpen}
                                onClose={() =>
                                  setMarketStates((prev) => ({
                                    ...prev,
                                    [marketId]: { ...prev[marketId], depositModalOpen: false },
                                  }))
                                }
                                genesisAddress={market.addresses.genesis}
                                collateralAddress={market.addresses.collateralToken}
                                collateralSymbol={collateralSymbol as string}
                                onSuccess={refetchAllData}
                              />
                              <GenesisWithdrawModal
                                isOpen={marketStates[marketId].withdrawModalOpen}
                                onClose={() =>
                                  setMarketStates((prev) => ({
                                    ...prev,
                                    [marketId]: { ...prev[marketId], withdrawModalOpen: false },
                                  }))
                                }
                                genesisAddress={market.addresses.genesis}
                                collateralSymbol={collateralSymbol as string}
                                userDeposit={(userBalance as bigint) || 0n}
                                onSuccess={refetchAllData}
                              />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Completed Markets */}
        <div className="space-y-4">
          <div className="shadow-lg bg-zinc-900/50 outline pb-2 outline-1 outline-white/10 overflow-x-auto">
            <h2 className={`text-lg text-white mb-2 font-space-grotesk uppercase font-bold p-6 pb-2`}>
              Completed Markets
            </h2>
            {completedMarkets.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-white/60">No completed markets available</p>
              </div>
            ) : (
              <table className="min-w-full text-left font-geo text-xl table-fixed">
                <thead>
                  <tr className="border-b border-white/10 uppercase text-base">
                    <th className="py-4 px-8 font-normal">Market</th>
                    <th className="w-48 py-3 px-6 text-right font-normal">
                      Your Deposit
                    </th>
                    <th className="w-48 py-3 px-6 text-right font-normal">
                      Your Reward Share
                    </th>
                    <th className="w-48 py-3 px-6 text-right font-normal">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {completedMarkets.map((marketId) => {
                    const market = (markets as any)[marketId];
                    const marketIndex = genesisMarkets.findIndex(
                      ([id]) => id === marketId
                    );
                    const dataOffset = marketIndex * (address ? 5 : 3);
                    const tokenDataOffset = marketIndex * (address ? 4 : 2);

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

                    return (
                      <Fragment key={marketId}>
                        <tr
                          onClick={() => toggleMarket(marketId)}
                          className="transition hover:bg-grey-light/20 text-md cursor-pointer border-t border-white/10"
                        >
                          <td className="py-2 px-8 whitespace-nowrap">
                            <div className="flex items-center gap-4">
                              <Image
                                src={market.chain.logo}
                                alt={market.chain.name}
                                width={32}
                                height={32}
                                className="flex-shrink-0"
                              />
                              <div className="flex flex-col items-start gap-1">
                                <span className="font-medium">
                                  {market.name}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-6 text-right">
                            {isConnected &&
                            userBalance &&
                            typeof userBalance === "bigint"
                              ? formatEther(userBalance)
                              : "0"}{" "}
                            {collateralSymbol}
                          </td>
                          <td className="py-2 px-6 text-right">
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
                          </td>
                          <td className="py-2 px-6 text-right">
                            <span
                              className={`text-sm inline-block px-3 py-1 border font-bold ${
                                phaseStyles[genesisStatus.phase]
                              }`}
                            >
                              {phaseInfo.title}
                            </span>
                          </td>
                        </tr>
                        {marketStates[marketId].isExpanded && (
                          <tr>
                            <td colSpan={4} className="bg-black/20 p-6">
                              {/* Stats strip */}
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-zinc-900/40 border border-white/10 p-3">
                                  <div className="text-[10px] uppercase text-white/50 font-bold tracking-wider">Your Deposit</div>
                                  <div className="text-sm font-mono text-white mt-1">
                                    {isConnected && userBalance && typeof userBalance === "bigint" ? formatEther(userBalance) : "0"} {collateralSymbol}
                                  </div>
                                </div>
                                <div className="bg-zinc-900/40 border border-white/10 p-3">
                                  <div className="text-[10px] uppercase text-white/50 font-bold tracking-wider">Claimable Total</div>
                                  <div className="text-sm font-mono text-white mt-1">
                                    {(() => {
                                      const sum = Array.isArray(claimableAmounts)
                                        ? ((claimableAmounts[0] || 0n) + (claimableAmounts[1] || 0n))
                                        : 0n;
                                      return Number(sum) === 0 ? "0" : formatEther(sum as bigint);
                                    })()}
                                  </div>
                                </div>
                                <div className="bg-zinc-900/40 border border-white/10 p-3">
                                  <div className="text-[10px] uppercase text-white/50 font-bold tracking-wider">Status</div>
                                  <div className="mt-1">
                                    <span className={`text-xs inline-block px-2 py-0.5 border font-bold ${phaseStyles[genesisStatus.phase]}`}>{phaseInfo.title}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex flex-wrap gap-3 mb-6">
                                {isConnected && genesisStatus.canClaim ? (
                                  (() => {
                                    const hasClaimableTokens =
                                      Array.isArray(claimableAmounts) &&
                                      claimableAmounts[0] &&
                                      claimableAmounts[1] &&
                                      typeof claimableAmounts[0] === "bigint" &&
                                      typeof claimableAmounts[1] === "bigint" &&
                                      (claimableAmounts[0] > 0n || claimableAmounts[1] > 0n);

                                    return (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleClaim(marketId);
                                        }}
                                        disabled={!hasClaimableTokens}
                                        className={`px-4 py-2 text-sm ${hasClaimableTokens ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-zinc-700 text-zinc-400 cursor-not-allowed"}`}
                                      >
                                        {hasClaimableTokens ? "Claim" : "No Tokens"}
                                      </button>
                                    );
                                  })()
                                ) : (
                                  <div className="px-3 py-2 text-xs text-[#F5F5F5]/50">{genesisStatus.canClaim ? "Connect wallet to claim" : "Claiming not available"}</div>
                                )}
                              </div>

                              {/* Claimable list */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-zinc-900/30 border border-white/10 p-3">
                                  <div className="text-[10px] uppercase text-white/50 font-bold tracking-wider">{market.peggedToken.name}</div>
                                  <div className="text-sm font-mono text-white mt-1">
                                    {Array.isArray(claimableAmounts) && claimableAmounts[0] && typeof claimableAmounts[0] === "bigint"
                                      ? formatEther(claimableAmounts[0])
                                      : "0"}
                                  </div>
                                </div>
                                <div className="bg-zinc-900/30 border border-white/10 p-3">
                                  <div className="text-[10px] uppercase text-white/50 font-bold tracking-wider">{market.leveragedToken.name}</div>
                                  <div className="text-sm font-mono text-white mt-1">
                                    {Array.isArray(claimableAmounts) && claimableAmounts[1] && typeof claimableAmounts[1] === "bigint"
                                      ? formatEther(claimableAmounts[1])
                                      : "0"}
                                  </div>
                                </div>
                                <div className="bg-zinc-900/30 border border-white/10 p-3">
                                  <div className="text-[10px] uppercase text-white/50 font-bold tracking-wider">Reward Pool</div>
                                  <div className="text-sm font-mono text-white mt-1">
                                    {Number(market.rewardToken.amount).toLocaleString()} {market.rewardToken.symbol}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
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

      {/* Genesis Summary Modal */}
      <GenesisSummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        marketName={
          selectedMarketForSummary
            ? (markets as any)[selectedMarketForSummary].name
            : ""
        }
      />
    </div>
  );
}