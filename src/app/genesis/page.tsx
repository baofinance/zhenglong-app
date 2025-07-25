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
import {
  markets,
  getGenesisStatus,
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
import { MarketRow } from "./MarketRow";

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

export interface MarketState {
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

  if (!mounted) {
    return (
      <div className="min-h-screen  text-[#F5F5F5] font-sans relative">
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
    <div className="min-h-screen text-[#F5F5F5] font-sans relative max-w-[1500px] mx-auto">
      {/* Steam Background */}

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
              {activeMarkets.map((marketId) => (
                <MarketRow
                  key={marketId}
                  marketId={marketId}
                  market={(markets as any)[marketId]}
                  allMarketsData={allMarketsData}
                  allTokenData={allTokenData}
                  allMinterData={allMinterData}
                  refetchAllData={refetchAllData}
                  genesisMarkets={genesisMarkets}
                />
              ))}
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
              {completedMarkets.map((marketId) => (
                <MarketRow
                  key={marketId}
                  marketId={marketId}
                  market={(markets as any)[marketId]}
                  allMarketsData={allMarketsData}
                  allTokenData={allTokenData}
                  allMinterData={allMinterData}
                  refetchAllData={refetchAllData}
                  genesisMarkets={genesisMarkets}
                />
              ))}
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
