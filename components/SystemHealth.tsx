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

interface SystemHealthProps {
  marketId: string;
  collateralTokenBalance?: bigint;
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
    contracts: [
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
    return <>{formatUSD(data[0].result)}</>;
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
  marketId = "steth-usd",
  collateralTokenBalance,
}: SystemHealthProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <div className="space-y-2">
      <div className="bg-[#1A1A1A]/95 p-3">
        <div className="text-[#F5F5F5]/70 text-xs mb-1">Total Collateral</div>
        <div className="text-sm font-medium">
          <Value
            type="collateralValue"
            marketId={marketId}
            collateralTokenBalance={collateralTokenBalance}
          />
        </div>
        <div className="text-[#F5F5F5]/50 text-xs">
          <Value
            type="collateralTokens"
            marketId={marketId}
            collateralTokenBalance={collateralTokenBalance}
          />{" "}
          wstETH
        </div>
      </div>
      <div className="bg-[#1A1A1A]/95 p-3">
        <div className="text-[#F5F5F5]/70 text-xs mb-1">Pegged Tokens</div>
        <div className="text-sm font-medium">
          <Value
            type="peggedValue"
            marketId={marketId}
            collateralTokenBalance={collateralTokenBalance}
          />
        </div>
        <div className="text-[#F5F5F5]/50 text-xs">
          <Value
            type="peggedTokens"
            marketId={marketId}
            collateralTokenBalance={collateralTokenBalance}
          />{" "}
          tokens
        </div>
      </div>
      <div className="bg-[#1A1A1A]/95 p-3">
        <div className="text-[#F5F5F5]/70 text-xs mb-1">Leveraged Tokens</div>
        <div className="text-sm font-medium">
          <Value
            type="leveragedValue"
            marketId={marketId}
            collateralTokenBalance={collateralTokenBalance}
          />
        </div>
        <div className="text-[#F5F5F5]/50 text-xs">
          <Value
            type="leveragedTokens"
            marketId={marketId}
            collateralTokenBalance={collateralTokenBalance}
          />{" "}
          tokens
        </div>
      </div>
      <div className="bg-[#1A1A1A]/95 p-3">
        <div className="text-[#F5F5F5]/70 text-xs mb-1">Collateral Ratio</div>
        <div className="text-sm font-medium">
          <Value type="collateralRatio" marketId={marketId} />
        </div>
        <div className="text-[#F5F5F5]/50 text-xs">Target: 150%</div>
      </div>
    </div>
  );
}
