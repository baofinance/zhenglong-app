"use client";

import { useState } from "react";
import { useAccount, useContractReads, useContractWrite } from "wagmi";
import { parseEther } from "viem";
import { usePools } from "@/hooks/usePools";
import Navigation from "@/components/Navigation";
import { Geo } from "next/font/google";
import Link from "next/link";
import Image from "next/image";

const geo = Geo({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const stabilityPoolABI = [
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

type PoolAction = "deposit" | "withdraw" | "rewards";

// Tab Button Component
interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TabButton({ isActive, onClick, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 text-sm font-medium transition-colors ${
        isActive
          ? "text-white border-b-2 border-white"
          : "text-[#F5F5F5]/50 hover:text-[#F5F5F5]"
      }`}
    >
      {children}
    </button>
  );
}

// Input Field Component
interface InputFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  maxButton?: {
    onClick: () => void;
    label: string;
  };
}

function InputField({
  value,
  onChange,
  placeholder,
  maxButton,
}: InputFieldProps) {
  return (
    <div className="flex items-center space-x-4">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-black text-white p-3 border border-[#4A7C59]/20 focus:border-[#4A7C59] focus:outline-none"
      />
      {maxButton && (
        <button
          onClick={maxButton.onClick}
          className="px-4 py-2 text-sm bg-[#4A7C59]/10 text-white hover:bg-[#4A7C59]/20 border border-[#4A7C59]/20 transition-colors"
        >
          {maxButton.label}
        </button>
      )}
    </div>
  );
}

// Action Button Component
interface ActionButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
}

function ActionButton({
  onClick,
  disabled,
  isLoading,
  children,
  loadingText,
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className="w-full py-3 bg-[#4A7C59] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4A7C59]/90 transition-colors"
    >
      {isLoading ? loadingText || "Processing..." : children}
    </button>
  );
}

// Balance Display Component
interface BalanceDisplayProps {
  label: string;
  value: string;
  token?: string;
}

function BalanceDisplay({ label, value, token }: BalanceDisplayProps) {
  return (
    <div className="flex justify-between items-center mb-2">
      <p className="text-sm text-[#F5F5F5]/50">{label}</p>
      <p className="text-sm text-[#F5F5F5]">
        {value} {token}
      </p>
    </div>
  );
}

// Deposit Tab Component
interface DepositTabProps {
  depositAmount: string;
  setDepositAmount: (value: string) => void;
  tokenBalance: any;
  tokenSymbol: string;
  error: string | null;
  isConnected: boolean;
  isDepositLoading: boolean;
  isApproveLoading: boolean;
  handleDeposit: () => void;
  handleMaxDeposit: () => void;
  formatAmount: (value: bigint | undefined) => string;
}

function DepositTab({
  depositAmount,
  setDepositAmount,
  tokenBalance,
  tokenSymbol,
  error,
  isConnected,
  isDepositLoading,
  isApproveLoading,
  handleDeposit,
  handleMaxDeposit,
  formatAmount,
}: DepositTabProps) {
  return (
    <div className="space-y-4">
      <BalanceDisplay
        label="Wallet Balance"
        value={formatAmount(tokenBalance?.[0]?.result)}
        token={tokenSymbol}
      />
      <InputField
        value={depositAmount}
        onChange={setDepositAmount}
        placeholder="0.0"
        maxButton={{
          onClick: handleMaxDeposit,
          label: "MAX",
        }}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <ActionButton
        onClick={handleDeposit}
        disabled={!isConnected || !depositAmount}
        isLoading={isDepositLoading || isApproveLoading}
      >
        Deposit
      </ActionButton>
    </div>
  );
}

// Withdraw Tab Component
interface WithdrawTabProps {
  withdrawAmount: string;
  setWithdrawAmount: (value: string) => void;
  poolData: any;
  tokenSymbol: string;
  error: string | null;
  isConnected: boolean;
  isWithdrawLoading: boolean;
  handleWithdraw: () => void;
  handleMaxWithdraw: () => void;
  formatAmount: (value: bigint | undefined) => string;
}

function WithdrawTab({
  withdrawAmount,
  setWithdrawAmount,
  poolData,
  tokenSymbol,
  error,
  isConnected,
  isWithdrawLoading,
  handleWithdraw,
  handleMaxWithdraw,
  formatAmount,
}: WithdrawTabProps) {
  return (
    <div className="space-y-4">
      <BalanceDisplay
        label="Pool Balance"
        value={formatAmount(poolData?.[1]?.result)}
        token={tokenSymbol}
      />
      <InputField
        value={withdrawAmount}
        onChange={setWithdrawAmount}
        placeholder="0.0"
        maxButton={{
          onClick: handleMaxWithdraw,
          label: "MAX",
        }}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <ActionButton
        onClick={handleWithdraw}
        disabled={!isConnected || !withdrawAmount}
        isLoading={isWithdrawLoading}
      >
        Withdraw
      </ActionButton>
    </div>
  );
}

// Rewards Tab Component
interface RewardsTabProps {
  rewardsData: any;
  poolData: any;
  error: string | null;
  isConnected: boolean;
  isClaimLoading: boolean;
  handleClaimRewards: () => void;
  formatAmount: (value: bigint | undefined) => string;
  formatRatio: (value: bigint | undefined) => string;
}

function RewardsTab({
  rewardsData,
  poolData,
  error,
  isConnected,
  isClaimLoading,
  handleClaimRewards,
  formatAmount,
  formatRatio,
}: RewardsTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-[#F5F5F5]/50 mb-1">Claimable Rewards</p>
          <p className="text-lg font-medium text-white">
            {formatAmount(rewardsData?.[0]?.result)} STEAM
          </p>
        </div>
        <div>
          <p className="text-sm text-[#F5F5F5]/50 mb-1">Boost Ratio</p>
          <p className="text-lg font-medium text-white">
            {formatRatio(poolData?.[2]?.result)}
          </p>
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <ActionButton
        onClick={handleClaimRewards}
        disabled={!isConnected || !rewardsData?.[0]?.result}
        isLoading={isClaimLoading}
      >
        Claim Rewards
      </ActionButton>
    </div>
  );
}

// Main Action Tabs Component
interface ActionTabsProps {
  activeTab: PoolAction;
  setActiveTab: (tab: PoolAction) => void;
  depositAmount: string;
  setDepositAmount: (value: string) => void;
  withdrawAmount: string;
  setWithdrawAmount: (value: string) => void;
  tokenBalance: any;
  poolData: any;
  rewardsData: any;
  tokenSymbol: string;
  error: string | null;
  isConnected: boolean;
  isDepositLoading: boolean;
  isApproveLoading: boolean;
  isWithdrawLoading: boolean;
  isClaimLoading: boolean;
  handleDeposit: () => void;
  handleWithdraw: () => void;
  handleClaimRewards: () => void;
  handleMaxDeposit: () => void;
  handleMaxWithdraw: () => void;
  formatAmount: (value: bigint | undefined) => string;
  formatRatio: (value: bigint | undefined) => string;
}

function ActionTabs({
  activeTab,
  setActiveTab,
  depositAmount,
  setDepositAmount,
  withdrawAmount,
  setWithdrawAmount,
  tokenBalance,
  poolData,
  rewardsData,
  tokenSymbol,
  error,
  isConnected,
  isDepositLoading,
  isApproveLoading,
  isWithdrawLoading,
  isClaimLoading,
  handleDeposit,
  handleWithdraw,
  handleClaimRewards,
  handleMaxDeposit,
  handleMaxWithdraw,
  formatAmount,
  formatRatio,
}: ActionTabsProps) {
  return (
    <div className="bg-[#1A1A1A] p-6">
      {/* Tab Navigation */}
      <div className="flex mb-6">
        <TabButton
          isActive={activeTab === "deposit"}
          onClick={() => setActiveTab("deposit")}
        >
          Deposit
        </TabButton>
        <TabButton
          isActive={activeTab === "withdraw"}
          onClick={() => setActiveTab("withdraw")}
        >
          Withdraw
        </TabButton>
        <TabButton
          isActive={activeTab === "rewards"}
          onClick={() => setActiveTab("rewards")}
        >
          Rewards
        </TabButton>
      </div>

      {/* Tab Content */}
      <div className="p-4 bg-black">
        {activeTab === "deposit" && (
          <DepositTab
            depositAmount={depositAmount}
            setDepositAmount={setDepositAmount}
            tokenBalance={tokenBalance}
            tokenSymbol={tokenSymbol}
            error={error}
            isConnected={isConnected}
            isDepositLoading={isDepositLoading}
            isApproveLoading={isApproveLoading}
            handleDeposit={handleDeposit}
            handleMaxDeposit={handleMaxDeposit}
            formatAmount={formatAmount}
          />
        )}

        {activeTab === "withdraw" && (
          <WithdrawTab
            withdrawAmount={withdrawAmount}
            setWithdrawAmount={setWithdrawAmount}
            poolData={poolData}
            tokenSymbol={tokenSymbol}
            error={error}
            isConnected={isConnected}
            isWithdrawLoading={isWithdrawLoading}
            handleWithdraw={handleWithdraw}
            handleMaxWithdraw={handleMaxWithdraw}
            formatAmount={formatAmount}
          />
        )}

        {activeTab === "rewards" && (
          <RewardsTab
            rewardsData={rewardsData}
            poolData={poolData}
            error={error}
            isConnected={isConnected}
            isClaimLoading={isClaimLoading}
            handleClaimRewards={handleClaimRewards}
            formatAmount={formatAmount}
            formatRatio={formatRatio}
          />
        )}
      </div>
    </div>
  );
}

interface PoolClientProps {
  marketId: string;
  poolType: "collateral" | "leveraged";
}

export default function PoolClient({ marketId, poolType }: PoolClientProps) {
  const { isConnected, address } = useAccount();
  const [activeTab, setActiveTab] = useState<PoolAction>("deposit");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const { getPoolsByMarket } = usePools();

  const pools = getPoolsByMarket(marketId);
  const pool = pools.find((p) => p.poolType === poolType);

  const poolAddress = pool?.address;
  const tokenSymbol = pool?.tokenSymbol;
  const poolName = pool?.name;

  // Get pool data
  const { data: poolData } = useContractReads({
    contracts: poolAddress
      ? [
          {
            address: poolAddress as `0x${string}`,
            abi: stabilityPoolABI,
            functionName: "totalAssetSupply",
          },
          {
            address: poolAddress as `0x${string}`,
            abi: stabilityPoolABI,
            functionName: "assetBalanceOf",
            args: [address ?? "0x0"],
          },
          {
            address: poolAddress as `0x${string}`,
            abi: stabilityPoolABI,
            functionName: "getBoostRatio",
            args: [address ?? "0x0"],
          },
        ]
      : [],
  });

  // Get rewards data
  const { data: rewardsData } = useContractReads({
    contracts: poolAddress
      ? [
          {
            address: poolAddress as `0x${string}`,
            abi: rewardsABI,
            functionName: "getClaimableRewards",
            args: [address ?? "0x0"],
          },
        ]
      : [],
  });

  // Get APR data
  const { data: aprData } = useContractReads({
    contracts: poolAddress
      ? [
          {
            address: poolAddress as `0x${string}`,
            abi: aprABI,
            functionName: "getAPRBreakdown",
            args: [address ?? "0x0"],
          },
        ]
      : [],
  });

  // Get token balance
  const { data: tokenBalance } = useContractReads({
    contracts: pool?.address
      ? [
          {
            address: pool?.address as `0x${string}`,
            abi: erc20ABI,
            functionName: "balanceOf",
            args: [address ?? "0x0"],
          },
        ]
      : [],
  });

  // Get allowance
  const { data: allowance } = useContractReads({
    contracts:
      pool?.address && poolAddress
        ? [
            {
              address: pool?.address as `0x${string}`,
              abi: erc20ABI,
              functionName: "allowance",
              args: [address ?? "0x0", poolAddress as `0x${string}`],
            },
          ]
        : [],
  });

  // Contract writes
  const { write: deposit, isLoading: isDepositLoading } = useContractWrite({
    address: poolAddress as `0x${string}`,
    abi: stabilityPoolABI,
    functionName: "deposit",
  });

  const { write: withdraw, isLoading: isWithdrawLoading } = useContractWrite({
    address: poolAddress as `0x${string}`,
    abi: stabilityPoolABI,
    functionName: "withdraw",
  });

  const { write: claimRewards, isLoading: isClaimLoading } = useContractWrite({
    address: poolAddress as `0x${string}`,
    abi: rewardsABI,
    functionName: "claimRewards",
  });

  const { write: approve, isLoading: isApproveLoading } = useContractWrite({
    address: pool?.address as `0x${string}`,
    abi: erc20ABI,
    functionName: "approve",
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

  // Handlers
  const handleDeposit = async () => {
    if (!isConnected || !address || !depositAmount) return;

    try {
      setError(null);
      setIsPending(true);

      const amount = parseEther(depositAmount);
      if (!allowance?.[0]?.result || allowance[0].result < amount) {
        await approve({
          args: [poolAddress as `0x${string}`, amount],
        });
      }
      await deposit({
        args: [amount, address as `0x${string}`, amount],
      });
      setDepositAmount("");
    } catch (error: any) {
      console.error("Deposit failed:", error);
      setError(error.message || "Deposit failed");
    } finally {
      setIsPending(false);
    }
  };

  const handleWithdraw = async () => {
    if (!isConnected || !address || !withdrawAmount) return;
    try {
      setError(null);
      setIsPending(true);
      const amount = parseEther(withdrawAmount);
      await withdraw({
        args: [amount, address as `0x${string}`],
      });
      setWithdrawAmount("");
    } catch (error: any) {
      console.error("Withdraw failed:", error);
      setError(error.message || "Withdraw failed");
    } finally {
      setIsPending(false);
    }
  };

  const handleClaimRewards = async () => {
    if (!isConnected || !address) return;
    try {
      setError(null);
      setIsPending(true);
      await claimRewards();
    } catch (error: any) {
      console.error("Claim rewards failed:", error);
      setError(error.message || "Claim rewards failed");
    } finally {
      setIsPending(false);
    }
  };

  const handleMaxDeposit = () => {
    if (tokenBalance?.[0]?.result) {
      setDepositAmount(formatAmount(tokenBalance[0].result));
    }
  };

  const handleMaxWithdraw = () => {
    if (poolData?.[1]?.result) {
      setWithdrawAmount(formatAmount(poolData[1].result));
    }
  };

  const { collateral: baseAPR, steam: boostAPR } = formatAPRBreakdown(
    aprData?.[0]?.result
      ? {
          collateralTokenAPR: aprData[0].result[0],
          steamTokenAPR: aprData[0].result[1],
        }
      : undefined
  );

  if (!pool) {
    return (
      <div className="min-h-screen text-[#F5F5F5] max-w-[1300px] mx-auto font-sans relative">
        <Navigation />
        <main className="container mx-auto px-6 pt-32 pb-20 relative z-10">
          <div className="text-center">
            <h1 className={`text-4xl text-white `}>Pool Not Found</h1>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#F5F5F5] max-w-[1300px] mx-auto font-sans relative">
      <Navigation />
      <main className="container mx-auto px-6 pt-32 pb-20 relative z-10">
        <div className="text-center mb-12">
          <Link
            href="/earn"
            className="inline-flex items-center gap-2 text-white hover:text-white/80 transition-colors mb-4"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Earn
          </Link>
          <h1 className={`text-4xl text-white font-bold`}>{pool.name}</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Image
              src={pool.chainIcon}
              alt={pool.chain}
              width={20}
              height={20}
              className="rounded-full"
            />
            <p className="text-[#F5F5F5]/60 text-sm">{pool.chain}</p>
          </div>
        </div>
        {/* Pool Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="text-center">
            <p className="text-[#F5F5F5]/50 text-sm mb-2">Total Value Locked</p>
            <p className="text-2xl font-bold text-white">
              ${formatAmount(poolData?.[0]?.result)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[#F5F5F5]/50 text-sm mb-2">Your Deposit</p>
            <p className="text-2xl font-bold text-white">
              {formatAmount(poolData?.[1]?.result)} {tokenSymbol}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[#F5F5F5]/50 text-sm mb-2">APR</p>
            <p className="text-2xl font-bold text-white">
              {baseAPR} + {boostAPR}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[#F5F5F5]/50 text-sm mb-2">Boost Ratio</p>
            <p className="text-2xl font-bold text-white">
              {formatRatio(poolData?.[2]?.result)}
            </p>
          </div>
        </div>
        {/* Action Tabs */}
        <ActionTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          depositAmount={depositAmount}
          setDepositAmount={setDepositAmount}
          withdrawAmount={withdrawAmount}
          setWithdrawAmount={setWithdrawAmount}
          tokenBalance={tokenBalance}
          poolData={poolData}
          rewardsData={rewardsData}
          tokenSymbol={tokenSymbol || ""}
          error={error}
          isConnected={isConnected}
          isDepositLoading={isDepositLoading}
          isApproveLoading={isApproveLoading}
          isWithdrawLoading={isWithdrawLoading}
          isClaimLoading={isClaimLoading}
          handleDeposit={handleDeposit}
          handleWithdraw={handleWithdraw}
          handleClaimRewards={handleClaimRewards}
          handleMaxDeposit={handleMaxDeposit}
          handleMaxWithdraw={handleMaxWithdraw}
          formatAmount={formatAmount}
          formatRatio={formatRatio}
        />
      </main>
    </div>
  );
}
