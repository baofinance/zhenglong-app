"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Geo } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import {
  useAccount,
  useContractReads,
  useContractWrite,
  useContractRead,
  useChainId,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { markets } from "../config/markets";
import TradingViewChart from "../components/TradingViewChart";
import HistoricalDataChart from "@/components/HistoricalDataChart";
import ConnectButton from "../components/ConnectButton";
import Navigation from "../components/Navigation";
import MintRedeemForm from "@/components/MintRedeemForm"; // Adjust path as needed
import MarketSelector from "@/components/MarketSelector";
import Head from "next/head";
import SystemHealthComponent from "@/components/SystemHealth";
import clsx from "clsx";

type TokenType = "LONG" | "STEAMED";
type TokenAction = "MINT" | "REDEEM";

interface SystemHealthProps {
  marketId: string;
  collateralTokenBalance?: string;
  geoClassName?: string;
}

interface WagmiContractResult {
  error?: Error;
  result?: bigint;
  status: "success" | "failure";
}

interface ContractReadResult extends WagmiContractResult {}

interface SystemHealthValueProps {
  type:
    | "collateralValue"
    | "collateralTokens"
    | "collateralRatio"
    | "peggedValue"
    | "peggedTokens"
    | "leveragedValue"
    | "leveragedTokens";
  marketId: string;
  collateralTokenBalance?: string;
  collateralAllowance?: { result?: bigint }[];
  peggedAllowance?: { result?: bigint }[];
  leveragedAllowance?: { result?: bigint }[];
  totalCollateralValue?: string;
  collateralRatio?: string;
  peggedTokenData?: WagmiContractResult[];
  leveragedTokenData?: WagmiContractResult[];
  priceData?: bigint;
  leveragedTokenPrice?: bigint;
}

// Helper functions
const formatValue = (value: string | undefined): string => {
  if (!value) return "0";
  // Remove any trailing zeros after decimal point
  return parseFloat(value).toString();
};

const formatAllowance = (
  allowance: { result?: bigint } | undefined
): string => {
  if (!allowance || typeof allowance.result === "undefined") {
    return "0";
  }
  return formatEther(allowance.result);
};

const formatTokenBalance = (balance: bigint | undefined): string => {
  if (typeof balance === "undefined") {
    return "0";
  }
  return formatEther(balance);
};

// Calculate output amount based on input
const calculateOutput = (inputValue: number): string => {
  return inputValue.toString();
};

// Calculate input amount based on output
const calculateInput = (outputValue: number): string => {
  return outputValue.toString();
};

// Helper function to safely get bigint result
const getContractResult = (data: any): bigint | undefined => {
  if (data?.status === "success" && typeof data?.result === "bigint") {
    return data.result;
  }
  return undefined;
};

// Helper function to safely get bigint result from contract read
const getContractReadResult = (
  data: WagmiContractResult | undefined
): bigint => {
  if (!data || data.status !== "success" || !data.result) {
    return BigInt(0);
  }
  return data.result;
};

const SystemHealthValue: React.FC<SystemHealthValueProps> = ({
  type,
  marketId,
  collateralTokenBalance,
  collateralAllowance,
  peggedAllowance,
  leveragedAllowance,
  totalCollateralValue,
  collateralRatio,
  peggedTokenData,
  leveragedTokenData,
  priceData,
  leveragedTokenPrice,
}) => {
  const getValue = (): string => {
    switch (type) {
      case "collateralValue":
        return totalCollateralValue || "$0";
      case "collateralTokens":
        return formatValue(collateralTokenBalance);
      case "collateralRatio":
        return collateralRatio ? `${collateralRatio}%` : "0%";
      case "peggedValue":
      case "peggedTokens": {
        // Get the pegged token balance from the minter contract
        const peggedBalance =
          peggedTokenData?.[0] && getContractResult(peggedTokenData[0]);
        if (!peggedBalance) return "0";

        // Convert from raw value (with 18 decimals) to actual token amount
        const formattedValue = Number(formatEther(peggedBalance));
        // For pegged tokens, value in USD equals token amount (1:1 peg)
        return type === "peggedValue"
          ? formattedValue.toFixed(2)
          : formattedValue.toFixed(4);
      }
      case "leveragedValue": {
        // Get the leveraged token balance from the minter contract
        const leveragedBalance =
          leveragedTokenData?.[0] && getContractResult(leveragedTokenData[0]);
        if (!leveragedBalance || !leveragedTokenPrice) return "0";

        // Correct Calculation: (balance * price) / (10^18 * 10^18)
        const leveragedValue =
          (Number(leveragedBalance) * Number(leveragedTokenPrice)) / 1e36;
        return leveragedValue.toFixed(2);
      }
      case "leveragedTokens": {
        // Get the leveraged token balance from the minter contract
        const leveragedBalance =
          leveragedTokenData?.[0] && getContractResult(leveragedTokenData[0]);
        if (!leveragedBalance) return "0";

        // For token amount display
        if (type === "leveragedTokens") {
          const formattedTokens = Number(formatEther(leveragedBalance));
          console.log("Raw leveraged balance:", leveragedBalance.toString());
          console.log("Formatted leveraged balance:", formattedTokens);
          return formattedTokens.toFixed(4);
        }

        // For value calculation
        const leveragedOutput =
          leveragedTokenData?.[1] && getContractResult(leveragedTokenData[1]);
        if (!leveragedOutput || !priceData) return "0";

        const leveragedValue =
          (Number(formatEther(leveragedBalance)) *
            Number(formatEther(leveragedOutput)) *
            Number(formatEther(priceData))) /
          1e8;
        return leveragedValue.toFixed(2);
      }
      default:
        return "0";
    }
  };

  return <>{getValue()}</>;
};

