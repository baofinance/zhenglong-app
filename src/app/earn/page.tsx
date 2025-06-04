"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccount, useContractReads, useContractWrite } from "wagmi";
import { parseEther } from "viem";
import { markets, MarketConfig } from "@/config/contracts";
import Navigation from "@/components/Navigation";
import { Geo } from "next/font/google";

const geo = Geo({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const stabilityPoolABI = [
  // View functions
  {
    inputs: [],
    name: "minter",
    outputs: [{ type: "address", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "liquidatableCollateralRatio",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "liquidationToken",
    outputs: [{ type: "address", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "assetToken",
    outputs: [{ type: "address", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalAssetSupply",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "assetBalanceOf",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "getBoostRatio",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "index", type: "uint256" }],
    name: "totalSupplyHistory",
    outputs: [
      { name: "atDay", type: "uint40" },
      { name: "amount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "lastAssetLossError",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "getStakerVoteOwner",
    outputs: [{ type: "address", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  // Write functions
  {
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "receiver", type: "address" },
      { name: "minAmount", type: "uint256" },
    ],
    name: "deposit",
    outputs: [{ type: "uint256", name: "amountDeposited" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    name: "withdraw",
    outputs: [{ type: "uint256", name: "amountWithdrawn" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "minPeggedAmount", type: "uint256" }],
    name: "liquidate",
    outputs: [{ type: "uint256", name: "liquidated" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Vote sharing functions
  {
    inputs: [{ name: "staker", type: "address" }],
    name: "toggleVoteSharing",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "newOwner", type: "address" }],
    name: "acceptSharedVote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "rejectSharedVote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    name: "withdrawFrom",
    outputs: [{ type: "uint256", name: "amountWithdrawn" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const rewardsABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "getClaimableRewards",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "claimRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// Add APR breakdown types and helper functions
interface APRBreakdown {
  collateralTokenAPR: bigint;
  steamTokenAPR: bigint;
}

const aprABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "getAPRBreakdown",
    outputs: [
      { name: "collateralTokenAPR", type: "uint256" },
      { name: "steamTokenAPR", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface PoolState {
  depositAmount: string;
  withdrawAmount: string;
  activeTab: "deposit" | "withdraw" | "rewards";
  isExpanded: boolean;
}

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
] as const;

// Add error types based on the interface
type RebalancePoolError =
  | "ErrorWrapperSrcMismatch"
  | "ErrorWrapperDstMismatch"
  | "DepositZeroAmount"
  | "DepositAmountLessThanMinimum"
  | "WithdrawZeroAmount"
  | "WithdrawAmountExceedsBalance"
  | "collateralRatioTooHigh"
  | "NotEnoughTokensToLiquidate"
  | "InvalidLiquidationToken"
  | "ErrorSelfSharingIsNotAllowed"
  | "ErrorCascadedSharingIsNotAllowed"
  | "ErrorVoteShareNotAllowed"
  | "ErrorNoAcceptedSharedVote"
  | "ErrorVoteOwnerCannotStake"
  | "ErrorRepeatAcceptSharedVote"
  | "RewardClaimFailed";

// Custom hooks for contract interactions
function useDeposit(marketId: string, pool: "collateral" | "leveraged") {
  const { write: deposit, isLoading: isDepositLoading } = useContractWrite({
    address: (
      markets[marketId].addresses as unknown as { [key: string]: string }
    )[
      pool === "collateral"
        ? "stabilityPoolCollateral"
        : "stabilityPoolLeveraged"
    ] as `0x${string}`,
    abi: stabilityPoolABI,
    functionName: "deposit",
  });

  return { deposit, isDepositLoading };
}

function useWithdraw(marketId: string, pool: "collateral" | "leveraged") {
  const { write: withdraw, isLoading: isWithdrawLoading } = useContractWrite({
    address: (
      markets[marketId].addresses as unknown as { [key: string]: string }
    )[
      pool === "collateral"
        ? "stabilityPoolCollateral"
        : "stabilityPoolLeveraged"
    ] as `0x${string}`,
    abi: stabilityPoolABI,
    functionName: "withdraw",
  });

  return { withdraw, isWithdrawLoading };
}

function useClaimRewards(marketId: string, pool: "collateral" | "leveraged") {
  const { write: claimRewards, isLoading: isClaimLoading } = useContractWrite({
    address: (
      markets[marketId].addresses as unknown as { [key: string]: string }
    )[
      pool === "collateral"
        ? "stabilityPoolCollateral"
        : "stabilityPoolLeveraged"
    ] as `0x${string}`,
    abi: rewardsABI,
    functionName: "claimRewards",
  });

  return { claimRewards, isClaimLoading };
}

export default function Earn() {
  const { isConnected, address } = useAccount();
  const [selectedMarket, setSelectedMarket] = useState(markets["steth-usd"].id);
  const [poolStates, setPoolStates] = useState<
    Record<string, { collateral: PoolState; leveraged: PoolState }>
  >({});
  const [error, setError] = useState<{
    type: RebalancePoolError | null;
    message: string;
    poolId: string;
    poolType: "collateral" | "leveraged";
  } | null>(null);
  const [isPending, setIsPending] = useState(false);

  const pool = "collateral";

  type MarketWrites = {
    collateral: {
      deposit: ReturnType<typeof useContractWrite>;
      withdraw: ReturnType<typeof useContractWrite>;
      claim: ReturnType<typeof useContractWrite>;
    };
    leveraged: {
      deposit: ReturnType<typeof useContractWrite>;
      withdraw: ReturnType<typeof useContractWrite>;
      claim: ReturnType<typeof useContractWrite>;
    };
  };

  type ContractWrites = {
    [key: string]: MarketWrites;
  };

  // Custom hook for market contract writes
  function useMarketContractWrites(marketId: string): MarketWrites {
    const market = markets[marketId];
    if (!market) {
      throw new Error(`Market ${marketId} not found`);
    }

    const poolAddress = (
      market.addresses as unknown as { [key: string]: string }
    )[
      pool === "collateral"
        ? "stabilityPoolCollateral"
        : "stabilityPoolLeveraged"
    ] as `0x${string}`;

    const collateralDeposit = useContractWrite({
      address: poolAddress,
      abi: stabilityPoolABI,
      functionName: "deposit",
    });

    const collateralWithdraw = useContractWrite({
      address: poolAddress,
      abi: stabilityPoolABI,
      functionName: "withdraw",
    });

    const collateralClaim = useContractWrite({
      address: poolAddress,
      abi: rewardsABI,
      functionName: "claimRewards",
    });

    const leveragedDeposit = useContractWrite({
      address: poolAddress,
      abi: stabilityPoolABI,
      functionName: "deposit",
    });

    const leveragedWithdraw = useContractWrite({
      address: poolAddress,
      abi: stabilityPoolABI,
      functionName: "withdraw",
    });

    const leveragedClaim = useContractWrite({
      address: poolAddress,
      abi: rewardsABI,
      functionName: "claimRewards",
    });

    return {
      collateral: {
        deposit: collateralDeposit,
        withdraw: collateralWithdraw,
        claim: collateralClaim,
      },
      leveraged: {
        deposit: leveragedDeposit,
        withdraw: leveragedWithdraw,
        claim: leveragedClaim,
      },
    };
  }

  // Create individual hooks for each market
  const marketId = "steth-usd";
  const marketWrites = useMarketContractWrites(marketId);

  // Combine all contract writes
  const contractWrites: ContractWrites = useMemo(
    () => ({
      [marketId]: marketWrites,
    }),
    [marketId, marketWrites]
  );

  // Group markets by pegged token
  const groupedMarkets = Object.entries(markets).reduce(
    (acc, [marketId, market]) => {
      const peggedToken = market.addresses.peggedToken;
      if (!acc[peggedToken]) {
        acc[peggedToken] = [];
      }
      acc[peggedToken].push({ marketId, ...market });
      return acc;
    },
    {} as Record<
      string,
      Array<{ marketId: string } & (typeof markets)[keyof typeof markets]>
    >
  );

  // Initialize pool states for all markets
  useEffect(() => {
    const initialPoolStates: Record<
      string,
      { collateral: PoolState; leveraged: PoolState }
    > = {};

    Object.keys(markets).forEach((marketId) => {
      initialPoolStates[marketId] = {
        collateral: {
          depositAmount: "",
          withdrawAmount: "",
          activeTab: "deposit",
          isExpanded: false,
        },
        leveraged: {
          depositAmount: "",
          withdrawAmount: "",
          activeTab: "deposit",
          isExpanded: false,
        },
      };
    });

    setPoolStates(initialPoolStates);
  }, []);

  // Get pool info for all markets
  const { data: poolsData } = useContractReads({
    contracts: Object.entries(markets).flatMap(([marketId, market]) => [
      // Collateral Pool
      {
        address: (
          markets[marketId].addresses as unknown as { [key: string]: string }
        )[
          pool === "collateral"
            ? "stabilityPoolCollateral"
            : "stabilityPoolLeveraged"
        ] as `0x${string}`,
        abi: stabilityPoolABI,
        functionName: "totalAssetSupply",
      } as const,
      {
        address: (
          markets[marketId].addresses as unknown as { [key: string]: string }
        )[
          pool === "collateral"
            ? "stabilityPoolCollateral"
            : "stabilityPoolLeveraged"
        ] as `0x${string}`,
        abi: stabilityPoolABI,
        functionName: "liquidatableCollateralRatio",
      } as const,
      {
        address: (
          markets[marketId].addresses as unknown as { [key: string]: string }
        )[
          pool === "collateral"
            ? "stabilityPoolCollateral"
            : "stabilityPoolLeveraged"
        ] as `0x${string}`,
        abi: stabilityPoolABI,
        functionName: "assetBalanceOf",
        args: [address ?? "0x0"],
      } as const,
      {
        address: (
          markets[marketId].addresses as unknown as { [key: string]: string }
        )[
          pool === "collateral"
            ? "stabilityPoolCollateral"
            : "stabilityPoolLeveraged"
        ] as `0x${string}`,
        abi: stabilityPoolABI,
        functionName: "getBoostRatio",
        args: [address ?? "0x0"],
      } as const,
      // Leveraged Pool
      {
        address: (
          markets[marketId].addresses as unknown as { [key: string]: string }
        )[
          pool === "collateral"
            ? "stabilityPoolCollateral"
            : "stabilityPoolLeveraged"
        ] as `0x${string}`,
        abi: stabilityPoolABI,
        functionName: "totalAssetSupply",
      } as const,
      {
        address: (
          markets[marketId].addresses as unknown as { [key: string]: string }
        )[
          pool === "collateral"
            ? "stabilityPoolCollateral"
            : "stabilityPoolLeveraged"
        ] as `0x${string}`,
        abi: stabilityPoolABI,
        functionName: "liquidatableCollateralRatio",
      } as const,
      {
        address: (
          markets[marketId].addresses as unknown as { [key: string]: string }
        )[
          pool === "collateral"
            ? "stabilityPoolCollateral"
            : "stabilityPoolLeveraged"
        ] as `0x${string}`,
        abi: stabilityPoolABI,
        functionName: "assetBalanceOf",
        args: [address ?? "0x0"],
      } as const,
      {
        address: (
          markets[marketId].addresses as unknown as { [key: string]: string }
        )[
          pool === "collateral"
            ? "stabilityPoolCollateral"
            : "stabilityPoolLeveraged"
        ] as `0x${string}`,
        abi: stabilityPoolABI,
        functionName: "getBoostRatio",
        args: [address ?? "0x0"],
      } as const,
    ]),
    watch: true,
  });

  // Get token allowances for all markets
  const { data: allowances } = useContractReads({
    contracts: Object.entries(markets).flatMap(([marketId, market]) => [
      // Collateral token allowance for collateral pool
      {
        address: market.addresses.collateralToken as `0x${string}`,
        abi: erc20ABI,
        functionName: "allowance",
        args: [
          address ?? "0x0",
          (markets[marketId].addresses as unknown as { [key: string]: string })[
            pool === "collateral"
              ? "stabilityPoolCollateral"
              : "stabilityPoolLeveraged"
          ] as `0x${string}`,
        ],
      } as const,
      // Collateral token allowance for leveraged pool
      {
        address: market.addresses.collateralToken as `0x${string}`,
        abi: erc20ABI,
        functionName: "allowance",
        args: [
          address ?? "0x0",
          (markets[marketId].addresses as unknown as { [key: string]: string })[
            pool === "collateral"
              ? "stabilityPoolCollateral"
              : "stabilityPoolLeveraged"
          ] as `0x${string}`,
        ],
      } as const,
    ]),
    watch: true,
  });

  // Get claimable rewards for all markets
  const { data: rewardsData } = useContractReads({
    contracts: Object.entries(markets).flatMap(([marketId, market]) => [
      // Collateral Pool Rewards
      {
        address: (
          markets[marketId].addresses as unknown as { [key: string]: string }
        )[
          pool === "collateral"
            ? "stabilityPoolCollateral"
            : "stabilityPoolLeveraged"
        ] as `0x${string}`,
        abi: rewardsABI,
        functionName: "getClaimableRewards",
        args: [address ?? "0x0"],
      } as const,
      // Leveraged Pool Rewards
      {
        address: (
          markets[marketId].addresses as unknown as { [key: string]: string }
        )[
          pool === "collateral"
            ? "stabilityPoolCollateral"
            : "stabilityPoolLeveraged"
        ] as `0x${string}`,
        abi: rewardsABI,
        functionName: "getClaimableRewards",
        args: [address ?? "0x0"],
      } as const,
    ]),
    watch: true,
  });

  // Get APR breakdowns for all markets
  const { data: aprBreakdownData } = useContractReads({
    contracts: Object.entries(markets).flatMap(([marketId, market]) => [
      // Collateral Pool APR Breakdown
      {
        address: (
          markets[marketId].addresses as unknown as { [key: string]: string }
        )[
          pool === "collateral"
            ? "stabilityPoolCollateral"
            : "stabilityPoolLeveraged"
        ] as `0x${string}`,
        abi: aprABI,
        functionName: "getAPRBreakdown",
        args: [address ?? "0x0"],
      } as const,
      // Leveraged Pool APR Breakdown
      {
        address: (
          markets[marketId].addresses as unknown as { [key: string]: string }
        )[
          pool === "collateral"
            ? "stabilityPoolCollateral"
            : "stabilityPoolLeveraged"
        ] as `0x${string}`,
        abi: aprABI,
        functionName: "getAPRBreakdown",
        args: [address ?? "0x0"],
      } as const,
    ]),
    watch: true,
  });

  // Get token balances for all markets
  const { data: tokenBalances } = useContractReads({
    contracts: Object.entries(markets).flatMap(([marketId, market]) => [
      // Pegged token balance
      {
        address: market.addresses.peggedToken as `0x${string}`,
        abi: erc20ABI,
        functionName: "balanceOf",
        args: [address ?? "0x0"],
      } as const,
    ]),
    watch: true,
  });

  // Format helpers
  const formatAmount = (value: bigint | undefined) => {
    if (!value) return "0.00";
    return (Number(value) / 1e18).toFixed(4);
  };

  const formatRatio = (value: bigint | undefined) => {
    if (!value) return "0%";
    return ((Number(value) / 1e18) * 100).toFixed(2) + "%";
  };

  // Format APR breakdown
  const formatAPRBreakdown = (
    breakdown: { collateralTokenAPR: bigint; steamTokenAPR: bigint } | undefined
  ) => {
    if (!breakdown) return { collateral: "0%", steam: "0%" };
    return {
      collateral:
        ((Number(breakdown.collateralTokenAPR) / 1e18) * 100).toFixed(2) + "%",
      steam: ((Number(breakdown.steamTokenAPR) / 1e18) * 100).toFixed(2) + "%",
    };
  };

  // Add formatting functions
  const formatAprRange = (apr: bigint | undefined) => {
    if (!apr) return "-";
    return `${(Number(apr) / 1e18).toFixed(2)}%`;
  };

  const formatCollateralRatio = (ratio: bigint | undefined) => {
    if (!ratio) return "-";
    return `${(Number(ratio) / 1e18).toFixed(2)}%`;
  };

  // Add data fetching
  const { data: aprData } = useContractReads({
    contracts: [
      {
        address: markets[selectedMarket].addresses.minter as `0x${string}`,
        abi: minterABI,
        functionName: "mintPeggedTokenIncentiveRatio",
      },
    ],
    watch: true,
  });

  const { data: depositData } = useContractReads({
    contracts: [
      {
        address: markets[selectedMarket].addresses.peggedToken as `0x${string}`,
        abi: erc20ABI,
        functionName: "balanceOf",
        args: [address ?? "0x0"],
      },
    ],
    enabled: !!address,
    watch: true,
  });

  const { data: earnedData } = useContractReads({
    contracts: [
      {
        address: markets[selectedMarket].addresses
          .collateralToken as `0x${string}`,
        abi: erc20ABI,
        functionName: "balanceOf",
        args: [address ?? "0x0"],
      },
    ],
    enabled: !!address,
    watch: true,
  });

  const { data: collateralRatioData } = useContractReads({
    contracts: [
      {
        address: markets[selectedMarket].addresses.minter as `0x${string}`,
        abi: minterABI,
        functionName: "leverageRatio",
      },
    ],
    watch: true,
  });

  // Handle deposits
  const handleDeposit = async (
    marketId: string,
    pool: "collateral" | "leveraged"
  ) => {
    if (!isConnected || !address) return;

    try {
      setError(null);
      setIsPending(true);

      const amount = parseEther(
        poolStates[marketId][pool].depositAmount || "0"
      );
      const write = contractWrites[marketId][pool].deposit;

      await write.writeAsync?.({
        args: [amount, address as `0x${string}`, amount],
      });

      // Reset form
      setPoolStates((prev) => ({
        ...prev,
        [marketId]: { ...prev[marketId], depositAmount: "" },
      }));
    } catch (error: any) {
      console.error("Deposit failed:", error);
      setError(error.message || "Deposit failed");
    } finally {
      setIsPending(false);
    }
  };

  // Handle withdrawals
  const handleWithdraw = async (
    marketId: string,
    pool: "collateral" | "leveraged"
  ) => {
    if (!isConnected || !address) return;

    try {
      setError(null);
      setIsPending(true);

      const amount = parseEther(
        poolStates[marketId][pool].withdrawAmount || "0"
      );
      const write = contractWrites[marketId][pool].withdraw;

      await write.writeAsync?.({
        args: [amount, address as `0x${string}`],
      });

      // Reset form
      setPoolStates((prev) => ({
        ...prev,
        [marketId]: { ...prev[marketId], withdrawAmount: "" },
      }));
    } catch (error: any) {
      console.error("Withdraw failed:", error);
      setError(error.message || "Withdraw failed");
    } finally {
      setIsPending(false);
    }
  };

  // Handle rewards claim
  const handleClaimRewards = async (
    marketId: string,
    pool: "collateral" | "leveraged"
  ) => {
    if (!isConnected || !address) return;

    try {
      setError(null);
      setIsPending(true);

      const write = contractWrites[marketId][pool].claim;
      await write.writeAsync?.();
    } catch (error: any) {
      console.error("Claim rewards failed:", error);
      setError(error.message || "Claim rewards failed");
    } finally {
      setIsPending(false);
    }
  };

  // Handle setting maximum amount for deposits and withdrawals
  const handleMaxDeposit = (
    marketId: string,
    pool: "collateral" | "leveraged"
  ) => {
    const marketIndex = Object.keys(markets).indexOf(marketId);
    const isCollateralPool = pool === "collateral";
    const isDeposit = poolStates[marketId]?.[pool]?.activeTab === "deposit";

    // Get the appropriate balance based on pool type
    const balance = tokenBalances?.[0]?.result;

    if (balance) {
      const formattedBalance = formatAmount(balance);
      if (isCollateralPool) {
        setPoolStates((prev) => ({
          ...prev,
          [marketId]: {
            ...prev[marketId],
            collateral: {
              ...prev[marketId].collateral,
              depositAmount: formattedBalance,
            },
          },
        }));
      } else {
        setPoolStates((prev) => ({
          ...prev,
          [marketId]: {
            ...prev[marketId],
            leveraged: {
              ...prev[marketId].leveraged,
              depositAmount: formattedBalance,
            },
          },
        }));
      }
    }
  };

  const handleMaxWithdraw = (
    marketId: string,
    pool: "collateral" | "leveraged"
  ) => {
    const marketIndex = Object.keys(markets).indexOf(marketId);
    const isCollateralPool = pool === "collateral";
    const isDeposit = poolStates[marketId]?.[pool]?.activeTab === "deposit";

    // Get the appropriate balance based on pool type
    const balance = tokenBalances?.[0]?.result;

    if (balance) {
      const formattedBalance = formatAmount(balance);
      if (isCollateralPool) {
        setPoolStates((prev) => ({
          ...prev,
          [marketId]: {
            ...prev[marketId],
            collateral: {
              ...prev[marketId].collateral,
              withdrawAmount: formattedBalance,
            },
          },
        }));
      } else {
        setPoolStates((prev) => ({
          ...prev,
          [marketId]: {
            ...prev[marketId],
            leveraged: {
              ...prev[marketId].leveraged,
              withdrawAmount: formattedBalance,
            },
          },
        }));
      }
    }
  };

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

      <main className="container mx-auto px-6 pt-32 pb-20 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={`text-4xl text-[#4A7C59] ${geo.className}`}>EARN</h1>
          <p className="text-[#F5F5F5]/60 text-sm mt-2">
            Deposit into stability or liquidity pools to earn STEAM and other
            rewards. Boost rewards by staking STEAM.
          </p>
        </div>

        {/* Markets by Token */}
        <div className="space-y-12">
          {Object.entries(groupedMarkets).map(([peggedToken, markets]) => (
            <div key={peggedToken}>
              {/* Token Section Header - Moved outside */}
              <div className="flex flex-col mb-6">
                <h2 className={`text-2xl text-[#4A7C59] ${geo.className}`}>
                  Stake {markets[0].genesis.rewards.pegged.symbol}
                </h2>
              </div>

              {/* Grey Box Content */}
              <div className="bg-[#1A1A1A] p-6 relative z-20">
                <div className="absolute inset-0 bg-[#1A1A1A] z-10"></div>
                <div className="relative z-20">
                  {/* Table Headers */}
                  <div className="grid grid-cols-6 gap-4 px-6 text-[#F5F5F5]/70 mb-4">
                    <div className={`col-span-2 ${geo.className} text-lg`}>
                      POOL
                    </div>
                    <div className="col-span-4 grid grid-cols-5 gap-2">
                      <div className={`${geo.className} text-lg`}>TVL</div>
                      <div className={`${geo.className} text-lg`}>
                        APR Range
                      </div>
                      <div className={`${geo.className} text-lg`}>Deposit</div>
                      <div className={`${geo.className} text-lg`}>Earned</div>
                      <div className={`${geo.className} text-lg`}>
                        Current Ratio
                      </div>
                    </div>
                  </div>

                  {/* Pools List */}
                  <div className="space-y-2">
                    {markets.map((market) => {
                      const marketIndex = Object.keys(markets).indexOf(
                        market.marketId
                      );
                      const dataOffset = marketIndex * 8;
                      const aprBreakdown =
                        aprBreakdownData?.[marketIndex * 2]?.result;
                      const { collateral: baseAPR, steam: boostAPR } =
                        formatAPRBreakdown(
                          aprBreakdown
                            ? {
                                collateralTokenAPR: aprBreakdown[0],
                                steamTokenAPR: aprBreakdown[1],
                              }
                            : undefined
                        );

                      return (
                        <div key={market.marketId} className="space-y-2">
                          {/* Collateral Pool */}
                          <div
                            onClick={() => {
                              setPoolStates((prev) => ({
                                ...prev,
                                [market.marketId]: {
                                  ...prev[market.marketId],
                                  collateral: {
                                    ...prev[market.marketId].collateral,
                                    isExpanded:
                                      !prev[market.marketId].collateral
                                        .isExpanded,
                                  },
                                },
                              }));
                            }}
                            className="bg-black p-4 relative z-20 cursor-pointer hover:bg-[#111111] transition-colors"
                          >
                            <div className="absolute inset-0 bg-black z-10"></div>
                            <div className="relative z-20">
                              {/* Pool Header and Description */}
                              <div className="grid grid-cols-6 gap-4 items-start">
                                <div className="col-span-2">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`text-xl text-[#4A7C59] ${geo.className}`}
                                    >
                                      {market.genesis.rewards.pegged.symbol}{" "}
                                      Stability Pool
                                    </div>
                                    <svg
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      className={`w-4 h-4 transition-transform duration-300 ${
                                        poolStates[market.marketId]?.collateral
                                          .isExpanded
                                          ? "rotate-180"
                                          : ""
                                      }`}
                                    >
                                      <path
                                        d="M6 9l6 6 6-6"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </div>
                                  <div className="text-[11px] text-[#F5F5F5]/60">
                                    Swaps for wstETH during stability mode
                                  </div>
                                </div>

                                {/* Data Values */}
                                <div className="col-span-4 grid grid-cols-5 gap-2 items-center">
                                  <div className="text-base">
                                    $
                                    {formatAmount(
                                      poolsData?.[dataOffset]?.result
                                    )}
                                  </div>
                                  <div className="text-base">
                                    {formatAprRange(
                                      aprData?.[dataOffset]?.result
                                    )}
                                  </div>
                                  <div className="text-base">
                                    $
                                    {formatAmount(
                                      depositData?.[dataOffset]?.result
                                    )}
                                  </div>
                                  <div className="text-base">
                                    $
                                    {formatAmount(
                                      earnedData?.[dataOffset]?.result
                                    )}
                                  </div>
                                  <div className="text-base">
                                    {formatCollateralRatio(
                                      collateralRatioData?.[dataOffset]?.result
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Expanded Content */}
                            <div
                              className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out relative z-30 ${
                                poolStates[market.marketId]?.collateral
                                  .isExpanded
                                  ? "max-h-[800px] opacity-100 mt-6"
                                  : "max-h-0 opacity-0"
                              }`}
                            >
                              {poolStates[market.marketId]?.collateral
                                .isExpanded && (
                                <div className="p-6 bg-[#111111]">
                                  {/* Tabs */}
                                  <div className="flex border-b border-[#4A7C59]/20">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPoolStates((prev) => ({
                                          ...prev,
                                          [market.marketId]: {
                                            ...prev[market.marketId],
                                            collateral: {
                                              ...prev[market.marketId]
                                                .collateral,
                                              activeTab: "deposit",
                                            },
                                          },
                                        }));
                                      }}
                                      className={`px-6 py-3 text-sm font-medium relative ${
                                        poolStates[market.marketId]?.collateral
                                          .activeTab === "deposit"
                                          ? "text-[#4A7C59] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#4A7C59]"
                                          : "text-[#F5F5F5]/50 hover:text-[#F5F5F5]"
                                      }`}
                                    >
                                      Deposit
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPoolStates((prev) => ({
                                          ...prev,
                                          [market.marketId]: {
                                            ...prev[market.marketId],
                                            collateral: {
                                              ...prev[market.marketId]
                                                .collateral,
                                              activeTab: "withdraw",
                                            },
                                          },
                                        }));
                                      }}
                                      className={`px-6 py-3 text-sm font-medium relative ${
                                        poolStates[market.marketId]?.collateral
                                          .activeTab === "withdraw"
                                          ? "text-[#4A7C59] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#4A7C59]"
                                          : "text-[#F5F5F5]/50 hover:text-[#F5F5F5]"
                                      }`}
                                    >
                                      Withdraw
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPoolStates((prev) => ({
                                          ...prev,
                                          [market.marketId]: {
                                            ...prev[market.marketId],
                                            collateral: {
                                              ...prev[market.marketId]
                                                .collateral,
                                              activeTab: "rewards",
                                            },
                                          },
                                        }));
                                      }}
                                      className={`px-6 py-3 text-sm font-medium relative ${
                                        poolStates[market.marketId]?.collateral
                                          .activeTab === "rewards"
                                          ? "text-[#4A7C59] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#4A7C59]"
                                          : "text-[#F5F5F5]/50 hover:text-[#F5F5F5]"
                                      }`}
                                    >
                                      Rewards
                                    </button>
                                  </div>

                                  {/* Tab Content */}
                                  <div
                                    className="mt-6 p-4 bg-black"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {/* Deposit Tab Content */}
                                    {poolStates[market.marketId]?.collateral
                                      .activeTab === "deposit" && (
                                      <div className="space-y-4">
                                        <div className="flex justify-between items-center mb-2">
                                          <p className="text-sm text-[#F5F5F5]/50">
                                            Wallet Balance
                                          </p>
                                          <p className="text-sm text-[#F5F5F5]">
                                            {formatAmount(
                                              tokenBalances?.[marketIndex]
                                                ?.result
                                            )}{" "}
                                            {
                                              market.genesis.rewards.pegged
                                                .symbol
                                            }
                                          </p>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                          <input
                                            type="text"
                                            value={
                                              poolStates[market.marketId]
                                                ?.collateral.depositAmount
                                            }
                                            onChange={(e) =>
                                              setPoolStates((prev) => ({
                                                ...prev,
                                                [market.marketId]: {
                                                  ...prev[market.marketId],
                                                  collateral: {
                                                    ...prev[market.marketId]
                                                      .collateral,
                                                    depositAmount:
                                                      e.target.value,
                                                  },
                                                },
                                              }))
                                            }
                                            placeholder="0.0"
                                            className={`flex-1 bg-black text-white p-3 border ${
                                              error?.poolId ===
                                                market.marketId &&
                                              error?.poolType ===
                                                "collateral" &&
                                              error?.type?.includes("Deposit")
                                                ? "border-red-500"
                                                : "border-[#4A7C59]/20 focus:border-[#4A7C59]"
                                            } focus:outline-none`}
                                          />
                                          <button
                                            onClick={() =>
                                              handleMaxDeposit(
                                                market.marketId,
                                                "collateral"
                                              )
                                            }
                                            className="px-4 py-2 text-sm bg-[#4A7C59]/10 text-[#4A7C59] hover:bg-[#4A7C59]/20 border border-[#4A7C59]/20"
                                          >
                                            MAX
                                          </button>
                                        </div>
                                        {error?.poolId === market.marketId &&
                                          error?.poolType === "collateral" &&
                                          error?.type?.includes("Deposit") && (
                                            <p className="text-sm text-red-500">
                                              {error.message}
                                            </p>
                                          )}
                                        <button
                                          onClick={() =>
                                            handleDeposit(
                                              market.marketId,
                                              "collateral"
                                            )
                                          }
                                          disabled={
                                            !isConnected ||
                                            !poolStates[market.marketId]
                                              ?.collateral.depositAmount
                                          }
                                          className="w-full py-3 bg-[#4A7C59] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4A7C59]/90"
                                        >
                                          Deposit
                                        </button>
                                      </div>
                                    )}

                                    {/* Withdraw Tab Content */}
                                    {poolStates[market.marketId]?.collateral
                                      .activeTab === "withdraw" && (
                                      <div className="space-y-4">
                                        <div className="flex items-center space-x-4">
                                          <input
                                            type="text"
                                            value={
                                              poolStates[market.marketId]
                                                ?.collateral.withdrawAmount
                                            }
                                            onChange={(e) =>
                                              setPoolStates((prev) => ({
                                                ...prev,
                                                [market.marketId]: {
                                                  ...prev[market.marketId],
                                                  collateral: {
                                                    ...prev[market.marketId]
                                                      .collateral,
                                                    withdrawAmount:
                                                      e.target.value,
                                                  },
                                                },
                                              }))
                                            }
                                            placeholder="0.0"
                                            className={`flex-1 bg-black text-white p-3 border ${
                                              error?.poolId ===
                                                market.marketId &&
                                              error?.poolType ===
                                                "collateral" &&
                                              error?.type?.includes("Withdraw")
                                                ? "border-red-500"
                                                : "border-[#4A7C59]/20 focus:border-[#4A7C59]"
                                            } focus:outline-none`}
                                          />
                                          <button
                                            onClick={() =>
                                              handleMaxWithdraw(
                                                market.marketId,
                                                "collateral"
                                              )
                                            }
                                            className="px-4 py-2 text-sm bg-[#4A7C59]/10 text-[#4A7C59] hover:bg-[#4A7C59]/20 border border-[#4A7C59]/20"
                                          >
                                            MAX
                                          </button>
                                        </div>
                                        {error?.poolId === market.marketId &&
                                          error?.poolType === "collateral" &&
                                          error?.type?.includes("Withdraw") && (
                                            <p className="text-sm text-red-500">
                                              {error.message}
                                            </p>
                                          )}
                                        <button
                                          onClick={() =>
                                            handleWithdraw(
                                              market.marketId,
                                              "collateral"
                                            )
                                          }
                                          disabled={
                                            !isConnected ||
                                            !poolStates[market.marketId]
                                              ?.collateral.withdrawAmount
                                          }
                                          className="w-full py-3 bg-[#4A7C59] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4A7C59]/90"
                                        >
                                          Withdraw
                                        </button>
                                      </div>
                                    )}

                                    {/* Rewards Tab Content */}
                                    {poolStates[market.marketId]?.collateral
                                      .activeTab === "rewards" && (
                                      <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <p className="text-sm text-[#F5F5F5]/50 mb-1">
                                              Claimable Rewards
                                            </p>
                                            <p className="text-lg font-medium text-[#4A7C59]">
                                              {formatAmount(
                                                rewardsData?.[marketIndex * 2]
                                                  ?.result
                                              )}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-sm text-[#F5F5F5]/50 mb-1">
                                              Boost Ratio
                                            </p>
                                            <p className="text-lg font-medium text-[#4A7C59]">
                                              {formatRatio(
                                                poolsData?.[marketIndex * 4 + 3]
                                                  ?.result
                                              )}
                                            </p>
                                          </div>
                                        </div>
                                        {error?.poolId === market.marketId &&
                                          error?.poolType === "collateral" &&
                                          error?.type?.includes("Reward") && (
                                            <p className="text-sm text-red-500">
                                              {error.message}
                                            </p>
                                          )}
                                        <button
                                          onClick={() =>
                                            handleClaimRewards(
                                              market.marketId,
                                              "collateral"
                                            )
                                          }
                                          disabled={
                                            !isConnected ||
                                            !rewardsData?.[marketIndex * 2]
                                              ?.result
                                          }
                                          className="w-full py-3 bg-[#4A7C59] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4A7C59]/90"
                                        >
                                          {error?.poolId === market.marketId &&
                                          error?.poolType === "collateral" &&
                                          error?.type?.includes("Reward")
                                            ? "Failed to Claim"
                                            : "Claim Rewards"}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Leveraged Pool */}
                          <div
                            onClick={() => {
                              setPoolStates((prev) => ({
                                ...prev,
                                [market.marketId]: {
                                  ...prev[market.marketId],
                                  leveraged: {
                                    ...prev[market.marketId].leveraged,
                                    isExpanded:
                                      !prev[market.marketId].leveraged
                                        .isExpanded,
                                  },
                                },
                              }));
                            }}
                            className="bg-black p-4 relative z-20 cursor-pointer hover:bg-[#111111] transition-colors"
                          >
                            <div className="absolute inset-0 bg-black z-10"></div>
                            <div className="relative z-20">
                              {/* Pool Header and Description */}
                              <div className="grid grid-cols-6 gap-4 items-start">
                                <div className="col-span-2">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`text-xl text-[#4A7C59] ${geo.className}`}
                                    >
                                      {market.genesis.rewards.leveraged.symbol}{" "}
                                      Leveraged Pool
                                    </div>
                                    <svg
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      className={`w-4 h-4 transition-transform duration-300 ${
                                        poolStates[market.marketId]?.leveraged
                                          .isExpanded
                                          ? "rotate-180"
                                          : ""
                                      }`}
                                    >
                                      <path
                                        d="M6 9l6 6 6-6"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </div>
                                  <div className="text-[11px] text-[#F5F5F5]/60">
                                    Swaps for steamedstETH during stability mode
                                  </div>
                                </div>

                                {/* Data Values */}
                                <div className="col-span-4 grid grid-cols-5 gap-2 items-center">
                                  <div className="text-base">
                                    $
                                    {formatAmount(
                                      poolsData?.[dataOffset + 1]?.result
                                    )}
                                  </div>
                                  <div className="text-base">
                                    {formatAprRange(
                                      aprData?.[dataOffset + 1]?.result
                                    )}
                                  </div>
                                  <div className="text-base">
                                    $
                                    {formatAmount(
                                      depositData?.[dataOffset + 1]?.result
                                    )}
                                  </div>
                                  <div className="text-base">
                                    $
                                    {formatAmount(
                                      earnedData?.[dataOffset + 1]?.result
                                    )}
                                  </div>
                                  <div className="text-base">
                                    {formatCollateralRatio(
                                      collateralRatioData?.[dataOffset + 1]
                                        ?.result
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Expanded Content */}
                            <div
                              className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out relative z-30 ${
                                poolStates[market.marketId]?.leveraged
                                  .isExpanded
                                  ? "max-h-[800px] opacity-100 mt-6"
                                  : "max-h-0 opacity-0"
                              }`}
                            >
                              {poolStates[market.marketId]?.leveraged
                                .isExpanded && (
                                <div className="p-6 bg-[#111111]">
                                  {/* Tabs */}
                                  <div className="flex border-b border-[#4A7C59]/20">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPoolStates((prev) => ({
                                          ...prev,
                                          [market.marketId]: {
                                            ...prev[market.marketId],
                                            leveraged: {
                                              ...prev[market.marketId]
                                                .leveraged,
                                              activeTab: "deposit",
                                            },
                                          },
                                        }));
                                      }}
                                      className={`px-6 py-3 text-sm font-medium relative ${
                                        poolStates[market.marketId]?.leveraged
                                          .activeTab === "deposit"
                                          ? "text-[#4A7C59] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#4A7C59]"
                                          : "text-[#F5F5F5]/50 hover:text-[#F5F5F5]"
                                      }`}
                                    >
                                      Deposit
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPoolStates((prev) => ({
                                          ...prev,
                                          [market.marketId]: {
                                            ...prev[market.marketId],
                                            leveraged: {
                                              ...prev[market.marketId]
                                                .leveraged,
                                              activeTab: "withdraw",
                                            },
                                          },
                                        }));
                                      }}
                                      className={`px-6 py-3 text-sm font-medium relative ${
                                        poolStates[market.marketId]?.leveraged
                                          .activeTab === "withdraw"
                                          ? "text-[#4A7C59] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#4A7C59]"
                                          : "text-[#F5F5F5]/50 hover:text-[#F5F5F5]"
                                      }`}
                                    >
                                      Withdraw
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPoolStates((prev) => ({
                                          ...prev,
                                          [market.marketId]: {
                                            ...prev[market.marketId],
                                            leveraged: {
                                              ...prev[market.marketId]
                                                .leveraged,
                                              activeTab: "rewards",
                                            },
                                          },
                                        }));
                                      }}
                                      className={`px-6 py-3 text-sm font-medium relative ${
                                        poolStates[market.marketId]?.leveraged
                                          .activeTab === "rewards"
                                          ? "text-[#4A7C59] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#4A7C59]"
                                          : "text-[#F5F5F5]/50 hover:text-[#F5F5F5]"
                                      }`}
                                    >
                                      Rewards
                                    </button>
                                  </div>

                                  {/* Tab Content */}
                                  <div
                                    className="mt-6 p-4 bg-black"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {/* Deposit Tab Content */}
                                    {poolStates[market.marketId]?.leveraged
                                      .activeTab === "deposit" && (
                                      <div className="space-y-4">
                                        <div className="flex justify-between items-center mb-2">
                                          <p className="text-sm text-[#F5F5F5]/50">
                                            Wallet Balance
                                          </p>
                                          <p className="text-sm text-[#F5F5F5]">
                                            {formatAmount(
                                              tokenBalances?.[marketIndex + 1]
                                                ?.result
                                            )}{" "}
                                            {
                                              market.genesis.rewards.pegged
                                                .symbol
                                            }
                                          </p>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                          <input
                                            type="text"
                                            value={
                                              poolStates[market.marketId]
                                                ?.leveraged.depositAmount
                                            }
                                            onChange={(e) =>
                                              setPoolStates((prev) => ({
                                                ...prev,
                                                [market.marketId]: {
                                                  ...prev[market.marketId],
                                                  leveraged: {
                                                    ...prev[market.marketId]
                                                      .leveraged,
                                                    depositAmount:
                                                      e.target.value,
                                                  },
                                                },
                                              }))
                                            }
                                            placeholder="0.0"
                                            className="flex-1 bg-black text-white p-3 border border-[#4A7C59]/20 focus:outline-none focus:border-[#4A7C59]"
                                          />
                                          <button
                                            onClick={() =>
                                              handleMaxDeposit(
                                                market.marketId,
                                                "leveraged"
                                              )
                                            }
                                            className="px-4 py-2 text-sm bg-[#4A7C59]/10 text-[#4A7C59] hover:bg-[#4A7C59]/20 border border-[#4A7C59]/20"
                                          >
                                            MAX
                                          </button>
                                        </div>
                                        <button
                                          onClick={() =>
                                            handleDeposit(
                                              market.marketId,
                                              "leveraged"
                                            )
                                          }
                                          disabled={
                                            !isConnected ||
                                            !poolStates[market.marketId]
                                              ?.leveraged.depositAmount
                                          }
                                          className="w-full py-3 bg-[#4A7C59] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4A7C59]/90"
                                        >
                                          Deposit
                                        </button>
                                      </div>
                                    )}

                                    {/* Withdraw Tab Content */}
                                    {poolStates[market.marketId]?.leveraged
                                      .activeTab === "withdraw" && (
                                      <div className="space-y-4">
                                        <div className="flex items-center space-x-4">
                                          <input
                                            type="text"
                                            value={
                                              poolStates[market.marketId]
                                                ?.leveraged.withdrawAmount
                                            }
                                            onChange={(e) =>
                                              setPoolStates((prev) => ({
                                                ...prev,
                                                [market.marketId]: {
                                                  ...prev[market.marketId],
                                                  leveraged: {
                                                    ...prev[market.marketId]
                                                      .leveraged,
                                                    withdrawAmount:
                                                      e.target.value,
                                                  },
                                                },
                                              }))
                                            }
                                            placeholder="0.0"
                                            className="flex-1 bg-black text-white p-3 border border-[#4A7C59]/20 focus:outline-none focus:border-[#4A7C59]"
                                          />
                                          <button
                                            onClick={() =>
                                              handleMaxWithdraw(
                                                market.marketId,
                                                "leveraged"
                                              )
                                            }
                                            className="px-4 py-2 text-sm bg-[#4A7C59]/10 text-[#4A7C59] hover:bg-[#4A7C59]/20 border border-[#4A7C59]/20"
                                          >
                                            MAX
                                          </button>
                                        </div>
                                        <button
                                          onClick={() =>
                                            handleWithdraw(
                                              market.marketId,
                                              "leveraged"
                                            )
                                          }
                                          disabled={
                                            !isConnected ||
                                            !poolStates[market.marketId]
                                              ?.leveraged.withdrawAmount
                                          }
                                          className="w-full py-3 bg-[#4A7C59] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4A7C59]/90"
                                        >
                                          Withdraw
                                        </button>
                                      </div>
                                    )}

                                    {/* Rewards Tab Content */}
                                    {poolStates[market.marketId]?.leveraged
                                      .activeTab === "rewards" && (
                                      <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <p className="text-sm text-[#F5F5F5]/50 mb-1">
                                              Claimable Rewards
                                            </p>
                                            <p className="text-lg font-medium text-[#4A7C59]">
                                              {formatAmount(
                                                rewardsData?.[
                                                  marketIndex * 2 + 1
                                                ]?.result
                                              )}
                                            </p>
                                          </div>
                                        </div>
                                        <button
                                          onClick={() =>
                                            handleClaimRewards(
                                              market.marketId,
                                              "leveraged"
                                            )
                                          }
                                          disabled={!isConnected}
                                          className="w-full py-3 bg-[#4A7C59] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4A7C59]/90"
                                        >
                                          Claim Rewards
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
