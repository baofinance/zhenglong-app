"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  useAccount,
  useContractReads,
  useWriteContract,
  usePublicClient,
} from "wagmi";
import { formatEther, parseEther } from "viem";
import { markets, type Market } from "../../../config/markets";
import { GENESIS_ABI, ERC20_ABI } from "../../../config/contracts";

type PageProps = {
  params: { id: string };
};

const erc20SymbolABI = [
  {
    inputs: [],
    name: "symbol",
    outputs: [{ type: "string", name: "" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const chainlinkOracleABI = [
  {
    inputs: [],
    name: "decimals",
    outputs: [{ type: "uint8", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "latestAnswer",
    outputs: [{ type: "int256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export default function GenesisMarketPage({ params }: PageProps) {
  const { id } = params;
  const market = (markets as Record<string, Market>)[id] as Market | undefined;
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  // Removed deposit/withdraw modals; keep only claim action
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimTx, setClaimTx] = useState<string | null>(null);

  // Inline actions state
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isApproveLoading, setIsApproveLoading] = useState(false);
  const [isDepositLoading, setIsDepositLoading] = useState(false);
  const [isWithdrawLoading, setIsWithdrawLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const genesisAddress = market?.addresses?.genesis as
    | `0x${string}`
    | undefined;

  const { data: reads } = useContractReads({
    contracts: genesisAddress
      ? [
          {
            address: genesisAddress,
            abi: GENESIS_ABI,
            functionName: "genesisIsEnded",
          },
          {
            address: genesisAddress,
            abi: GENESIS_ABI,
            functionName: "totalDeposits",
          },
          {
            address: genesisAddress,
            abi: GENESIS_ABI,
            functionName: "balanceOf",
            args: address ? [address as `0x${string}`] : undefined,
          },
          {
            address: genesisAddress,
            abi: GENESIS_ABI,
            functionName: "collateralToken",
          },
          ...(address
            ? [
                {
                  address: genesisAddress,
                  abi: GENESIS_ABI,
                  functionName: "claimable",
                  args: [address as `0x${string}`],
                },
              ]
            : []),
        ]
      : [],
    query: { enabled: !!genesisAddress },
  });

  const isEnded = (reads?.[0]?.result as boolean) ?? false;
  const totalDeposits = (reads?.[1]?.result as bigint | undefined) ?? 0n;
  const userDeposit = (reads?.[2]?.result as bigint | undefined) ?? 0n;
  const collateralAddress = reads?.[3]?.result as `0x${string}` | undefined;
  const userClaimable = (reads?.[4]?.result as
    | [bigint, bigint]
    | undefined) ?? [0n, 0n];
  const userClaimableSum =
    (userClaimable?.[0] || 0n) + (userClaimable?.[1] || 0n);

  // Collateral symbol, wallet balance, and allowance
  const { data: tokenSymbolRead } = useContractReads({
    contracts: collateralAddress
      ? [
          {
            address: collateralAddress,
            abi: erc20SymbolABI,
            functionName: "symbol",
          },
        ]
      : [],
    query: { enabled: !!collateralAddress },
  });
  const collateralSymbol =
    (tokenSymbolRead?.[0]?.result as string | undefined) ?? "";

  const { data: assetReads } = useContractReads({
    contracts:
      collateralAddress && address && genesisAddress
        ? [
            {
              address: collateralAddress,
              abi: ERC20_ABI,
              functionName: "balanceOf",
              args: [address],
            },
            {
              address: collateralAddress,
              abi: ERC20_ABI,
              functionName: "allowance",
              args: [address, genesisAddress],
            },
          ]
        : [],
    query: { enabled: !!collateralAddress && !!address && !!genesisAddress },
  });
  const walletBalance = (assetReads?.[0]?.result as bigint | undefined) ?? 0n;
  const allowance = (assetReads?.[1]?.result as bigint | undefined) ?? 0n;

  // Minimal ROI calculation (FDV $25m), with preview from depositAmount
  const oracleAddress = market?.addresses?.priceOracle as
    | `0x${string}`
    | undefined;
  const { data: oracleReads } = useContractReads({
    contracts: oracleAddress
      ? [
          {
            address: oracleAddress,
            abi: chainlinkOracleABI,
            functionName: "decimals",
          },
          {
            address: oracleAddress,
            abi: chainlinkOracleABI,
            functionName: "latestAnswer",
          },
        ]
      : [],
    query: { enabled: !!oracleAddress },
  });
  const priceDecimals = Number(
    (oracleReads?.[0]?.result as unknown as number) ?? 0
  );
  const priceRaw = oracleReads?.[1]?.result as unknown as bigint | undefined;
  const stEthPriceUSD = priceRaw
    ? Number(priceRaw) / 10 ** priceDecimals
    : undefined;

  const rewardPoolTokens = Number(market?.rewardToken?.amount || 0);
  const parsedDeposit = (() => {
    if (!depositAmount) return 0n;
    try {
      return parseEther(depositAmount);
    } catch {
      return 0n;
    }
  })();
  const totalDepositsPreview = totalDeposits + parsedDeposit;
  const userDepositPreview = userDeposit + parsedDeposit;
  const totalDepositsStEth = Number(totalDepositsPreview) / 1e18;
  const userDepositStEth = Number(userDepositPreview) / 1e18;
  const FDV_USD = 25_000_000;
  const MAX_SUPPLY = 100_000_000;
  let roiPercent: number | undefined = undefined;
  if (
    totalDepositsStEth > 0 &&
    userDepositStEth > 0 &&
    stEthPriceUSD &&
    stEthPriceUSD > 0
  ) {
    roiPercent =
      ((rewardPoolTokens *
        (userDepositStEth / totalDepositsStEth) *
        (FDV_USD / MAX_SUPPLY)) /
        (userDepositStEth * stEthPriceUSD)) *
      100;
  }

  const isLoadingCore = !reads && !!genesisAddress;

  // Handlers
  const handleMaxDeposit = () => {
    setDepositAmount(walletBalance ? formatEther(walletBalance) : "");
  };
  const handleMaxWithdraw = () => {
    setWithdrawAmount(formatEther(userDeposit));
  };

  const handleDeposit = async () => {
    setActionError(null);
    if (!address || !genesisAddress || !collateralAddress || !depositAmount)
      return;
    let amount: bigint;
    try {
      amount = parseEther(depositAmount);
    } catch {
      setActionError("Invalid amount");
      return;
    }
    try {
      if (amount <= 0n) {
        setActionError("Amount must be greater than 0");
        return;
      }
      if (walletBalance < amount) {
        setActionError("Insufficient balance");
        return;
      }
      if (allowance < amount) {
        setIsApproveLoading(true);
        await writeContractAsync({
          address: collateralAddress,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [genesisAddress, amount],
        });
        setIsApproveLoading(false);
      }
      setIsDepositLoading(true);
      await writeContractAsync({
        address: genesisAddress,
        abi: GENESIS_ABI,
        functionName: "deposit",
        args: [amount, address],
      });
      setDepositAmount("");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Deposit failed");
    } finally {
      setIsDepositLoading(false);
      setIsApproveLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setActionError(null);
    if (!address || !genesisAddress || !withdrawAmount) return;
    let amount: bigint;
    try {
      amount = parseEther(withdrawAmount);
    } catch {
      setActionError("Invalid amount");
      return;
    }
    try {
      if (amount <= 0n) {
        setActionError("Amount must be greater than 0");
        return;
      }
      if (userDeposit < amount) {
        setActionError("Amount exceeds your deposit");
        return;
      }
      setIsWithdrawLoading(true);
      await writeContractAsync({
        address: genesisAddress,
        abi: GENESIS_ABI,
        functionName: "withdraw",
        args: [amount, address],
      });
      setWithdrawAmount("");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Withdraw failed");
    } finally {
      setIsWithdrawLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!genesisAddress || !address) return;
    try {
      setClaimError(null);
      setIsClaiming(true);
      setClaimTx(null);
      const tx = await writeContractAsync({
        address: genesisAddress as `0x${string}`,
        abi: GENESIS_ABI,
        functionName: "claim",
        args: [address as `0x${string}`],
      });
      setClaimTx(tx);
      await publicClient?.waitForTransactionReceipt({ hash: tx });
    } catch (e) {
      setClaimError(e instanceof Error ? e.message : "Claim failed");
    } finally {
      setIsClaiming(false);
    }
  };

  // If market id is invalid, show not found after hooks have been called
  if (!market) {
    return (
      <div className="min-h-screen text-[#F5F5F5] max-w-[1300px] mx-auto font-sans relative">
        <main className="container mx-auto px-4 sm:px-10 pb-6">
          <div className="outline outline-1 outline-white/10 rounded-sm p-6 text-center">
            <h1 className="text-lg font-semibold text-white">
              Market not found
            </h1>
            <p className="mt-2 text-white/60">
              The requested Genesis market does not exist.
            </p>
            <div className="mt-4">
              <Link href="/genesis" className="text-harbor hover:opacity-80">
                ← Back to Genesis
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const rewardTokenSymbol = market.rewardToken?.symbol || "";

  const statusColor = isEnded
    ? "bg-orange-900/30 text-orange-400 border-orange-500/30"
    : "bg-harbor/10 text-harbor border-harbor/30";
  const statusLabel = isEnded ? "ENDED" : "ACTIVE";

  return (
    <div className="min-h-screen text-[#F5F5F5] max-w-[1300px] mx-auto font-sans relative px-4 sm:px-10">
      <main className="container mx-auto max-w-full pb-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold font-mono text-white">
              {market?.name}
            </h1>
            <p className="text-xs text-white/60">
              {market?.chain?.name ?? ""} • Genesis
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 border text-[10px] uppercase ${statusColor}`}
            >
              {statusLabel}
            </span>
            <Link
              href="/genesis"
              className="text-sm text-harbor hover:opacity-80"
            >
              ← Back
            </Link>
          </div>
        </div>

        {/* Stat Cards + ROI */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
          <div className="outline outline-1 outline-white/10 rounded-sm p-3">
            <div className="text-xs text-white/60 mb-1">Total Deposits</div>
            <div className="text-white font-mono text-lg">
              {isLoadingCore
                ? "–"
                : `${formatEther(totalDeposits)} ${collateralSymbol}`}
            </div>
          </div>
          <div className="outline outline-1 outline-white/10 rounded-sm p-3">
            <div className="text-xs text-white/60 mb-1">Your Deposit</div>
            <div className="text-white font-mono text-lg">
              {isLoadingCore
                ? "–"
                : `${formatEther(userDeposit)} ${collateralSymbol}`}
            </div>
          </div>
          <div className="outline outline-1 outline-white/10 rounded-sm p-3">
            <div className="text-xs text-white/60 mb-1">Claimable</div>
            <div className="text-white font-mono text-lg">
              {isLoadingCore
                ? "–"
                : `${formatEther(userClaimableSum)} ${rewardTokenSymbol}`}
            </div>
          </div>
          <div className="outline outline-1 outline-white/10 rounded-sm p-3">
            <div className="text-xs text-white/60 mb-1">Estimated ROI</div>
            <div className="text-white font-mono text-lg">
              {roiPercent !== undefined && Number.isFinite(roiPercent)
                ? `${roiPercent.toFixed(0)}%`
                : "-"}
            </div>
            <div className="text-[10px] text-white/40 mt-0.5">
              Assumes FDV $25m
            </div>
          </div>
        </div>

        {/* Inline Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {/* Deposit */}
          <div className="outline outline-1 outline-white/10 rounded-sm p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold font-mono text-white">Deposit</h3>
              <div className="text-xs text-white/60">
                Wallet: {formatEther(walletBalance)} {collateralSymbol}
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input
                value={depositAmount}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "" || /^\d*\.?\d*$/.test(v)) setDepositAmount(v);
                }}
                placeholder="0.0"
                className="flex-1 bg-white/5 text-white text-sm px-3 py-2 outline outline-1 outline-white/10 focus:outline-white/20"
              />
              <button
                onClick={handleMaxDeposit}
                className="px-2 py-1 text-xs outline outline-1 outline-white/20 text-white/80 hover:outline-white/40"
              >
                MAX
              </button>
            </div>
            {actionError && (
              <p className="text-sm text-rose-400 mb-2">{actionError}</p>
            )}
            <button
              onClick={handleDeposit}
              disabled={
                isEnded ||
                !depositAmount ||
                isApproveLoading ||
                isDepositLoading
              }
              className="w-full py-2 text-sm bg-harbor text-white disabled:opacity-50"
            >
              {isApproveLoading
                ? "Approving..."
                : isDepositLoading
                ? "Depositing..."
                : allowance < parsedDeposit
                ? "Approve & Deposit"
                : "Deposit"}
            </button>
          </div>

          {/* Withdraw */}
          <div className="outline outline-1 outline-white/10 rounded-sm p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold font-mono text-white">Withdraw</h3>
              <div className="text-xs text-white/60">
                Your: {formatEther(userDeposit)} {collateralSymbol}
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input
                value={withdrawAmount}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "" || /^\d*\.?\d*$/.test(v)) setWithdrawAmount(v);
                }}
                placeholder="0.0"
                className="flex-1 bg-white/5 text-white text-sm px-3 py-2 outline outline-1 outline-white/10 focus:outline-white/20"
              />
              <button
                onClick={handleMaxWithdraw}
                className="px-2 py-1 text-xs outline outline-1 outline-white/20 text-white/80 hover:outline-white/40"
              >
                MAX
              </button>
            </div>
            {actionError && (
              <p className="text-sm text-rose-400 mb-2">{actionError}</p>
            )}
            <button
              onClick={handleWithdraw}
              disabled={!withdrawAmount || isWithdrawLoading}
              className="w-full py-2 text-sm bg-white/5 text-white border border-white/10 disabled:opacity-50"
            >
              {isWithdrawLoading ? "Withdrawing..." : "Withdraw"}
            </button>
          </div>
        </div>

        {/* Claim */}
        <div className="outline outline-1 outline-white/10 rounded-sm p-3 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-white/60">Claimable</div>
              <div className="text-white font-mono">
                {formatEther(userClaimableSum)} {rewardTokenSymbol}
              </div>
            </div>
            <button
              onClick={handleClaim}
              disabled={isClaiming || userClaimableSum === 0n}
              className="px-3 py-1.5 text-sm bg-harbor text-white disabled:opacity-50"
            >
              {isClaiming ? "Claiming..." : "Claim"}
            </button>
          </div>
          {claimError && (
            <p className="mt-2 text-sm text-rose-400">{claimError}</p>
          )}
          {claimTx && (
            <p className="mt-2 text-xs text-white/50">
              Tx:{" "}
              <a
                href={`https://etherscan.io/tx/${claimTx}`}
                target="_blank"
                rel="noreferrer"
                className="text-harbor underline"
              >
                {claimTx.slice(0, 10)}...{claimTx.slice(-8)}
              </a>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
