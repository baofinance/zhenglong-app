"use client";

import { useContractReads } from "wagmi";
import { markets } from "../config/contracts";
import { useState, useEffect } from "react";
import { formatEther } from "viem";

const minterABI = [
  {
    inputs: [],
    name: "collateralTokenBalance",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "peggedTokenBalance",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "leveragedTokenBalance",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "collateralRatio",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "peggedTokenPrice",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "leveragedTokenPrice",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Add minimal ABI for Chainlink oracle
const chainlinkOracleABI = [
  {
    name: "latestAnswer",
    outputs: [{ type: "int256" }],
    stateMutability: "view",
    type: "function",
    inputs: [],
  },
  {
    name: "decimals",
    outputs: [{ type: "uint8" }],
    stateMutability: "view",
    type: "function",
    inputs: [],
  },
] as const;

interface SystemHealthProps {
  marketId: string;
  collateralTokenBalance?: bigint;
  geoClassName?: string;
}

interface SystemHealthValueProps {
  type:
    | "collateralValue"
    | "collateralTokens"
    | "peggedValue"
    | "peggedTokens"
    | "leveragedValue"
    | "leveragedTokens"
    | "collateralRatio";
  marketId: string;
  collateralTokenBalance?: bigint;
}

// Helper functions
function formatValue(value: bigint | undefined): string {
  if (!value) {
    console.log("[DEBUG] formatValue: value is undefined");
    return "-";
  }
  console.log("[DEBUG] formatValue input:", value.toString());
  try {
    const formattedValue = formatEther(value);
    console.log("[DEBUG] formatValue after formatEther:", formattedValue);
    const num = parseFloat(formattedValue);
    if (isNaN(num)) {
      console.log("[DEBUG] formatValue: parsed number is NaN");
      return "-";
    }
    const result = num.toFixed(4);
    console.log("[DEBUG] formatValue final result:", result);
    return result;
  } catch (error) {
    console.error("[DEBUG] formatValue error:", error);
    return "-";
  }
}

function Value({
  type,
  marketId = "steth-usd",
  collateralTokenBalance,
}: SystemHealthValueProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  console.log("[DEBUG] Value component type:", type);
  console.log(
    "[DEBUG] Value component collateralTokenBalance:",
    collateralTokenBalance
  );
  console.log("[DEBUG] Value component mounted:", mounted);

  const formatUSD = (value: bigint | undefined) => {
    if (!value || !mounted) return "-";
    const num = Number(value) / 1e18;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(num);
  };

  const formatRatio = (value: bigint | undefined) => {
    if (!value || !mounted) return "-";
    if (value > BigInt("1" + "0".repeat(30))) return "-";
    const num = (Number(value) / 1e18) * 100;
    return num.toFixed(4) + "%";
  };

  const addresses = markets[marketId].addresses;

  const functionName =
    type === "collateralValue"
      ? "collateralTokenBalance"
      : type === "collateralTokens"
      ? "collateralTokenBalance"
      : type === "peggedValue"
      ? "peggedTokenBalance"
      : type === "peggedTokens"
      ? "peggedTokenBalance"
      : type === "leveragedValue"
      ? "leveragedTokenBalance"
      : type === "leveragedTokens"
      ? "leveragedTokenBalance"
      : "collateralRatio";

  // Enhanced debug logging
  console.log("[DEBUG] Contract call details:", {
    type,
    functionName,
    address: addresses.minter,
    isPeggedOrLeveraged: type.includes("pegged") || type.includes("leveraged"),
  });

  const { data, isError, error } = useContractReads({
    contracts:
      type === "collateralValue"
        ? [
            {
              address: addresses.minter as `0x${string}`,
              abi: minterABI,
              functionName,
            },
            {
              address: addresses.priceOracle as `0x${string}`,
              abi: chainlinkOracleABI,
              functionName: "latestAnswer",
            },
            {
              address: addresses.priceOracle as `0x${string}`,
              abi: chainlinkOracleABI,
              functionName: "decimals",
            },
          ]
        : [
            {
              address: addresses.minter as `0x${string}`,
              abi: minterABI,
              functionName,
            },
          ],
    watch: true,
    enabled: mounted,
    select: (data) => {
      console.log("[DEBUG] Raw contract read result:", {
        type,
        functionName,
        data,
        result: data?.[0]?.result,
        status: data?.[0]?.status,
      });
      return data;
    },
  });

  // Add error and data logging
  useEffect(() => {
    if (mounted) {
      console.log("[DEBUG] Detailed contract state for", type, ":", {
        hasData: !!data,
        dataResult: data?.[0]?.result,
        dataStatus: data?.[0]?.status,
        isError,
        errorDetails: error,
        minterAddress: addresses.minter,
      });
    }
  }, [data, error, isError, type, mounted, addresses.minter]);

  // Return placeholder during SSR and initial hydration
  if (!mounted) return <>-</>;

  // Handle different value types with enhanced error logging
  if (type === "collateralTokens" && collateralTokenBalance !== undefined) {
    console.log(
      "[DEBUG] Handling collateralTokens with balance:",
      collateralTokenBalance.toString()
    );
    const formattedValue = formatValue(collateralTokenBalance);
    console.log("[DEBUG] Formatted collateral tokens value:", formattedValue);
    return <>{formattedValue}</>;
  } else if (type === "collateralValue") {
    if (!data?.[0]?.result) {
      console.log("[DEBUG] No collateral value data:", {
        type,
        functionName,
        hasData: !!data,
        isError,
        errorDetails: error,
      });
      return <>-</>;
    }
    const tokenBal = data[0]?.result as bigint | undefined;
    const priceRaw = data[1]?.result as bigint | undefined;
    const priceDecimals = data[2]?.result as number | undefined;

    if (!tokenBal || !priceRaw || priceDecimals === undefined) {
      console.log("[DEBUG] Missing required values for collateral value:", {
        hasTokenBal: !!tokenBal,
        hasPriceRaw: !!priceRaw,
        hasPriceDecimals: priceDecimals !== undefined,
      });
      return <>-</>;
    }

    // Normalize price to 18 decimals
    const normalizedPrice = priceRaw * BigInt(10 ** (18 - priceDecimals));
    // USD value = tokenBal * normalizedPrice / 1e18
    const usdValue = (tokenBal * normalizedPrice) / BigInt(1e18);
    // Format USD value
    const num = Number(usdValue) / 1e18;
    const usdFormatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(num);
    return <>{usdFormatted}</>;
  } else if (type === "peggedTokens" || type === "leveragedTokens") {
    if (!data?.[0]?.result) {
      console.log("[DEBUG] No token data:", {
        type,
        functionName,
        hasData: !!data,
        isError,
        errorDetails: error,
        rawData: data,
      });
      return <>-</>;
    }
    console.log("[DEBUG] Processing token data:", {
      type,
      rawResult: data[0].result.toString(),
      hasError: isError,
      error,
    });
    const formattedValue = formatValue(data[0].result);
    console.log("[DEBUG] Formatted token value:", formattedValue);
    return <>{formattedValue}</>;
  } else if (type === "peggedValue" || type === "leveragedValue") {
    if (!data?.[0]?.result) {
      console.log("[DEBUG] No value data:", {
        type,
        functionName,
        hasData: !!data,
        isError,
        errorDetails: error,
        rawData: data,
      });
      return <>-</>;
    }
    return <>{formatUSD(data[0].result)}</>;
  } else if (type === "collateralRatio") {
    if (!data?.[0]?.result) return <>-</>;
    return <>{formatRatio(data[0].result)}</>;
  } else {
    if (!data?.[0]?.result) return <>-</>;
    return <>{formatValue(data[0].result)}</>;
  }
}

// Export both the default component and the Value component
export default Object.assign(SystemHealth, { Value });

// The main SystemHealth component is now just a container
function SystemHealth({
  marketId,
  collateralTokenBalance,
  geoClassName,
}: SystemHealthProps) {
  console.log("[DEBUG SystemHealth.tsx] received geoClassName:", geoClassName);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Define constants for Price Oracle
  const currentMarketDetails = markets[marketId];
  const oracleAddress = currentMarketDetails?.addresses.priceOracle;
  const oraclePairName = currentMarketDetails?.name;

  console.log("[DEBUG] SystemHealth mounted:", mounted);
  console.log(
    "[DEBUG] SystemHealth collateralTokenBalance:",
    collateralTokenBalance
  );
  console.log(
    "[DEBUG] SystemHealth collateralTokenBalance type:",
    typeof collateralTokenBalance
  );

  // Don't render anything until client-side hydration is complete
  if (!mounted) return null;

  return (
    <div className="bg-neutral-800 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {/* Total Collateral Box */}
        <div className="bg-black p-3">
          <div className="text-[#F5F5F5]/70 text-xs mb-1 text-center">
            Total Collateral
          </div>
          <div
            className={`text-2xl font-medium text-center ${geoClassName || ""}`}
          >
            <Value
              type="collateralValue"
              marketId={marketId}
              collateralTokenBalance={collateralTokenBalance}
            />
          </div>
          <div className="text-[#F5F5F5]/50 text-xs text-center">
            <Value
              type="collateralTokens"
              marketId={marketId}
              collateralTokenBalance={collateralTokenBalance}
            />{" "}
            wstETH
          </div>
        </div>
        {/* Pegged Tokens Box */}
        <div className="bg-black p-3">
          <div className="text-[#F5F5F5]/70 text-xs mb-1 text-center">
            Pegged Tokens
          </div>
          <div
            className={`text-2xl font-medium text-center ${geoClassName || ""}`}
          >
            <Value
              type="peggedValue"
              marketId={marketId}
              collateralTokenBalance={collateralTokenBalance}
            />
          </div>
          <div className="text-[#F5F5F5]/50 text-xs text-center">
            <Value
              type="peggedTokens"
              marketId={marketId}
              collateralTokenBalance={collateralTokenBalance}
            />{" "}
            tokens
          </div>
        </div>
        {/* Leveraged Tokens Box */}
        <div className="bg-black p-3">
          <div className="text-[#F5F5F5]/70 text-xs mb-1 text-center">
            Leveraged Tokens
          </div>
          <div
            className={`text-2xl font-medium text-center ${geoClassName || ""}`}
          >
            <Value
              type="leveragedValue"
              marketId={marketId}
              collateralTokenBalance={collateralTokenBalance}
            />
          </div>
          <div className="text-[#F5F5F5]/50 text-xs text-center">
            <Value
              type="leveragedTokens"
              marketId={marketId}
              collateralTokenBalance={collateralTokenBalance}
            />{" "}
            tokens
          </div>
        </div>
        {/* Collateral Ratio Box */}
        <div className="bg-black p-3">
          <div className="text-[#F5F5F5]/70 text-xs mb-1 text-center">
            Collateral Ratio
          </div>
          <div
            className={`text-2xl font-medium text-center ${geoClassName || ""}`}
          >
            <Value type="collateralRatio" marketId={marketId} />
          </div>
          <div className="text-[#F5F5F5]/50 text-xs text-center">
            Target: 150%
          </div>
        </div>
        {/* Price Oracle Box */}
        <div className="bg-black p-3 flex flex-col items-center justify-center">
          <div className="text-[#F5F5F5]/70 text-xs mb-1 text-center">
            Price Oracle
          </div>
          <div
            className={`text-2xl Price Oracle font-medium text-center ${
              geoClassName || ""
            }`}
          >
            Chainlink
          </div>
          <div className="text-[#F5F5F5]/50 text-xs mt-0.5 text-center">
            <div className="flex items-center justify-center gap-1">
              {oraclePairName}
              {oracleAddress && (
                <>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(oracleAddress);
                    }}
                    title="Copy Oracle Address"
                    className="text-[#F5F5F5]/50 hover:text-[#F5F5F5]/70 transition-colors"
                  >
                    <svg
                      className="w-2.5 h-2.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                  <a
                    href={`https://etherscan.io/address/${oracleAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View Oracle on Etherscan"
                    className="text-[#F5F5F5]/50 hover:text-[#F5F5F5]/70 transition-colors"
                  >
                    <svg
                      className="w-2.5 h-2.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
