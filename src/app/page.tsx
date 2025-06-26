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
import { markets, marketConfig } from "../config/contracts";
import TradingViewChart from "../components/TradingViewChart";
import ConnectButton from "../components/ConnectButton";
import Navigation from "../components/Navigation";
import MintRedeemForm from "@/components/MintRedeemForm"; // Adjust path as needed
import Head from "next/head";
import SystemHealthComponent from "@/components/SystemHealth";

const geo = Geo({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

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
        return totalCollateralValue || "0";
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
        console.log("Raw pegged balance:", peggedBalance.toString());
        console.log("Formatted pegged balance:", formattedValue);

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
  const [selectedMarket, setSelectedMarket] = useState<string>("steth-usd");
  const [showPopup, setShowPopup] = useState(false);
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

  // Get the default market
  const currentMarket = useMemo(
    () => markets[selectedMarket],
    [selectedMarket]
  );

  // Define state for PriceChart props at page level
  // Default to LONG type and its first token for the current market
  const pageSelectedType: TokenType = "LONG"; // Default to LONG for page-level chart
  const pageSelectedToken: string = pageScopedTokens[pageSelectedType][0]; // Get the default token for LONG

  const handleMarketClick = () => {
    setShowPopup(true);
    setTimeout(() => {
      setShowPopup(false);
    }, 2500);
  };

  const handleMarketChange = (marketId: string) => {
    setSelectedMarket(marketId);
  };

  console.log("[DEBUG page.tsx] geo.className:", geo.className); // DEBUG LINE

  // The main return statement of page.tsx
  return (
    <>
      <Head>
        <title>Zhenglong</title>
        <meta name="description" content="Zhenglong App" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto max-w-full px-6 sm:px-8 lg:px-16 xl:px-24 2xl:px-32 pt-28 pb-20">
        {/* Navigation */}
        <Navigation />

        {/* Header */}
        <div className="text-center mb-4">
          <h1 className={`text-4xl text-[#4A7C59] ${geo.className}`}>
            MINT & REDEEM
          </h1>
          <p className="text-[#F5F5F5]/60 text-sm mt-2">
            Mint or redeem pegged and leverage tokens from any market
          </p>
        </div>

        {/* Market Selector */}
        <div className="max-w-7xl mx-auto mb-4">
          <div className="flex items-center">
            <div className="flex-1"></div>
            <div className="flex items-center gap-4 w-[200px] justify-end relative">
              <label className="text-[#F5F5F5]/70">Market</label>
              <button
                onClick={handleMarketClick}
                className="px-4 py-2 bg-[#202020] text-[#F5F5F5] border border-[#4A7C59]/30 hover:border-[#4A7C59] hover:bg-[#2A2A2A] outline-none transition-all text-left w-[120px] shadow-md font-medium"
              >
                {currentMarket.name}
              </button>
              {showPopup && (
                <div
                  className={`absolute top-full right-0 mt-2 px-4 py-2 bg-[#4A7C59] text-white shadow-xl border border-zinc-600/30 whitespace-nowrap z-50 ${geo.className} animate-fade-out backdrop-blur-sm`}
                >
                  New markets coming soon!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Health with uniform spacing */}
        <div className="mb-2">
          {mounted && currentMarket && (
            <SystemHealthComponent
              marketId={selectedMarket}
              geoClassName={geo.className}
            />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 items-start">
          <div>
            {mounted && currentMarket ? (
              <div
                ref={formCardRef}
                className="bg-[#1A1A1A]/90 border border-[#4A7C59]/20 hover:border-[#4A7C59]/40 transition-colors px-6 py-4 w-full"
              >
                <MintRedeemForm
                  geoClassName={geo.className}
                  currentMarket={currentMarket}
                  isConnected={isConnected}
                  userAddress={address}
                />
              </div>
            ) : (
              <div className="bg-[#1C1C1C] border border-zinc-800 p-6 h-full">
                <h2 className={`text-2xl text-white mb-4 ${geo.className}`}>
                  Loading Form...
                </h2>
              </div>
            )}
          </div>
          <div>
            {mounted && currentMarket ? (
              <div
                ref={chartCardRef}
                className="bg-[#1A1A1A]/90 border border-[#4A7C59]/20 hover:border-[#4A7C59]/40 transition-colors px-6 py-4 w-full flex flex-col"
              >
                <div className="flex-1 min-h-0">
                  <TradingViewChart symbol="BITSTAMP:ETHUSD" theme="dark" />
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
    </>
  );
}
