"use client";

import { useState, useMemo } from "react";
import { useAccount, useContractReads, useWriteContract } from "wagmi";
import { parseEther } from "viem";
import { usePools } from "@/hooks/usePools";
import Navigation from "@/components/Navigation";
import { Geo } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import TokenIcon from "@/components/TokenIcon";
import TimeRangeSelector from "@/components/TimeRangeSelector";
import { usePoolData } from "@/hooks/usePoolData";
import { stabilityPoolABI } from "@/abis/stabilityPool";
import { rewardsABI } from "@/abis/rewards";
import { erc20ABI } from "@/abis/erc20";

const RechartsChart = dynamic(() => import("@/components/RechartsChart"), {
  ssr: false,
});

const geo = Geo({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

// Etherscan Link helper
interface EtherscanLinkProps {
  label: string;
  address?: string;
}

function EtherscanLink({ label, address }: EtherscanLinkProps) {
  if (!address) return null;

  const etherscanBaseUrl = "https://etherscan.io/address/";
  return (
    <div className="flex justify-between items-center text-sm py-3 border-b border-white/10 last:border-b-0">
      <span className="text-[#F5F5F5]/70">{label}</span>
      <a
        href={`${etherscanBaseUrl}${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-white hover:underline flex items-center gap-1"
      >
        {`${address.slice(0, 6)}...${address.slice(-4)}`}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3 w-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </a>
    </div>
  );
}

// Contract Info section
function ContractInfoSection({ pool, market }: { pool: any; market: any }) {
  if (!pool || !market) {
    return (
      <div className="lg:col-span-1 bg-[#1A1A1A] p-6">
        <h2 className="text-xl font-bold text-white mb-4">Contract Info</h2>
        <p className="text-sm text-[#F5F5F5]/70">
          Pool information not available.
        </p>
      </div>
    );
  }

  const assetAddress =
    pool.poolType === "collateral"
      ? market.addresses.collateralToken
      : market.addresses.peggedToken;

  return (
    <div className="lg:col-span-1 bg-[#1A1A1A] p-6">
      <h2 className="text-xl font-bold text-white mb-4">Contract Info</h2>
      <div className="space-y-2">
        <EtherscanLink label={pool.name} address={pool.address} />
        <EtherscanLink
          label={`Deposit Token (${pool.tokenSymbol})`}
          address={assetAddress}
        />
        <EtherscanLink
          label={`Collateral (${market.collateralSymbol})`}
          address={market.addresses.collateralToken}
        />
        <EtherscanLink
          label={`Pegged Token (${market.peggedSymbol})`}
          address={market.addresses.peggedToken}
        />
        <EtherscanLink label="Minter" address={market.addresses.minter} />
      </div>
    </div>
  );
}

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
        className="flex-1 bg-grey-darkest text-white p-3 border border-[#4A7C59]/20 focus:border-[#4A7C59] focus:outline-none"
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
      <p className="text-sm text-[#F5F5F5] font-mono">
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
  poolWithData: any;
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
  poolWithData,
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
        value={formatAmount(poolWithData?.userDeposit)}
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
  poolWithData: any;
  error: string | null;
  isConnected: boolean;
  isClaimLoading: boolean;
  handleClaimRewards: () => void;
  formatAmount: (value: bigint | undefined) => string;
}

function RewardsTab({
  poolWithData,
  error,
  isConnected,
  isClaimLoading,
  handleClaimRewards,
  formatAmount,
}: RewardsTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-[#F5F5F5]/50 mb-1">Claimable Rewards</p>
        <p className="text-lg font-medium text-white font-mono">
          {formatAmount(poolWithData?.rewards)} STEAM
        </p>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <ActionButton
        onClick={handleClaimRewards}
        disabled={!isConnected || !poolWithData?.rewards}
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
  poolWithData: any;
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
}

function ActionTabs({
  activeTab,
  setActiveTab,
  depositAmount,
  setDepositAmount,
  withdrawAmount,
  setWithdrawAmount,
  tokenBalance,
  poolWithData,
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
}: ActionTabsProps) {
  return (
    <div className="bg-[#1A1A1A] px-8 py-6">
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
      <div>
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
            poolWithData={poolWithData}
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
            poolWithData={poolWithData}
            error={error}
            isConnected={isConnected}
            isClaimLoading={isClaimLoading}
            handleClaimRewards={handleClaimRewards}
            formatAmount={formatAmount}
          />
        )}
      </div>
    </div>
  );
}

// Chart and Description Component
interface PoolInfoProps {
  pool: any;
  market: any;
  baseAPR: string;
  boostAPR: string;
}

function PoolInfo({ pool, market, baseAPR, boostAPR }: PoolInfoProps) {
  const totalAPR =
    (parseFloat(baseAPR) + parseFloat(boostAPR)).toFixed(2) + "%";

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <ContractInfoSection pool={pool} market={market} />
      <div className="lg:col-span-2 bg-[#1A1A1A] p-6">
        <h2 className="text-xl font-bold text-white mb-4">APR Breakdown</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-[#F5F5F5]/70">Base APR</span>
            <span className="font-mono text-white">{baseAPR}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-[#F5F5F5]/70">STEAM Boost APR</span>
            <span className="font-mono text-white">{boostAPR}</span>
          </div>
          <div className="flex justify-between items-center text-base font-bold border-t border-white/10 pt-3 mt-3">
            <span className="text-white">Total APR</span>
            <span className="font-mono text-white">{totalAPR}</span>
          </div>
        </div>
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
  const { writeContractAsync } = useWriteContract();
  const [activeTab, setActiveTab] = useState<PoolAction>("deposit");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDepositLoading, setIsDepositLoading] = useState(false);
  const [isWithdrawLoading, setIsWithdrawLoading] = useState(false);
  const [isClaimLoading, setIsClaimLoading] = useState(false);
  const [isApproveLoading, setIsApproveLoading] = useState(false);
  const { getPoolsByMarket, getMarketByPool } = usePools();

  const pools = getPoolsByMarket(marketId);
  const pool = pools.find((p) => p.poolType === poolType);

  const { poolData } = usePoolData(pool ? [pool] : []);
  const poolWithData = poolData?.[0];

  const market = getMarketByPool(
    pool?.address ?? "0x0000000000000000000000000000000000000000"
  );

  const assetAddress =
    pool && market
      ? pool.poolType === "collateral"
        ? market.addresses.collateralToken
        : market.addresses.peggedToken
      : undefined;

  const poolAddress = pool?.address;
  const tokenSymbol = pool?.tokenSymbol;
  const poolName = pool?.name;

  // Get token balance
  const { data: tokenBalance } = useContractReads({
    contracts: assetAddress
      ? [
          {
            address: assetAddress as `0x${string}`,
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
      assetAddress && poolAddress
        ? [
            {
              address: assetAddress as `0x${string}`,
              abi: erc20ABI,
              functionName: "allowance",
              args: [address ?? "0x0", poolAddress as `0x${string}`],
            },
          ]
        : [],
  });

  // Format helpers
  const formatAmount = (value: bigint | undefined) => {
    if (!value) return "0.00";
    return (Number(value) / 1e18).toFixed(4);
  };

  const formatAPRBreakdown = (breakdown: {
    collateral: number;
    steam: number;
  }) => {
    if (!breakdown) return { collateral: "0.00%", steam: "0.00%" };
    return {
      collateral: breakdown.collateral.toFixed(2) + "%",
      steam: breakdown.steam.toFixed(2) + "%",
    };
  };

  // Handlers
  const handleDeposit = async () => {
    if (!isConnected || !address || !depositAmount || !poolAddress || !pool)
      return;

    try {
      setError(null);
      const amount = parseEther(depositAmount);

      if (
        assetAddress &&
        (!allowance?.[0]?.result || allowance[0].result < amount)
      ) {
        setIsApproveLoading(true);
        await writeContractAsync({
          address: assetAddress as `0x${string}`,
          abi: erc20ABI,
          functionName: "approve",
          args: [poolAddress as `0x${string}`, amount],
        });
        setIsApproveLoading(false);
      }

      setIsDepositLoading(true);
      await writeContractAsync({
        address: poolAddress as `0x${string}`,
        abi: stabilityPoolABI,
        functionName: "deposit",
        args: [amount, address as `0x${string}`, 0n],
      });
      setDepositAmount("");
    } catch (error: any) {
      console.error("Deposit failed:", error);
      setError(error.message || "Deposit failed");
    } finally {
      setIsDepositLoading(false);
      setIsApproveLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!isConnected || !address || !withdrawAmount || !poolAddress) return;
    try {
      setError(null);
      setIsWithdrawLoading(true);
      const amount = parseEther(withdrawAmount);
      await writeContractAsync({
        address: poolAddress as `0x${string}`,
        abi: stabilityPoolABI,
        functionName: "withdraw",
        args: [amount, address as `0x${string}`, 0n],
      });
      setWithdrawAmount("");
    } catch (error: any) {
      console.error("Withdraw failed:", error);
      setError(error.message || "Withdraw failed");
    } finally {
      setIsWithdrawLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    if (!isConnected || !address || !poolAddress) return;
    try {
      setError(null);
      setIsClaimLoading(true);
      await writeContractAsync({
        address: poolAddress as `0x${string}`,
        abi: rewardsABI,
        functionName: "claimRewards",
      });
    } catch (error: any) {
      console.error("Claim rewards failed:", error);
      setError(error.message || "Claim rewards failed");
    } finally {
      setIsClaimLoading(false);
    }
  };

  const handleMaxDeposit = () => {
    if (tokenBalance?.[0]?.result) {
      setDepositAmount(formatAmount(tokenBalance[0].result));
    }
  };

  const handleMaxWithdraw = () => {
    if (poolWithData?.userDeposit) {
      setWithdrawAmount(formatAmount(poolWithData.userDeposit));
    }
  };

  const { collateral: baseAPR, steam: boostAPR } = formatAPRBreakdown(
    poolWithData?.aprBreakdown
  );

  const tvlUSD = poolWithData?.tvlUSD ?? 0;

  if (!pool) {
    return (
      <div className="min-h-screen text-[#F5F5F5] max-w-[1300px] mx-auto font-sans relative">
        <main className="container mx-auto px-6 pt-32 pb-20 relative z-10">
          <div className="text-center">
            <h1 className={`text-4xl text-white `}>Pool Not Found</h1>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#F5F5F5] max-w-[1500px] mx-auto font-sans relative">
      <main className="container mx-auto px-8 sm:px-10 pt-32 pb-20 relative z-10">
        <div className="mb-4">
          <Link
            href="/earn"
            className="inline-flex items-center gap-2 text-white hover:text-white/80 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              ></path>
            </svg>
            Back to Earn
          </Link>
        </div>
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-6">
            <div className="flex items-center">
              {pool.assetIcons
                .slice()
                .reverse()
                .map((icon: string, index: number) => (
                  <TokenIcon
                    key={index}
                    src={icon}
                    alt="token icon"
                    width={40}
                    height={40}
                    className={`rounded-full border-2 border-black ${
                      index > 0 ? "-ml-4" : ""
                    }`}
                  />
                ))}
            </div>
            <h1 className={`text-4xl text-white font-bold`}>{pool.name}</h1>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 backdrop-blur-sm">
              <Image
                src={pool.chainIcon}
                alt={pool.chain}
                width={20}
                height={20}
                className="rounded-full"
              />
              <p className="text-sm text-[#F5F5F5]/60">{pool.chain}</p>
            </div>
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-[#F5F5F5]/60 backdrop-blur-sm">
              {pool.poolType === "collateral"
                ? "Stability Pool"
                : "Leveraged Pool"}
            </div>
          </div>
        </div>
        {/* Pool Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center">
            <p className="text-[#F5F5F5]/50 text-sm mb-2 uppercase tracking-wider">
              Total Value Locked
            </p>
            <p className="text-2xl font-bold text-white font-mono">
              ${tvlUSD.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[#F5F5F5]/50 text-sm mb-2 uppercase tracking-wider">
              Your Deposit
            </p>
            <p className="text-2xl font-bold text-white font-mono">
              {formatAmount(poolWithData?.userDeposit)} {tokenSymbol}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[#F5F5F5]/50 text-sm mb-2 uppercase tracking-wider">
              APR
            </p>
            <p className="text-2xl font-bold text-white font-mono">
              {baseAPR} + {boostAPR}
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
          poolWithData={poolWithData}
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
        />
        {/* Pool Info Section */}
        <PoolInfo
          pool={pool}
          market={market}
          baseAPR={baseAPR}
          boostAPR={boostAPR}
        />
      </main>
    </div>
  );
}
