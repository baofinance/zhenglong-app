"use client";

import { useState, useEffect } from "react";
import { Geo } from "next/font/google";
import {
  useAccount,
  useContractReads,
  useContractWrite,
  useContractRead,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { markets } from "../config/contracts";
import Navigation from "../components/Navigation";
import PriceChart from "../components/PriceChart";

const geo = Geo({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

type TokenType = "LONG" | "STEAMED";
type TokenAction = "MINT" | "REDEEM";

const tokens = {
  LONG: ["zheUSD", "longBTC", "longETH", "longTSLA", "longSP500"],
  STEAMED: [
    "steamedETH",
    "steamedBTC",
    "steamedTSLA",
    "steamedSP500",
    "steamedETH-DOWN",
    "steamedBTC-DOWN",
    "steamedTSLA-DOWN",
    "steamedSP500-DOWN",
  ],
};

const minterABI = [
  {
    inputs: [],
    name: "leverageRatio",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "mintPeggedTokenIncentiveRatio",
    outputs: [{ type: "int256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "redeemPeggedTokenIncentiveRatio",
    outputs: [{ type: "int256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "collateralAmount", type: "uint256" }],
    name: "mintPeggedToken",
    outputs: [{ type: "uint256", name: "peggedAmount" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "peggedAmount", type: "uint256" }],
    name: "redeemPeggedToken",
    outputs: [{ type: "uint256", name: "collateralAmount" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "collateralAmount", type: "uint256" }],
    name: "mintLeveragedToken",
    outputs: [{ type: "uint256", name: "leveragedAmount" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "leveragedAmount", type: "uint256" }],
    name: "redeemLeveragedToken",
    outputs: [{ type: "uint256", name: "collateralAmount" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "collateralAmount", type: "uint256" }],
    name: "calculateMintPeggedTokenOutput",
    outputs: [{ type: "uint256", name: "peggedAmount" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "peggedAmount", type: "uint256" }],
    name: "calculateRedeemPeggedTokenOutput",
    outputs: [{ type: "uint256", name: "collateralAmount" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "collateralAmount", type: "uint256" }],
    name: "calculateMintLeveragedTokenOutput",
    outputs: [{ type: "uint256", name: "leveragedAmount" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "leveragedAmount", type: "uint256" }],
    name: "calculateRedeemLeveragedTokenOutput",
    outputs: [{ type: "uint256", name: "collateralAmount" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalCollateralTokens",
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
    inputs: [{ name: "newPriceOracle", type: "address" }],
    name: "UpdatePriceOracle",
    outputs: [],
    stateMutability: "nonpayable",
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
] as const;

interface SystemHealthProps {
  marketId: string;
  collateralTokenBalance: string;
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

// SystemHealth component definition
const SystemHealthComponent: React.FC<SystemHealthProps> = ({
}) => {
  return (
    <div className="bg-[#1A1A1A] p-4 relative overflow-hidden">
      <div className="grid grid-cols-5 gap-4">{/* Component content */}</div>
    </div>
  );
};

const SystemHealthValue: React.FC<SystemHealthValueProps> = ({
  type,
  collateralTokenBalance,
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

        const leveragedValue =
          (Number(formatEther(leveragedBalance)) *
            Number(formatEther(leveragedTokenPrice))) /
          1e18;
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

export default function App() {
  // State hooks
  const { isConnected, address } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<string>("steth-usd");
  const [selectedType, setSelectedType] = useState<TokenType>("LONG");
  const [selectedToken, setSelectedToken] = useState<string>(
    tokens[selectedType][0]
  );
  const [amount, setAmount] = useState<string>("");
  const [inputAmount, setInputAmount] = useState<string>("");
  const [outputAmount, setOutputAmount] = useState<string>("");
  const [isCollateralAtTop, setIsCollateralAtTop] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  // Effect hooks
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // When direction changes, clear both inputs
    setInputAmount("");
    setOutputAmount("");
  }, [isCollateralAtTop, selectedType]);

  // Get the default market
  const currentMarket = markets[selectedMarket];

  // Contract reads
  const { data } = useContractReads({
    contracts: [
      {
        address: currentMarket.addresses.minter as `0x${string}`,
        abi: minterABI,
        functionName: "leverageRatio",
      },
      {
        address: currentMarket.addresses.minter as `0x${string}`,
        abi: minterABI,
        functionName: "mintPeggedTokenIncentiveRatio",
      },
      {
        address: currentMarket.addresses.minter as `0x${string}`,
        abi: minterABI,
        functionName: "redeemPeggedTokenIncentiveRatio",
      },
    ],
    watch: true,
    enabled: mounted,
  });

  // Get token balances
  const { data: collateralBalance } = useContractReads({
    contracts: [
      {
        address: currentMarket.addresses.collateralToken as `0x${string}`,
        abi: erc20ABI,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      },
    ],
    watch: true,
    enabled: mounted && !!address,
  });

  // Get collateral token balance from minter
  const { data: minterCollateralBalance } = useContractRead({
    address: currentMarket.addresses.collateralToken as `0x${string}`,
    abi: erc20ABI,
    functionName: "balanceOf",
    args: [currentMarket.addresses.minter as `0x${string}`],
    watch: true,
    enabled: mounted && !!currentMarket.addresses.minter,
  });

  // Get price from oracle
  const { data: priceData } = useContractRead({
    address: currentMarket.addresses.priceOracle as `0x${string}`,
    abi: [
      {
        inputs: [],
        name: "latestAnswer",
        outputs: [{ type: "int256", name: "" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "latestAnswer",
    watch: true,
    enabled: mounted,
  });

  // Get pegged token balance
  const { data: peggedBalance } = useContractReads({
    contracts: [
      {
        address: currentMarket.addresses.peggedToken as `0x${string}`,
        abi: erc20ABI,
        functionName: "balanceOf",
        args: [address ?? "0x0"],
      },
    ],
    enabled: mounted && !!address,
    watch: true,
  });

  // Get leveraged token balance
  const { data: leveragedBalance } = useContractReads({
    contracts: [
      {
        address: currentMarket.addresses.leveragedToken as `0x${string}`,
        abi: erc20ABI,
        functionName: "balanceOf",
        args: [address ?? "0x0"],
      },
    ],
    enabled: mounted && !!address,
    watch: true,
  });

  // Get token allowances
  const { data: collateralAllowance } = useContractReads({
    contracts: [
      {
        address: currentMarket.addresses.collateralToken as `0x${string}`,
        abi: erc20ABI,
        functionName: "allowance",
        args: [
          address ?? "0x0",
          currentMarket.addresses.minter as `0x${string}`,
        ],
      },
    ],
    enabled: mounted && !!address,
    watch: true,
  });

  const { data: peggedAllowance } = useContractReads({
    contracts: [
      {
        address: currentMarket.addresses.peggedToken as `0x${string}`,
        abi: erc20ABI,
        functionName: "allowance",
        args: [
          address ?? "0x0",
          currentMarket.addresses.minter as `0x${string}`,
        ],
      },
    ],
    enabled: mounted && !!address,
    watch: true,
  });

  const { data: leveragedAllowance } = useContractReads({
    contracts: [
      {
        address: currentMarket.addresses.leveragedToken as `0x${string}`,
        abi: erc20ABI,
        functionName: "allowance",
        args: [
          address ?? "0x0",
          currentMarket.addresses.minter as `0x${string}`,
        ],
      },
    ],
    enabled: mounted && !!address,
    watch: true,
  });

  // Add contract read for total pegged token supply
  const { data: peggedTokenTotalSupply } = useContractRead({
    address: currentMarket.addresses.peggedToken as `0x${string}`,
    abi: [
      {
        inputs: [],
        name: "totalSupply",
        outputs: [{ type: "uint256", name: "" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "totalSupply",
    watch: true,
    enabled: mounted,
  });

  // Add contract reads for token amounts and values
  const { data: peggedTokenData } = useContractReads({
    contracts: [
      {
        address: currentMarket.addresses.minter as `0x${string}`,
        abi: minterABI,
        functionName: "peggedTokenBalance",
      },
      {
        address: currentMarket.addresses.minter as `0x${string}`,
        abi: minterABI,
        functionName: "calculateRedeemPeggedTokenOutput",
        args: [BigInt(1e18)],
      },
    ],
    watch: true,
    enabled: mounted,
  });

  const { data: leveragedTokenData } = useContractReads({
    contracts: [
      {
        address: currentMarket.addresses.minter as `0x${string}`,
        abi: minterABI,
        functionName: "leveragedTokenBalance",
      },
      {
        address: currentMarket.addresses.minter as `0x${string}`,
        abi: minterABI,
        functionName: "calculateRedeemLeveragedTokenOutput",
        args: [BigInt(1e18)],
      },
    ],
    watch: true,
    enabled: mounted,
  });

  // Add contract read for leveraged token price
  const { data: leveragedTokenPrice } = useContractRead({
    address: currentMarket.addresses.minter as `0x${string}`,
    abi: minterABI,
    functionName: "leveragedTokenPrice",
    watch: true,
    enabled: mounted,
  });

  // Contract write hooks
  const { writeAsync: mintPeggedToken } = useContractWrite({
    address: currentMarket.addresses.minter as `0x${string}`,
    abi: minterABI,
    functionName: "mintPeggedToken",
  });

  const { writeAsync: redeemPeggedToken } = useContractWrite({
    address: currentMarket.addresses.minter as `0x${string}`,
    abi: minterABI,
    functionName: "redeemPeggedToken",
  });

  const { writeAsync: mintLeveragedToken } = useContractWrite({
    address: currentMarket.addresses.minter as `0x${string}`,
    abi: minterABI,
    functionName: "mintLeveragedToken",
  });

  const { writeAsync: redeemLeveragedToken } = useContractWrite({
    address: currentMarket.addresses.minter as `0x${string}`,
    abi: minterABI,
    functionName: "redeemLeveragedToken",
  });

  // Contract write hooks for approvals
  const { writeAsync: approveCollateral } = useContractWrite({
    address: currentMarket.addresses.collateralToken as `0x${string}`,
    abi: erc20ABI,
    functionName: "approve",
  });

  const { writeAsync: approvePegged } = useContractWrite({
    address: currentMarket.addresses.peggedToken as `0x${string}`,
    abi: erc20ABI,
    functionName: "approve",
  });

  const { writeAsync: approveLeveraged } = useContractWrite({
    address: currentMarket.addresses.leveragedToken as `0x${string}`,
    abi: erc20ABI,
    functionName: "approve",
  });

  // Add contract read functions for output calculations
  const { data: outputData, refetch: refetchOutput } = useContractReads({
    contracts: [
      {
        address: currentMarket.addresses.minter as `0x${string}`,
        abi: minterABI,
        functionName: isCollateralAtTop
          ? selectedType === "LONG"
            ? "calculateMintPeggedTokenOutput"
            : "calculateMintLeveragedTokenOutput"
          : selectedType === "LONG"
          ? "calculateRedeemPeggedTokenOutput"
          : "calculateRedeemLeveragedTokenOutput",
        args: [inputAmount ? BigInt(parseEther(inputAmount)) : BigInt(0)],
      },
    ],
    enabled: mounted && !!inputAmount,
    watch: true,
  });

  // Add contract read functions for reverse calculations
  const { data: inputData, refetch: refetchInput } = useContractReads({
    contracts: [
      {
        address: currentMarket.addresses.minter as `0x${string}`,
        abi: minterABI,
        functionName: !isCollateralAtTop
          ? selectedType === "LONG"
            ? "calculateMintPeggedTokenOutput"
            : "calculateMintLeveragedTokenOutput"
          : selectedType === "LONG"
          ? "calculateRedeemPeggedTokenOutput"
          : "calculateRedeemLeveragedTokenOutput",
        args: [outputAmount ? BigInt(parseEther(outputAmount)) : BigInt(0)],
      },
    ],
    enabled: mounted && !!outputAmount,
    watch: true,
  });

  // Format the balance and calculate total value
  const formattedBalance = minterCollateralBalance
    ? formatEther(minterCollateralBalance)
    : "0";

  const totalCollateralValue =
    minterCollateralBalance && typeof priceData === "bigint"
      ? (
          (Number(formatEther(minterCollateralBalance)) * Number(priceData)) /
          1e18
        ).toFixed(2)
      : "0";

  console.log(
    "Minter collateral balance:",
    minterCollateralBalance?.toString()
  );
  console.log("Price data:", priceData?.toString());
  console.log("Formatted balance:", formattedBalance);
  console.log("Total collateral value:", totalCollateralValue);

  // Calculate collateral ratio
  const collateralRatio = (() => {
    if (
      !minterCollateralBalance ||
      typeof priceData !== "bigint" ||
      !peggedTokenData?.[0]
    )
      return "0";

    const collateralValueUSD =
      (Number(formatEther(minterCollateralBalance)) * Number(priceData)) / 1e18;
    const peggedTokensUSD = Number(
      formatEther(getContractReadResult(peggedTokenData[0]))
    );

    if (peggedTokensUSD === 0) return "∞";

    return ((collateralValueUSD / peggedTokensUSD) * 100).toFixed(2);
  })();

  console.log("Collateral Value USD:", totalCollateralValue);
  console.log("Pegged Tokens Supply:", peggedTokenTotalSupply?.toString());
  console.log("Calculated Collateral Ratio:", collateralRatio);

  // Return loading state before mounting
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0A0A0A]">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#1A1A1A] p-6">
                <h2 className={`text-2xl text-[#F5F5F5] mb-4 ${geo.className}`}>
                  Mint & Redeem
                </h2>
                <div className="space-y-4">
                  <div className="bg-[#202020] p-4">
                    <div className="text-lg font-medium mb-2 text-[#F5F5F5]/70">
                      Loading...
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Right Column */}
            <div className="space-y-6">
              <SystemHealth
                marketId={selectedMarket}
                collateralTokenBalance={formattedBalance}
              />
            </div>
          </div>
        </main>
      </div>
    );
  }

  const leverageRatioResult = data?.[0]?.result;
  const mintFeeResult = data?.[1]?.result;
  const redeemFeeResult = data?.[2]?.result;

  const formatLeverageRatio = (value: bigint | undefined) => {
    if (!mounted || !value) return "-";
    if (value > BigInt("1" + "0".repeat(30))) return "-";
    return (Number(value) / 1e18).toFixed(2) + "x";
  };

  const formatFeeRatio = (value: bigint | undefined) => {
    if (!mounted || !value) return "-";
    const ratio = Number(value) / 1e18;
    return ratio > 0
      ? `+${(ratio * 100).toFixed(2)}%`
      : `${(ratio * 100).toFixed(2)}%`;
  };

  const formatBalance = (balance: bigint | undefined) => {
    if (!balance) return "-";
    try {
      return Number(formatEther(balance)).toFixed(6);
    } catch {
      return "-";
    }
  };

  const handleMaxClick = () => {
    const balance = isCollateralAtTop
      ? collateralBalance?.[0]?.result
      : selectedType === "LONG"
      ? peggedBalance?.[0]?.result
      : leveragedBalance?.[0]?.result;

    if (balance) {
      setInputAmount(formatEther(balance));
    }
  };

  // Update handlers for input changes
  const handleInputAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputAmount(value);
    if (!value) {
      setOutputAmount("");
      return;
    }
    const calculatedOutput = calculateOutput(parseFloat(value) || 0);
    setOutputAmount(calculatedOutput);
  };

  const handleOutputAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOutputAmount(value);
    if (!value) {
      setInputAmount("");
      return;
    }
    const calculatedInput = calculateInput(parseFloat(value) || 0);
    setInputAmount(calculatedInput);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !inputAmount) return;

    try {
      setIsPending(true);
      const parsedAmount = parseEther(inputAmount);

      // Check if approval is needed
      const currentAllowance = isCollateralAtTop
        ? collateralAllowance?.[0]?.result ?? BigInt(0)
        : selectedType === "LONG"
        ? peggedAllowance?.[0]?.result ?? BigInt(0)
        : leveragedAllowance?.[0]?.result ?? BigInt(0);

      // If approval is needed, handle it first
      if (currentAllowance < parsedAmount) {
        console.log(
          "[DEBUG] Approval needed. Current allowance:",
          currentAllowance.toString()
        );
        console.log("[DEBUG] Required amount:", parsedAmount.toString());

        try {
          if (isCollateralAtTop) {
            console.log("[DEBUG] Approving collateral token...");
            await approveCollateral({
              args: [
                currentMarket.addresses.minter as `0x${string}`,
                parsedAmount,
              ],
            });
          } else if (selectedType === "LONG") {
            console.log("[DEBUG] Approving pegged token...");
            await approvePegged({
              args: [
                currentMarket.addresses.minter as `0x${string}`,
                parsedAmount,
              ],
            });
          } else {
            console.log("[DEBUG] Approving leveraged token...");
            await approveLeveraged({
              args: [
                currentMarket.addresses.minter as `0x${string}`,
                parsedAmount,
              ],
            });
          }

          // Return early after approval - user needs to click mint/redeem again
          console.log("[DEBUG] Approval transaction sent successfully");
          setIsPending(false);
          return;
        } catch (approvalError) {
          console.error("[DEBUG] Approval failed:", approvalError);
          setIsPending(false);
          throw approvalError;
        }
      }

      // Proceed with mint/redeem after approval is confirmed
      console.log("[DEBUG] Proceeding with mint/redeem operation");
      console.log(
        "[DEBUG] Operation type:",
        isCollateralAtTop ? "Mint" : "Redeem"
      );
      console.log("[DEBUG] Token type:", selectedType);
      console.log("[DEBUG] Amount:", parsedAmount.toString());

      if (selectedType === "LONG") {
        if (isCollateralAtTop) {
          await mintPeggedToken({ args: [parsedAmount] });
        } else {
          await redeemPeggedToken({ args: [parsedAmount] });
        }
      } else {
        if (isCollateralAtTop) {
          await mintLeveragedToken({ args: [parsedAmount] });
        } else {
          await redeemLeveragedToken({ args: [parsedAmount] });
        }
      }

      console.log("[DEBUG] Transaction sent successfully");

      // Clear input after successful transaction
      setInputAmount("");
      setOutputAmount("");
    } catch (error) {
      console.error("[DEBUG] Transaction failed:", error);
    } finally {
      setIsPending(false);
    }
  };

  const handleMarketClick = () => {
    setShowPopup(true);
    setTimeout(() => {
      setShowPopup(false);
    }, 2500); // 2.5s total (2s delay + 0.5s fade)
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#202020] to-black text-[#F5F5F5] font-sans relative">
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
      <main className="container mx-auto px-6 pt-32 pb-20 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl text-[#4A7C59] ${geo.className}`}>
            Mint & Redeem
          </h1>
          <p className="text-[#F5F5F5]/60 text-sm mt-2">
            Mint or redeem pegged and leverage tokens from any market
          </p>
        </div>

        {/* Market Selector */}
        <div className="max-w-5xl mx-auto mb-6">
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

        {/* Market Health - Full Width */}
        <div className="max-w-5xl mx-auto mb-6">
          <div className="bg-[#1A1A1A] p-4 relative overflow-hidden grid grid-cols-5 gap-4">
            <div className="bg-[#0A0A0A] p-4 flex flex-col items-center justify-center">
              <h3 className="text-xs text-[#F5F5F5]/70 mb-2 text-center">
                Total Collateral
              </h3>
              <div>
                <div
                  className={`text-xl font-medium mb-1 text-center ${geo.className}`}
                >
                  $
                  <SystemHealth.Value
                    type="collateralValue"
                    marketId={selectedMarket}
                    collateralTokenBalance={formattedBalance}
                    collateralAllowance={collateralAllowance}
                    peggedAllowance={peggedAllowance}
                    leveragedAllowance={leveragedAllowance}
                    totalCollateralValue={totalCollateralValue}
                    peggedTokenData={peggedTokenData}
                    leveragedTokenData={leveragedTokenData}
                    priceData={priceData as bigint}
                  />
                </div>
                <div className="text-[10px] text-[#F5F5F5]/50 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <SystemHealth.Value
                      type="collateralTokens"
                      marketId={selectedMarket}
                      collateralTokenBalance={formattedBalance}
                      collateralAllowance={collateralAllowance}
                      peggedAllowance={peggedAllowance}
                      leveragedAllowance={leveragedAllowance}
                      totalCollateralValue={totalCollateralValue}
                      peggedTokenData={peggedTokenData}
                      leveragedTokenData={leveragedTokenData}
                      priceData={priceData as bigint}
                    />{" "}
                    wstETH
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          currentMarket.addresses.collateralToken
                        );
                      }}
                      className="text-[#F5F5F5]/50 hover:text-[#F5F5F5]/70 transition-colors group relative"
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-[#0A0A0A] text-[#F5F5F5] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Copy Address
                      </div>
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
                    <span className="text-[#F5F5F5]/20">|</span>
                    <a
                      href={`https://etherscan.io/address/${currentMarket.addresses.collateralToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#F5F5F5]/50 hover:text-[#F5F5F5]/70 transition-colors group relative"
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-[#0A0A0A] text-[#F5F5F5] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        View on Etherscan
                      </div>
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
                  </div>
                </div>
              </div>
            </div>

            {/* Collateral Ratio */}
            <div className="bg-[#0A0A0A] p-4 flex flex-col items-center justify-center">
              <h3 className="text-xs text-[#F5F5F5]/70 mb-2 text-center">
                Collateral Ratio
              </h3>
              <div>
                <div
                  className={`text-xl font-medium mb-1 text-center ${geo.className}`}
                >
                  <SystemHealth.Value
                    type="collateralRatio"
                    marketId={selectedMarket}
                    collateralRatio={collateralRatio}
                    peggedTokenData={peggedTokenData}
                    leveragedTokenData={leveragedTokenData}
                    priceData={priceData as bigint}
                  />
                </div>
                <div className="text-[10px] text-[#F5F5F5]/50 text-center">
                  Rebalance at: 150%
                </div>
              </div>
            </div>

            {/* Pegged Tokens */}
            <div className="bg-[#0A0A0A] p-4 flex flex-col items-center justify-center">
              <h3 className="text-xs text-[#F5F5F5]/70 mb-2 text-center">
                Pegged Tokens
              </h3>
              <div>
                <div
                  className={`text-xl font-medium mb-1 text-center ${geo.className}`}
                >
                  $
                  <SystemHealth.Value
                    type="peggedValue"
                    marketId={selectedMarket}
                    collateralTokenBalance={formattedBalance}
                    collateralAllowance={collateralAllowance}
                    peggedAllowance={peggedAllowance}
                    leveragedAllowance={leveragedAllowance}
                    peggedTokenData={peggedTokenData}
                    leveragedTokenData={leveragedTokenData}
                    priceData={priceData as bigint}
                  />
                </div>
                <div className="text-[10px] text-[#F5F5F5]/50 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <SystemHealth.Value
                      type="peggedTokens"
                      marketId={selectedMarket}
                      collateralTokenBalance={formattedBalance}
                      collateralAllowance={collateralAllowance}
                      peggedAllowance={peggedAllowance}
                      leveragedAllowance={leveragedAllowance}
                      peggedTokenData={peggedTokenData}
                      leveragedTokenData={leveragedTokenData}
                      priceData={priceData as bigint}
                    />{" "}
                    zheUSD
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          currentMarket.addresses.peggedToken
                        );
                      }}
                      className="text-[#F5F5F5]/50 hover:text-[#F5F5F5]/70 transition-colors group relative"
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-[#0A0A0A] text-[#F5F5F5] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Copy Address
                      </div>
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
                    <span className="text-[#F5F5F5]/20">|</span>
                    <a
                      href={`https://etherscan.io/address/${currentMarket.addresses.peggedToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#F5F5F5]/50 hover:text-[#F5F5F5]/70 transition-colors group relative"
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-[#0A0A0A] text-[#F5F5F5] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        View on Etherscan
                      </div>
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
                  </div>
                </div>
              </div>
            </div>

            {/* Leveraged Tokens */}
            <div className="bg-[#0A0A0A] p-4 flex flex-col items-center justify-center">
              <h3 className="text-xs text-[#F5F5F5]/70 mb-2 text-center">
                Leveraged Tokens
              </h3>
              <div>
                <div
                  className={`text-xl font-medium mb-1 text-center ${geo.className}`}
                >
                  <SystemHealth.Value
                    type="leveragedValue"
                    marketId={selectedMarket}
                    collateralTokenBalance={formattedBalance}
                    collateralAllowance={collateralAllowance}
                    peggedAllowance={peggedAllowance}
                    leveragedAllowance={leveragedAllowance}
                    peggedTokenData={peggedTokenData}
                    leveragedTokenData={leveragedTokenData}
                    priceData={priceData as bigint}
                    leveragedTokenPrice={leveragedTokenPrice}
                  />
                </div>
                <div className="text-[10px] text-[#F5F5F5]/50 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <SystemHealth.Value
                      type="leveragedTokens"
                      marketId={selectedMarket}
                      collateralTokenBalance={formattedBalance}
                      collateralAllowance={collateralAllowance}
                      peggedAllowance={peggedAllowance}
                      leveragedAllowance={leveragedAllowance}
                      peggedTokenData={peggedTokenData}
                      leveragedTokenData={leveragedTokenData}
                      priceData={priceData as bigint}
                    />{" "}
                    steamedETH
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          currentMarket.addresses.leveragedToken
                        );
                      }}
                      className="text-[#F5F5F5]/50 hover:text-[#F5F5F5]/70 transition-colors group relative"
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-[#0A0A0A] text-[#F5F5F5] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Copy Address
                      </div>
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
                    <span className="text-[#F5F5F5]/20">|</span>
                    <a
                      href={`https://etherscan.io/address/${currentMarket.addresses.leveragedToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#F5F5F5]/50 hover:text-[#F5F5F5]/70 transition-colors group relative"
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-[#0A0A0A] text-[#F5F5F5] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        View on Etherscan
                      </div>
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
                  </div>
                </div>
              </div>
            </div>

            {/* Price Oracle */}
            <div className="bg-[#0A0A0A] p-4 flex flex-col items-center justify-center">
              <h3 className="text-xs text-[#F5F5F5]/70 mb-2 text-center">
                Price Oracle
              </h3>
              <div>
                <div
                  className={`text-xl font-medium mb-1 text-center ${geo.className}`}
                >
                  Chainlink
                </div>
                <div className="text-xs text-[#F5F5F5]/50 text-center">
                  <div className="flex items-center justify-center gap-2">
                    stETH/USD
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          currentMarket.addresses.priceOracle
                        );
                      }}
                      className="text-[#F5F5F5]/50 hover:text-[#F5F5F5]/70 transition-colors group relative"
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-[#0A0A0A] text-[#F5F5F5] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Copy Address
                      </div>
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
                    <span className="text-[#F5F5F5]/20">|</span>
                    <a
                      href={`https://etherscan.io/address/${currentMarket.addresses.priceOracle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#F5F5F5]/50 hover:text-[#F5F5F5]/70 transition-colors group relative"
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-[#0A0A0A] text-[#F5F5F5] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        View on Etherscan
                      </div>
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart and Trading Interface */}
        <div className="max-w-5xl mx-auto">
          {/* Single Grey Box Container */}
          <div className="bg-[#202020] p-6 relative z-20 mt-[24px] shadow-[0_0_30px_rgba(74,124,89,0.1)]">
            <div className="absolute inset-0 bg-[#202020] z-10"></div>
            <div className="relative z-20">
              {/* Two Column Layout */}
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column - Trading Interface */}
                <div>
                  {/* Main Box */}
                  <div>
                    {/* Token Type Tabs */}
                    <div className="flex border-b border-[#4A7C59]/20 mb-2">
                      <button
                        type="button"
                        onClick={() => setSelectedType("LONG")}
                        className={`px-6 py-3 text-base font-medium relative ${
                          geo.className
                        } ${
                          selectedType === "LONG"
                            ? "text-[#4A7C59] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#4A7C59] after:shadow-[0_0_10px_rgba(74,124,89,0.5)]"
                            : "text-[#F5F5F5]/60 hover:text-[#F5F5F5]/90"
                        }`}
                      >
                        PEGGED
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedType("STEAMED")}
                        className={`px-6 py-3 text-base font-medium relative ${
                          geo.className
                        } ${
                          selectedType === "STEAMED"
                            ? "text-[#4A7C59] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#4A7C59] after:shadow-[0_0_10px_rgba(74,124,89,0.5)]"
                            : "text-[#F5F5F5]/60 hover:text-[#F5F5F5]/90"
                        }`}
                      >
                        LEVERAGE
                      </button>
                    </div>

                    {/* Content Box with Flip Animation */}
                    <div className="relative [perspective:2000px] h-[600px]">
                      <div
                        className={`absolute inset-0 transition-all duration-150 [transform-style:preserve-3d] ${
                          selectedType === "LONG"
                            ? "[transform:rotateY(0deg)]"
                            : "[transform:rotateY(180deg)]"
                        }`}
                      >
                        {/* Front Side (PEGGED) */}
                        <div className="absolute inset-0 bg-[#0A0A0A]/90 before:absolute before:inset-0 before:bg-black/90 shadow-[0_0_15px_rgba(74,124,89,0.1)] [backface-visibility:hidden]">
                          <div
                            className={`relative z-10 h-full transition-opacity duration-50 delay-[145ms] ${
                              selectedType === "LONG"
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          >
                            <div className="p-6">
                              <div className="text-center mb-6">
                                <h1
                                  className={`text-3xl text-[#4A7C59] mb-1 ${geo.className}`}
                                >
                                  {selectedType === "LONG"
                                    ? "zheUSD"
                                    : "steamedETH"}
                                </h1>
                                {selectedType === "STEAMED" && (
                                  <div className="text-[#F5F5F5]/50 text-sm">
                                    <span className="block text-[10px] mb-0.5">
                                      Leverage
                                    </span>
                                    {formatLeverageRatio(leverageRatioResult)}
                                  </div>
                                )}
                              </div>

                              <form
                                onSubmit={handleSubmit}
                                className="space-y-8"
                              >
                                {/* Swap Interface */}
                                <div className="space-y-6 relative">
                                  {/* Input Boxes Container */}
                                  <div className="relative h-[360px]">
                                    {/* First Token Input (wstETH) */}
                                    <div
                                      className={`absolute w-full space-y-2 transition-all duration-200 ${
                                        isCollateralAtTop
                                          ? "translate-y-0"
                                          : "translate-y-[calc(260%+2rem)]"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <label className="text-sm text-[#F5F5F5]/80">
                                          From
                                        </label>
                                        <span className="text-sm text-[#F5F5F5]/60">
                                          Balance:{" "}
                                          {formatBalance(
                                            collateralBalance?.[0]?.result
                                          )}{" "}
                                          wstETH
                                        </span>
                                      </div>
                                      <div className="flex-1 relative">
                                        <input
                                          type="text"
                                          value={inputAmount}
                                          onChange={handleInputAmountChange}
                                          placeholder="0.0"
                                          className="w-full bg-[#202020] text-[#F5F5F5] border border-[#4A7C59]/30 focus:border-[#4A7C59] outline-none transition-all p-4 pr-24"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-end">
                                          <div className="flex items-center gap-2">
                                            <button
                                              type="button"
                                              onClick={handleMaxClick}
                                              className="text-[#4A7C59] hover:text-[#3A6147] text-sm transition-colors"
                                            >
                                              MAX
                                            </button>
                                            <span className="text-[#F5F5F5]/70">
                                              wstETH
                                            </span>
                                          </div>
                                          {isCollateralAtTop && (
                                            <button
                                              onClick={() => {
                                                window.open(
                                                  "https://swap.defillama.com/?chain=ethereum&from=0x0000000000000000000000000000000000000000&tab=swap&to=0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0",
                                                  "_blank"
                                                );
                                              }}
                                              className="text-[#4A7C59] hover:text-[#3A6147] text-[10px] transition-colors"
                                            >
                                              Get wstETH
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Swap Direction and Fee */}
                                    <div className="absolute top-[160px] left-0 right-0 flex items-center justify-between">
                                      {/* Mint Fee */}
                                      <div className="text-xs text-[#F5F5F5]/80 text-right min-w-[80px] flex items-center justify-end gap-1">
                                        <span
                                          className={`${
                                            isCollateralAtTop
                                              ? "text-[#F5F5F5]/70"
                                              : "text-[#F5F5F5]/30"
                                          }`}
                                        >
                                          Fee:
                                        </span>
                                        <span
                                          className={`${
                                            isCollateralAtTop
                                              ? "text-[#4A7C59]"
                                              : "text-[#F5F5F5]/30"
                                          }`}
                                        >
                                          {formatFeeRatio(mintFeeResult)}
                                        </span>
                                      </div>

                                      {/* Arrow Button Group */}
                                      <div className="flex items-center gap-3">
                                        {/* Mint label */}
                                        <span
                                          className={`text-sm font-medium transition-colors duration-200 ${
                                            isCollateralAtTop
                                              ? "text-[#4A7C59]"
                                              : "text-[#F5F5F5]/40"
                                          }`}
                                        >
                                          Mint
                                        </span>

                                        {/* Arrow Button */}
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setIsCollateralAtTop(
                                              !isCollateralAtTop
                                            )
                                          }
                                          className="group relative flex items-center justify-center gap-1 px-2 py-2 bg-[#4A7C59] hover:bg-[#3A6147] transition-colors"
                                        >
                                          {/* Down arrow for Mint */}
                                          <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            className={`w-5 h-5 transition-transform duration-200 ${
                                              !isCollateralAtTop
                                                ? "rotate-180"
                                                : "rotate-0"
                                            }`}
                                          >
                                            <path
                                              d="M12 4V20M19 13L12 20L5 13"
                                              stroke="#F5F5F5"
                                              strokeOpacity={
                                                isCollateralAtTop ? "1" : "0.3"
                                              }
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            />
                                          </svg>
                                          {/* Up arrow for Redeem */}
                                          <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            className={`w-5 h-5 transition-transform duration-200 ${
                                              !isCollateralAtTop
                                                ? "rotate-180"
                                                : "rotate-0"
                                            }`}
                                          >
                                            <path
                                              d="M12 20V4M5 11L12 4L19 11"
                                              stroke="#F5F5F5"
                                              strokeOpacity={
                                                !isCollateralAtTop ? "1" : "0.3"
                                              }
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            />
                                          </svg>
                                        </button>

                                        {/* Redeem label */}
                                        <span
                                          className={`text-sm font-medium transition-colors duration-200 ${
                                            !isCollateralAtTop
                                              ? "text-[#4A7C59]"
                                              : "text-[#F5F5F5]/40"
                                          }`}
                                        >
                                          Redeem
                                        </span>
                                      </div>

                                      {/* Redeem Fee */}
                                      <div className="text-xs text-left min-w-[80px] flex items-center justify-start gap-1">
                                        <span
                                          className={`${
                                            !isCollateralAtTop
                                              ? "text-[#F5F5F5]/70"
                                              : "text-[#F5F5F5]/30"
                                          }`}
                                        >
                                          Fee:
                                        </span>
                                        <span
                                          className={`${
                                            !isCollateralAtTop
                                              ? "text-[#4A7C59]"
                                              : "text-[#F5F5F5]/30"
                                          }`}
                                        >
                                          {formatFeeRatio(redeemFeeResult)}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Second Token Input (zheUSD/steamedETH) */}
                                    <div
                                      className={`absolute w-full space-y-2 transition-all duration-200 ${
                                        isCollateralAtTop
                                          ? "translate-y-[calc(260%+2rem)]"
                                          : "translate-y-0"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <label className="text-sm text-[#F5F5F5]/80">
                                          To
                                        </label>
                                        <span className="text-sm text-[#F5F5F5]/60">
                                          Balance:{" "}
                                          {formatBalance(
                                            selectedType === "LONG"
                                              ? peggedBalance?.[0]?.result
                                              : leveragedBalance?.[0]?.result
                                          )}{" "}
                                          {selectedType === "LONG"
                                            ? "zheUSD"
                                            : "steamedETH"}
                                        </span>
                                      </div>
                                      <div className="relative">
                                        <input
                                          type="number"
                                          value={outputAmount}
                                          onChange={handleOutputAmountChange}
                                          placeholder="0.0"
                                          className="w-full p-4 bg-[#202020] text-[#F5F5F5] border border-[#4A7C59]/30 focus:border-[#4A7C59] outline-none transition-all pr-24 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F5F5F5]/70">
                                          {selectedType === "LONG"
                                            ? "zheUSD"
                                            : "steamedETH"}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Submit Button */}
                                  <div className="relative [perspective:1000px]">
                                    {!isConnected ? (
                                      <button
                                        type="submit"
                                        disabled
                                        className={`w-full p-4 text-center text-2xl bg-[#1F3529] text-[#4A7C59] cursor-not-allowed ${geo.className}`}
                                      >
                                        Connect Wallet
                                      </button>
                                    ) : isPending ? (
                                      <button
                                        type="submit"
                                        disabled
                                        className={`w-full p-4 text-center text-2xl bg-[#1F3529] text-[#4A7C59] cursor-not-allowed ${geo.className}`}
                                      >
                                        Pending...
                                      </button>
                                    ) : (
                                      <div
                                        className="[transform-style:preserve-3d] transition-transform duration-200 relative h-[60px]"
                                        style={{
                                          transformOrigin: "center center",
                                          transform: isCollateralAtTop
                                            ? "rotateX(0deg)"
                                            : "rotateX(180deg)",
                                        }}
                                      >
                                        <button
                                          onClick={handleSubmit}
                                          disabled={!inputAmount}
                                          className="w-full p-4 text-center text-2xl bg-[#4A7C59] hover:bg-[#5A8C69] text-white absolute inset-0 [backface-visibility:hidden] [transform-style:preserve-3d] shadow-[0_0_20px_rgba(74,124,89,0.2)] disabled:bg-[#1F3529] disabled:text-[#4A7C59] disabled:cursor-not-allowed"
                                        >
                                          <span className={geo.className}>
                                            {(() => {
                                              if (!inputAmount)
                                                return "Enter Amount";
                                              const currentAllowance =
                                                isCollateralAtTop
                                                  ? collateralAllowance?.[0]
                                                      ?.result
                                                  : selectedType === "LONG"
                                                  ? peggedAllowance?.[0]?.result
                                                  : leveragedAllowance?.[0]
                                                      ?.result;
                                              const parsedAmount = parseEther(
                                                inputAmount || "0"
                                              );

                                              if (
                                                currentAllowance &&
                                                currentAllowance < parsedAmount
                                              ) {
                                                return `APPROVE ${
                                                  isCollateralAtTop
                                                    ? "COLLATERAL"
                                                    : selectedType === "LONG"
                                                    ? "PEGGED"
                                                    : "LEVERAGED"
                                                }`;
                                              }

                                              return "MINT";
                                            })()}
                                          </span>
                                        </button>
                                        <button
                                          onClick={handleSubmit}
                                          disabled={!inputAmount}
                                          className="w-full p-4 text-center text-2xl bg-[#4A7C59] hover:bg-[#5A8C69] text-white absolute inset-0 [transform:rotateX(180deg)] [backface-visibility:hidden] [transform-style:preserve-3d] disabled:bg-[#1F3529] disabled:text-[#4A7C59] disabled:cursor-not-allowed"
                                        >
                                          <span className={geo.className}>
                                            {(() => {
                                              if (!inputAmount)
                                                return "Enter Amount";
                                              const currentAllowance =
                                                isCollateralAtTop
                                                  ? collateralAllowance?.[0]
                                                      ?.result
                                                  : selectedType === "LONG"
                                                  ? peggedAllowance?.[0]?.result
                                                  : leveragedAllowance?.[0]
                                                      ?.result;
                                              const parsedAmount = parseEther(
                                                inputAmount || "0"
                                              );

                                              if (
                                                currentAllowance &&
                                                currentAllowance < parsedAmount
                                              ) {
                                                return `APPROVE ${
                                                  isCollateralAtTop
                                                    ? "COLLATERAL"
                                                    : selectedType === "LONG"
                                                    ? "PEGGED"
                                                    : "LEVERAGED"
                                                }`;
                                              }

                                              return "REDEEM";
                                            })()}
                                          </span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </form>
                            </div>
                          </div>
                        </div>

                        {/* Back Side (LEVERAGE) */}
                        <div className="absolute inset-0 bg-[#0A0A0A]/90 before:absolute before:inset-0 before:bg-black/90 shadow-[0_0_15px_rgba(74,124,89,0.1)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
                          <div
                            className={`relative z-10 h-full transition-opacity duration-50 delay-[145ms] ${
                              selectedType === "STEAMED"
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          >
                            <div className="p-6">
                              <div className="text-center mb-6">
                                <h1
                                  className={`text-3xl text-[#4A7C59] mb-1 ${geo.className}`}
                                >
                                  {selectedType === "LONG"
                                    ? "zheUSD"
                                    : "steamedETH"}
                                </h1>
                                {selectedType === "LONG" && (
                                  <div className="text-[#F5F5F5]/50 text-sm">
                                    <span className="block text-[10px] mb-0.5">
                                      Leverage
                                    </span>
                                    {formatLeverageRatio(leverageRatioResult)}
                                  </div>
                                )}
                              </div>

                              <form
                                onSubmit={handleSubmit}
                                className="space-y-8"
                              >
                                {/* Swap Interface */}
                                <div className="space-y-6 relative">
                                  {/* Input Boxes Container */}
                                  <div className="relative h-[360px]">
                                    {/* First Token Input (wstETH) */}
                                    <div
                                      className={`absolute w-full space-y-2 transition-all duration-200 ${
                                        isCollateralAtTop
                                          ? "translate-y-0"
                                          : "translate-y-[calc(260%+2rem)]"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <label className="text-sm text-[#F5F5F5]/80">
                                          From
                                        </label>
                                        <span className="text-sm text-[#F5F5F5]/60">
                                          Balance:{" "}
                                          {formatBalance(
                                            collateralBalance?.[0]?.result
                                          )}{" "}
                                          wstETH
                                        </span>
                                      </div>
                                      <div className="flex-1 relative">
                                        <input
                                          type="text"
                                          value={inputAmount}
                                          onChange={handleInputAmountChange}
                                          placeholder="0.0"
                                          className="w-full bg-[#202020] text-[#F5F5F5] border border-[#4A7C59]/30 focus:border-[#4A7C59] outline-none transition-all p-4 pr-24"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-end">
                                          <div className="flex items-center gap-2">
                                            <button
                                              type="button"
                                              onClick={handleMaxClick}
                                              className="text-[#4A7C59] hover:text-[#3A6147] text-sm transition-colors"
                                            >
                                              MAX
                                            </button>
                                            <span className="text-[#F5F5F5]/70">
                                              wstETH
                                            </span>
                                          </div>
                                          {isCollateralAtTop && (
                                            <button
                                              onClick={() => {
                                                window.open(
                                                  "https://swap.defillama.com/?chain=ethereum&from=0x0000000000000000000000000000000000000000&tab=swap&to=0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0",
                                                  "_blank"
                                                );
                                              }}
                                              className="text-[#4A7C59] hover:text-[#3A6147] text-[10px] transition-colors"
                                            >
                                              Get wstETH
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Swap Direction and Fee */}
                                    <div className="absolute top-[160px] left-0 right-0 flex items-center justify-between">
                                      {/* Mint Fee */}
                                      <div className="text-xs text-[#F5F5F5]/80 text-right min-w-[80px] flex items-center justify-end gap-1">
                                        <span
                                          className={`${
                                            isCollateralAtTop
                                              ? "text-[#F5F5F5]/70"
                                              : "text-[#F5F5F5]/30"
                                          }`}
                                        >
                                          Fee:
                                        </span>
                                        <span
                                          className={`${
                                            isCollateralAtTop
                                              ? "text-[#4A7C59]"
                                              : "text-[#F5F5F5]/30"
                                          }`}
                                        >
                                          {formatFeeRatio(mintFeeResult)}
                                        </span>
                                      </div>

                                      {/* Arrow Button Group */}
                                      <div className="flex items-center gap-3">
                                        {/* Mint label */}
                                        <span
                                          className={`text-sm font-medium transition-colors duration-200 ${
                                            isCollateralAtTop
                                              ? "text-[#4A7C59]"
                                              : "text-[#F5F5F5]/40"
                                          }`}
                                        >
                                          Mint
                                        </span>

                                        {/* Arrow Button */}
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setIsCollateralAtTop(
                                              !isCollateralAtTop
                                            )
                                          }
                                          className="group relative flex items-center justify-center gap-1 px-2 py-2 bg-[#4A7C59] hover:bg-[#3A6147] transition-colors"
                                        >
                                          {/* Down arrow for Mint */}
                                          <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            className={`w-5 h-5 transition-transform duration-200 ${
                                              !isCollateralAtTop
                                                ? "rotate-180"
                                                : "rotate-0"
                                            }`}
                                          >
                                            <path
                                              d="M12 4V20M19 13L12 20L5 13"
                                              stroke="#F5F5F5"
                                              strokeOpacity={
                                                isCollateralAtTop ? "1" : "0.3"
                                              }
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            />
                                          </svg>
                                          {/* Up arrow for Redeem */}
                                          <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            className={`w-5 h-5 transition-transform duration-200 ${
                                              !isCollateralAtTop
                                                ? "rotate-180"
                                                : "rotate-0"
                                            }`}
                                          >
                                            <path
                                              d="M12 20V4M5 11L12 4L19 11"
                                              stroke="#F5F5F5"
                                              strokeOpacity={
                                                !isCollateralAtTop ? "1" : "0.3"
                                              }
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            />
                                          </svg>
                                        </button>

                                        {/* Redeem label */}
                                        <span
                                          className={`text-sm font-medium transition-colors duration-200 ${
                                            !isCollateralAtTop
                                              ? "text-[#4A7C59]"
                                              : "text-[#F5F5F5]/40"
                                          }`}
                                        >
                                          Redeem
                                        </span>
                                      </div>

                                      {/* Redeem Fee */}
                                      <div className="text-xs text-left min-w-[80px] flex items-center justify-start gap-1">
                                        <span
                                          className={`${
                                            !isCollateralAtTop
                                              ? "text-[#F5F5F5]/70"
                                              : "text-[#F5F5F5]/30"
                                          }`}
                                        >
                                          Fee:
                                        </span>
                                        <span
                                          className={`${
                                            !isCollateralAtTop
                                              ? "text-[#4A7C59]"
                                              : "text-[#F5F5F5]/30"
                                          }`}
                                        >
                                          {formatFeeRatio(redeemFeeResult)}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Second Token Input (zheUSD/steamedETH) */}
                                    <div
                                      className={`absolute w-full space-y-2 transition-all duration-200 ${
                                        isCollateralAtTop
                                          ? "translate-y-[calc(260%+2rem)]"
                                          : "translate-y-0"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <label className="text-sm text-[#F5F5F5]/80">
                                          To
                                        </label>
                                        <span className="text-sm text-[#F5F5F5]/60">
                                          Balance:{" "}
                                          {formatBalance(
                                            selectedType === "LONG"
                                              ? peggedBalance?.[0]?.result
                                              : leveragedBalance?.[0]?.result
                                          )}{" "}
                                          {selectedType === "LONG"
                                            ? "zheUSD"
                                            : "steamedETH"}
                                        </span>
                                      </div>
                                      <div className="relative">
                                        <input
                                          type="number"
                                          value={outputAmount}
                                          onChange={handleOutputAmountChange}
                                          placeholder="0.0"
                                          className="w-full p-4 bg-[#202020] text-[#F5F5F5] border border-[#4A7C59]/30 focus:border-[#4A7C59] outline-none transition-all pr-24 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F5F5F5]/70">
                                          {selectedType === "LONG"
                                            ? "zheUSD"
                                            : "steamedETH"}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Submit Button */}
                                  <div className="relative [perspective:1000px]">
                                    {!isConnected ? (
                                      <button
                                        type="submit"
                                        disabled
                                        className={`w-full p-4 text-center text-2xl bg-[#1F3529] text-[#4A7C59] cursor-not-allowed ${geo.className}`}
                                      >
                                        Connect Wallet
                                      </button>
                                    ) : isPending ? (
                                      <button
                                        type="submit"
                                        disabled
                                        className={`w-full p-4 text-center text-2xl bg-[#1F3529] text-[#4A7C59] cursor-not-allowed ${geo.className}`}
                                      >
                                        Pending...
                                      </button>
                                    ) : (
                                      <div
                                        className="[transform-style:preserve-3d] transition-transform duration-200 relative h-[60px]"
                                        style={{
                                          transformOrigin: "center center",
                                          transform: isCollateralAtTop
                                            ? "rotateX(0deg)"
                                            : "rotateX(180deg)",
                                        }}
                                      >
                                        <button
                                          onClick={handleSubmit}
                                          disabled={!inputAmount}
                                          className="w-full p-4 text-center text-2xl bg-[#4A7C59] hover:bg-[#5A8C69] text-white absolute inset-0 [backface-visibility:hidden] [transform-style:preserve-3d] shadow-[0_0_20px_rgba(74,124,89,0.2)] disabled:bg-[#1F3529] disabled:text-[#4A7C59] disabled:cursor-not-allowed"
                                        >
                                          <span className={geo.className}>
                                            {(() => {
                                              if (!inputAmount)
                                                return "Enter Amount";
                                              const currentAllowance =
                                                isCollateralAtTop
                                                  ? collateralAllowance?.[0]
                                                      ?.result
                                                  : selectedType === "LONG"
                                                  ? peggedAllowance?.[0]?.result
                                                  : leveragedAllowance?.[0]
                                                      ?.result;
                                              const parsedAmount = parseEther(
                                                inputAmount || "0"
                                              );

                                              if (
                                                currentAllowance &&
                                                currentAllowance < parsedAmount
                                              ) {
                                                return `APPROVE ${
                                                  isCollateralAtTop
                                                    ? "COLLATERAL"
                                                    : selectedType === "LONG"
                                                    ? "PEGGED"
                                                    : "LEVERAGED"
                                                }`;
                                              }

                                              return "MINT";
                                            })()}
                                          </span>
                                        </button>
                                        <button
                                          onClick={handleSubmit}
                                          disabled={!inputAmount}
                                          className="w-full p-4 text-center text-2xl bg-[#4A7C59] hover:bg-[#5A8C69] text-white absolute inset-0 [transform:rotateX(180deg)] [backface-visibility:hidden] [transform-style:preserve-3d] disabled:bg-[#1F3529] disabled:text-[#4A7C59] disabled:cursor-not-allowed"
                                        >
                                          <span className={geo.className}>
                                            {(() => {
                                              if (!inputAmount)
                                                return "Enter Amount";
                                              const currentAllowance =
                                                isCollateralAtTop
                                                  ? collateralAllowance?.[0]
                                                      ?.result
                                                  : selectedType === "LONG"
                                                  ? peggedAllowance?.[0]?.result
                                                  : leveragedAllowance?.[0]
                                                      ?.result;
                                              const parsedAmount = parseEther(
                                                inputAmount || "0"
                                              );

                                              if (
                                                currentAllowance &&
                                                currentAllowance < parsedAmount
                                              ) {
                                                return `APPROVE ${
                                                  isCollateralAtTop
                                                    ? "COLLATERAL"
                                                    : selectedType === "LONG"
                                                    ? "PEGGED"
                                                    : "LEVERAGED"
                                                }`;
                                              }

                                              return "REDEEM";
                                            })()}
                                          </span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </form>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Price History */}
                <div>
                  <div className="flex border-b border-[#4A7C59]/20 mb-2">
                    <h3
                      className={`px-6 py-3 text-base font-medium text-[#F5F5F5]/70 ${geo.className}`}
                    >
                      Price History
                    </h3>
                  </div>
                  <div className="relative [perspective:2000px] h-[600px]">
                    <div
                      className={`absolute inset-0 transition-all duration-150 [transform-style:preserve-3d] ${
                        selectedType === "LONG"
                          ? "[transform:rotateY(0deg)]"
                          : "[transform:rotateY(180deg)]"
                      }`}
                    >
                      {/* Front Side (PEGGED) */}
                      <div className="absolute inset-0 bg-[#0A0A0A]/90 before:absolute before:inset-0 before:bg-black/90 shadow-[0_0_15px_rgba(74,124,89,0.1)] [backface-visibility:hidden]">
                        <div
                          className={`relative z-10 h-full transition-opacity duration-50 delay-[145ms] ${
                            selectedType === "LONG"
                              ? "opacity-100"
                              : "opacity-0"
                          }`}
                        >
                          <div className="h-full">
                            <PriceChart
                              tokenType="LONG"
                              selectedToken={selectedToken}
                              marketId={selectedMarket}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Back Side (LEVERAGE) */}
                      <div className="absolute inset-0 bg-[#0A0A0A]/90 before:absolute before:inset-0 before:bg-black/90 shadow-[0_0_15px_rgba(74,124,89,0.1)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
                        <div
                          className={`relative z-10 h-full transition-opacity duration-50 delay-[145ms] ${
                            selectedType === "STEAMED"
                              ? "opacity-100"
                              : "opacity-0"
                          }`}
                        >
                          <div className="h-full">
                            <PriceChart
                              tokenType="STEAMED"
                              selectedToken={selectedToken}
                              marketId={selectedMarket}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}