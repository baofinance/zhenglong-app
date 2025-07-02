"use client";

import { useContractReads } from "wagmi";
import { markets } from "../config/contracts";
import { useState, useEffect, useMemo } from "react";
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
    outputs: [
      { name: "minUnderlyingPrice", type: "uint256" },
      { name: "maxUnderlyingPrice", type: "uint256" },
      { name: "minWrappedRate", type: "uint256" },
      { name: "maxWrappedRate", type: "uint256" },
    ],
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

  const formatRatio = (value: bigint) => {
    if (!value) return "-";
    // The ratio is a value with 18 decimals, representing a percentage.
    // To get the percentage value, divide by 1e16.
    const percentage = Number(value) / 1e16;
    return `${percentage.toFixed(2)}%`;
  };

  const { addresses } = markets[marketId];

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

  const contractsToRead = useMemo(() => {
    const baseContracts = [
      {
        address: addresses.minter as `0x${string}`,
        abi: minterABI,
        functionName,
      },
    ];

    if (type === "collateralValue") {
      return [
        ...baseContracts,
        {
          address: addresses.priceOracle as `0x${string}`,
          abi: chainlinkOracleABI,
          functionName: "latestAnswer",
        },
      ];
    }

    if (type === "leveragedValue") {
      return [
        ...baseContracts,
        {
          address: addresses.minter as `0x${string}`,
          abi: minterABI,
          functionName: "leveragedTokenPrice",
        },
      ];
    }

    return baseContracts;
  }, [type, addresses, functionName]);

  const { data, isError, error } = useContractReads({
    contracts: contractsToRead,
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
    const priceData = data[1]?.result as
      | readonly [bigint, bigint, bigint, bigint]
      | undefined;
    const priceRaw = priceData?.[0]; // minUnderlyingPrice is the first element
    const priceDecimals = 18; // Mock contract uses ether units, so 18 decimals

    if (tokenBal === undefined || !priceRaw) {
      console.log("[DEBUG] Missing required values for collateral value:", {
        hasTokenBal: tokenBal !== undefined,
        hasPriceRaw: !!priceRaw,
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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
  } else if (type === "peggedValue") {
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
    const tokenBal = data[0].result as bigint;
    const num = Number(tokenBal) / 1e18;
    const usdFormatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
    return <>{usdFormatted}</>;
  } else if (type === "leveragedValue") {
    if (!data?.[0]?.result || !data?.[1]?.result) {
      console.log("[DEBUG] No value data for leveraged token:", {
        type,
        functionName,
        hasData: !!data,
        isError,
        errorDetails: error,
        rawData: data,
      });
      return <>-</>;
    }
    const tokenBal = data[0].result as bigint;
    const priceRaw = data[1].result as bigint;
    const price = Number(priceRaw) / 1e18;
    const bal = Number(tokenBal) / 1e18;
    const num = bal * price;
    const usdFormatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
    return <>{usdFormatted}</>;
  } else if (type === "collateralRatio") {
    if (!data?.[0]?.result) return <>-</>;
    const ratio = data[0].result as bigint;
    return <>{formatRatio(ratio)}</>;
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
      {/* Total Collateral Box */}
      <div className="bg-[#1A1A1A]/90 border border-[#4A7C59]/20 p-2 hover:border-[#4A7C59]/40 transition-colors text-center flex flex-col items-center justify-center">
        <div className="text-zinc-400 text-[10px] uppercase tracking-wider mb-2">
          Total Collateral
        </div>
        <div
          className={`text-2xl font-medium text-[#4A7C59] ${
            geoClassName || ""
          }`}
        >
          <Value type="collateralValue" marketId={marketId} />
        </div>
        <div className="text-zinc-500 text-xs mt-1 opacity-80">
          <Value
            type="collateralTokens"
            marketId={marketId}
            collateralTokenBalance={collateralTokenBalance}
          />{" "}
          wstETH
        </div>
      </div>
      {/* Pegged Tokens Box */}
      <div className="bg-[#1A1A1A]/90 border border-[#4A7C59]/20 p-2 hover:border-[#4A7C59]/40 transition-colors text-center flex flex-col items-center justify-center">
        <div className="text-zinc-400 text-[10px] uppercase tracking-wider mb-2">
          Pegged Tokens
        </div>
        <div
          className={`text-2xl font-medium text-[#4A7C59] ${
            geoClassName || ""
          }`}
        >
          <Value type="peggedValue" marketId={marketId} />
        </div>
        <div className="text-zinc-500 text-xs mt-1 opacity-80">
          <Value type="peggedTokens" marketId={marketId} /> tokens
        </div>
      </div>
      {/* Leveraged Tokens Box */}
      <div className="bg-[#1A1A1A]/90 border border-[#4A7C59]/20 p-2 hover:border-[#4A7C59]/40 transition-colors text-center flex flex-col items-center justify-center">
        <div className="text-zinc-400 text-[10px] uppercase tracking-wider mb-2">
          Leveraged Tokens
        </div>
        <div
          className={`text-2xl font-medium text-[#4A7C59] ${
            geoClassName || ""
          }`}
        >
          <Value
            type="leveragedValue"
            marketId={marketId}
            collateralTokenBalance={collateralTokenBalance}
          />
        </div>
        <div className="text-zinc-500 text-xs mt-1 opacity-80">
          <Value
            type="leveragedTokens"
            marketId={marketId}
            collateralTokenBalance={collateralTokenBalance}
          />{" "}
          tokens
        </div>
      </div>
      {/* Collateral Ratio Box */}
      <div className="bg-[#1A1A1A]/90 border border-[#4A7C59]/20 p-2 hover:border-[#4A7C59]/40 transition-colors text-center flex flex-col items-center justify-center">
        <div className="text-zinc-400 text-[10px] uppercase tracking-wider mb-2">
          Collateral Ratio
        </div>
        <div
          className={`text-2xl font-medium text-[#4A7C59] ${
            geoClassName || ""
          }`}
        >
          <Value type="collateralRatio" marketId={marketId} />
        </div>
        <div className="text-zinc-500 text-xs mt-1 opacity-80">
          Target: 150%
        </div>
      </div>
      {/* Price Oracle Box */}
      <div className="bg-[#1A1A1A]/90 border border-[#4A7C59]/20 p-2 hover:border-[#4A7C59]/40 transition-colors text-center flex flex-col items-center justify-center">
        <div className="text-zinc-400 text-[10px] uppercase tracking-wider mb-2">
          Price Oracle
        </div>
        <div
          className={`text-2xl font-medium text-[#4A7C59] ${
            geoClassName || ""
          }`}
        >
          Chainlink
        </div>
        <div className="text-zinc-500 text-xs mt-1 opacity-80">
          <div className="flex items-center justify-center gap-1.5">
            {oraclePairName}
            {oracleAddress && (
              <>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(oracleAddress);
                  }}
                  title="Copy Oracle Address"
                  className="text-zinc-500 hover:text-white transition-colors opacity-60 hover:opacity-100"
                >
                  <svg
                    className="w-3 h-3"
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
                  title="View on Etherscan"
                  className="text-zinc-500 hover:text-white transition-colors opacity-60 hover:opacity-100"
                >
                  <svg
                    className="w-3 h-3"
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
  );
}
