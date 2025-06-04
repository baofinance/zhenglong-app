"use client";

import { useState, useEffect, useMemo } from "react";
import { Geo } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import {
  useAccount,
  useContractReads,
  useContractWrite,
  useContractRead,
  useNetwork,
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
  const { chain } = useNetwork();
  const [selectedMarket, setSelectedMarket] = useState<string>("steth-usd");
  const [showPopup, setShowPopup] = useState(false);

  // Effect hooks
  useEffect(() => setMounted(true), []);

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
        <div className="absolute top-[25%] right-[20%] w-[80px] h-[80px] bg-[#4A7C59]/[0.065] animate-steam-1"></div>
        <div className="absolute top-[45%] left-[30%] w-[90px] h-[90px] bg-[#4A7C59]/[0.075] animate-steam-2"></div>
        <div className="absolute top-[38%] right-[35%] w-[110px] h-[110px] bg-[#4A7C59]/[0.07] animate-steam-3"></div>
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="container mx-auto px-6 pt-28 pb-20 relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className={`text-4xl text-[#4A7C59] ${geo.className}`}>
            MINT & REDEEM
          </h1>
          <p className="text-[#F5F5F5]/60 text-sm mt-2">
            Mint or redeem pegged and leverage tokens from any market
          </p>
        </div>

        {/* Market Selector */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex items-center">
            <div className="flex-1"></div>
            <div className="flex items-center gap-4 w-[200px] justify-end relative">
              <label className="text-[#F5F5F5]/70">Market</label>
              <button
                onClick={handleMarketClick}
                className="px-4 py-2 bg-[#202020] text-[#F5F5F5] border border-[#4A7C59]/30 hover:border-[#4A7C59] hover:bg-[#2A2A2A] outline-none transition-all text-left w-[120px]"
              >
                {currentMarket.name}
              </button>
              {showPopup && (
                <div
                  className={`absolute top-full right-0 mt-2 px-4 py-2 bg-[#4A7C59] text-white shadow-lg whitespace-nowrap z-50 ${geo.className} animate-fade-out`}
                >
                  New markets coming soon!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Health with uniform spacing */}
        <div className="mb-8">
          {mounted && currentMarket && (
            <SystemHealthComponent
              marketId={selectedMarket}
              geoClassName={geo.className}
            />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch min-h-[700px]">
          <div className="h-full">
            {mounted && currentMarket ? (
              <div className="bg-[#0A0A0A] p-0 shadow-custom-dark h-full">
                <MintRedeemForm
                  geoClassName={geo.className}
                  currentMarket={currentMarket}
                  isConnected={isConnected}
                  userAddress={address}
                />
              </div>
            ) : (
              <div className="bg-[#0A0A0A] p-6 shadow-custom-dark h-full">
                <h2 className={`text-2xl text-[#F5F5F5] mb-4 ${geo.className}`}>
                  Loading Form...
                </h2>
              </div>
            )}
          </div>
          <div className="h-full">
            {mounted && currentMarket ? (
              <div className="bg-[#0A0A0A] p-6 shadow-custom-dark h-full flex flex-col">
                <div className="flex-1 min-h-0">
                  <TradingViewChart symbol="BITSTAMP:ETHUSD" theme="dark" />
                </div>
              </div>
            ) : (
              <div className="bg-[#0A0A0A] p-6 shadow-custom-dark text-center h-full">
                Loading Price Chart...
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