const SystemHealth = Object.assign(SystemHealthComponent, {
  Value: SystemHealthValue,
});

// Add TokenType to page.tsx if it was removed, or ensure it's available
// Assuming tokens constant is available or we define a default for page-level chart
const pageScopedTokens = {
  LONG: ["zheUSD"], // Define a sensible default, e.g., the primary pegged token for the market context
  STEAMED: ["steamedETH"], // Or primary leveraged token
};

export default function App() {
  // State hooks
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [selectedMarket, setSelectedMarket] = useState<string>("eth-usd");
  const [selectedType, setSelectedType] = useState<TokenType>("LONG");
  const formCardRef = useRef<HTMLDivElement>(null);
  const chartCardRef = useRef<HTMLDivElement>(null);

  // Effect hooks
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const formEl = formCardRef.current;
    const chartEl = chartCardRef.current;

    if (!formEl || !chartEl || !mounted) return;

    const setHeights = () => {
      if (window.innerWidth >= 1024) {
        // Tailwind's lg breakpoint
        const formHeight = formEl.offsetHeight;
        chartEl.style.height = `${formHeight}px`;
      } else {
        chartEl.style.height = "auto";
      }
    };

    const observer = new ResizeObserver(setHeights);
    observer.observe(formEl);

    window.addEventListener("resize", setHeights);

    setHeights(); // Set initial height

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", setHeights);
    };
  }, [mounted]);

  // Get the current market info from both configs
  const currentMarket = useMemo(() => {
    const market = markets[selectedMarket as keyof typeof markets];
    return market ? { ...market, id: selectedMarket } : null;
  }, [selectedMarket]);

  const currentMarketInfo = useMemo(
    () => markets[selectedMarket as keyof typeof markets],
    [selectedMarket]
  );

  // Define state for PriceChart props at page level
  // Default to LONG type and its first token for the current market
  const pageSelectedType: TokenType = "LONG"; // Default to LONG for page-level chart
  const pageSelectedToken: string = pageScopedTokens[pageSelectedType][0]; // Get the default token for LONG

  const handleMarketChange = (marketId: string) => {
    setSelectedMarket(marketId);
  };

  const healthStats = [
    {
      label: "Total Collateral",
      value: (
        <SystemHealth.Value type="collateralValue" marketId={selectedMarket} />
      ),
    },
    {
      label: "Pegged Tokens",
      value: (
        <SystemHealth.Value type="peggedTokens" marketId={selectedMarket} />
      ),
    },
    {
      label: "Leveraged Tokens",
      value: (
        <SystemHealth.Value type="leveragedTokens" marketId={selectedMarket} />
      ),
    },
    {
      label: "Collateral Ratio",
      value: (
        <SystemHealth.Value type="collateralRatio" marketId={selectedMarket} />
      ),
    },
    {
      label: "Price Oracle",
      value: "Chainlink",
    },
  ];

  // The main return statement of page.tsx
  return (
    <>
      <Head>
        <title>Zhenglong</title>
        <meta name="description" content="Zhenglong App" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="max-w-[1300px] px-4 sm:px-10 mx-auto">
        <main className="container mx-auto max-w-full pt-28 pb-20">
          {/* System Health Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {healthStats.map((stat, index) => (
              <div key={stat.label} className="relative text-left">
                {index < healthStats.length - 1 && (
                  <div className="absolute top-0 right-0 h-full w-px bg-zinc-700 mr-2" />
                )}
                <p className="text-md font-geo font-bold text-zinc-400 mb-1">
                  {stat.label}
                </p>
                <p className={`text-xl font-bold font-mono text-white`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Market Selector & Token Info */}
          <div className="max-w-7xl mx-auto mb-4 mt-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Left: Market Selector */}
            <MarketSelector
              selectedMarketId={selectedMarket}
              onMarketChange={handleMarketChange}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <div>
              <div className="flex mb-4 gap-3">
                <button
                  onClick={() => setSelectedType("LONG")}
                  className={clsx(
                    `py-2 text-2xl font-semibold transition-colors`,
                    selectedType === "LONG"
                      ? "text-white"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  Pegged (zheETH)
                </button>
                <button
                  onClick={() => setSelectedType("STEAMED")}
                  className={clsx(
                    `py-2 text-2xl font-semibold transition-colors`,
                    selectedType === "STEAMED"
                      ? "text-white"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  Leverage (steamed)
                </button>
              </div>
              {mounted && currentMarket ? (
                <div ref={formCardRef}>
                  <MintRedeemForm
                    currentMarket={currentMarket}
                    isConnected={isConnected}
                    userAddress={address}
                    marketInfo={currentMarketInfo}
                    selectedType={selectedType}
                  />
                </div>
              ) : (
                <div className="bg-[#1C1C1C] border border-zinc-800 p-6 h-full">
                  <h2 className={`text-2xl text-white mb-4`}>
                    Loading Form...
                  </h2>
                </div>
              )}
            </div>
            <div className="min-h-[480px]">
              {mounted && currentMarket ? (
                <div
                  ref={chartCardRef}
                  className="shadow-lg outline outline-1 outline-white/10 p-2 w-full h-full flex flex-col"
                >
                  <div className="flex-1 min-h-0">
                    <HistoricalDataChart />
                  </div>
                </div>
              ) : (
                <div className="bg-[rgba(28,28,28,0.8)] backdrop-blur-md border border-zinc-800 p-6 text-center h-full">
                  Loading Price Chart...
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
