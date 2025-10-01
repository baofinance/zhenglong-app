"use client";

import React, { useState } from "react";
import { parseEther, formatEther } from "viem";
import {
  useAccount,
  useContractRead,
  useWriteContract,
  usePublicClient,
} from "wagmi";
import { anvil } from "wagmi/chains";
import { Geo } from "next/font/google";
import { BaseError, ContractFunctionRevertedError } from "viem";
import { GENESIS_ABI, ERC20_ABI } from "../config/contracts";

const geo = Geo({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

interface GenesisDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  genesisAddress: string;
  collateralAddress: string;
  collateralSymbol: string;
  onSuccess?: () => void;
}

type ModalStep = "input" | "approving" | "depositing" | "success" | "error";

export const GenesisDepositModal = ({
  isOpen,
  onClose,
  genesisAddress,
  collateralAddress,
  collateralSymbol,
  onSuccess,
}: GenesisDepositModalProps) => {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<ModalStep>("input");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const publicClient = usePublicClient();

  // Contract read hooks
  const { data: balanceData } = useContractRead({
    address: collateralAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && isOpen, refetchInterval: 5000 },
  });

  const { data: allowanceData, refetch: refetchAllowance } = useContractRead({
    address: collateralAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, genesisAddress as `0x${string}`] : undefined,
    query: { enabled: !!address && isOpen, refetchInterval: 5000 },
  });

  // Check if genesis has ended
  const { data: genesisEnded } = useContractRead({
    address: genesisAddress as `0x${string}`,
    abi: GENESIS_ABI,
    functionName: "genesisIsEnded",
    query: { enabled: !!genesisAddress && isOpen },
  });

  // Get current user deposit in Genesis
  const { data: currentDeposit } = useContractRead({
    address: genesisAddress as `0x${string}`,
    abi: GENESIS_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!genesisAddress && isOpen,
      refetchInterval: 5000,
    },
  });

  // Contract write hooks
  const { writeContractAsync } = useWriteContract();

  const balance = balanceData || 0n;
  const allowance = allowanceData || 0n;
  const amountBigInt = amount ? parseEther(amount) : 0n;
  const needsApproval = amountBigInt > 0 && amountBigInt > allowance;
  const userCurrentDeposit = currentDeposit || 0n;
  const newTotalDeposit = userCurrentDeposit + amountBigInt;

  const handleClose = () => {
    if (step === "approving" || step === "depositing") return; // Prevent closing during transactions
    setAmount("");
    setStep("input");
    setError(null);
    setTxHash(null);
    onClose();
  };

  const handleMaxClick = () => {
    if (balance) {
      setAmount(formatEther(balance));
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };

  const validateAmount = (): boolean => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return false;
    }
    if (amountBigInt > balance) {
      setError("Insufficient balance");
      return false;
    }
    if (genesisEnded) {
      setError("Genesis period has ended");
      return false;
    }
    return true;
  };

  const handleDeposit = async () => {
    if (!validateAmount()) return;
    try {
      if (needsApproval) {
        setStep("approving");
        setError(null);
        setTxHash(null);
        const approveHash = await writeContractAsync({
          address: collateralAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [genesisAddress as `0x${string}`, amountBigInt],
          // chainId intentionally omitted to let wallet infer the network
        });
        setTxHash(approveHash);
        await publicClient?.waitForTransactionReceipt({ hash: approveHash });
        await refetchAllowance();

        // Give a moment for the blockchain state to update
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Force another refetch to ensure we have the latest allowance
        await refetchAllowance();
      }

      setStep("depositing");
      setError(null);
      setTxHash(null);
      const depositHash = await writeContractAsync({
        address: genesisAddress as `0x${string}`,
        abi: GENESIS_ABI,
        functionName: "deposit",
        args: [amountBigInt, address as `0x${string}`],
        // chainId intentionally omitted
      });
      setTxHash(depositHash);
      await publicClient?.waitForTransactionReceipt({ hash: depositHash });

      setStep("success");
      if (onSuccess) {
        await onSuccess();
      }
    } catch (err) {
      console.error("Full transaction error object:", err);
      let errorMessage = "Transaction failed";

      if (err instanceof BaseError) {
        const revertError = err.walk(
          (err) => err instanceof ContractFunctionRevertedError
        );
        if (revertError instanceof ContractFunctionRevertedError) {
          const errorName = revertError.data?.errorName;
          switch (errorName) {
            case "GenesisAlreadyEnded":
              errorMessage = "Genesis period has already ended";
              break;
            case "GenesisNotActive":
              errorMessage = "Genesis is not currently active";
              break;
            case "ZeroAmount":
              errorMessage = "Amount cannot be zero";
              break;
            case "InvalidAmount":
              errorMessage = "Invalid amount specified";
              break;
            case "InsufficientBalance":
              errorMessage = "Insufficient token balance";
              break;
            case "TransferFailed":
              errorMessage = "Token transfer failed";
              break;
            case "Unauthorized":
              errorMessage = "Unauthorized operation";
              break;
            default:
              errorMessage = `Contract error: ${errorName || "Unknown error"}`;
          }
        } else {
          errorMessage = err.shortMessage || err.message;
        }
      } else if (err && typeof err === "object" && "message" in err) {
        errorMessage = (err as { message: string }).message;
      } else {
        errorMessage = "Unknown error occurred";
      }

      setError(errorMessage);
      setStep("error");
    }
  };

  const getButtonText = () => {
    switch (step) {
      case "approving":
        return "Approving...";
      case "depositing":
        return "Depositing...";
      case "success":
        return "Deposit";
      case "error":
        return "Try Again";
      default:
        return needsApproval ? "Approve & Deposit" : "Deposit";
    }
  };

  const handleMainButtonClick = () => {
    if (step === "error") {
      setStep("input");
      setError(null);
    } else if (step === "success") {
      // Reset to input step for a new deposit
      setStep("input");
      setAmount("");
      setError(null);
      setTxHash(null);
    } else {
      handleDeposit();
    }
  };

  const isButtonDisabled = () => {
    if (step === "success") return false; // Always enable the button when successful
    return (
      step === "approving" ||
      step === "depositing" ||
      !amount ||
      parseFloat(amount) <= 0 ||
      genesisEnded
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-zinc-900/50 border border-[#4A7C59]/30 shadow-2xl w-full max-w-md mx-4 animate-in fade-in-0 scale-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#4A7C59]/20">
          <h2 className={`text-xl font-medium text-[#F5F5F5] ${geo.className}`}>
            Deposit to Genesis
          </h2>
          <button
            onClick={handleClose}
            className="text-[#F5F5F5]/50 hover:text-[#F5F5F5] transition-colors"
            disabled={step === "approving" || step === "depositing"}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Genesis Status Warning */}
          {genesisEnded && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 text-red-400 text-sm">
              ⚠️ Genesis period has ended. Deposits are no longer accepted.
            </div>
          )}

          {/* Current Deposit */}
          <div className="text-sm text-[#F5F5F5]/70">
            Current Deposit:{" "}
            <span className="font-medium text-[#F5F5F5]">
              {formatEther(userCurrentDeposit)} {collateralSymbol}
            </span>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            {/* Available Balance - AMM Style */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#F5F5F5]/50">Amount</span>
              <span className="text-[#F5F5F5]/70">
                Balance: {formatEther(balance)} {collateralSymbol}
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.0"
                className={`w-full h-12 px-4 pr-20 bg-[#0D0D0D] text-white border ${
                  error ? "border-red-500" : "border-zinc-700/50"
                } focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/20 focus:outline-none transition-all text-lg font-mono`}
                disabled={
                  step === "approving" || step === "depositing" || genesisEnded
                }
              />
              <button
                onClick={handleMaxClick}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-[#4A7C59] hover:bg-[#3A6147] text-white transition-colors disabled:bg-zinc-600"
                disabled={
                  step === "approving" || step === "depositing" || genesisEnded
                }
              >
                MAX
              </button>
            </div>
            <div className="text-right text-xs text-[#F5F5F5]/50">
              {collateralSymbol}
            </div>
          </div>

          {/* Transaction Preview */}
          {amount && parseFloat(amount) > 0 && (
            <div className="p-3 bg-[#0F0F0F]/90 border border-harbor/20 space-y-2 text-sm">
              <div className="font-medium text-[#F5F5F5]">
                Transaction Preview:
              </div>
              <div className="flex justify-between">
                <span className="text-[#F5F5F5]/70">Current Deposit:</span>
                <span>
                  {formatEther(userCurrentDeposit)} {collateralSymbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#F5F5F5]/70">+ Deposit Amount:</span>
                <span className="text-harbor">
                  +{amount} {collateralSymbol}
                </span>
              </div>
              <div className="border-t border-harbor/30 pt-2">
                <div className="flex justify-between font-medium">
                  <span className="text-[#F5F5F5]">New Total Deposit:</span>
                  <span className="text-harbor">
                    {formatEther(newTotalDeposit)} {collateralSymbol}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Step Indicator */}
          {needsApproval && (step === "approving" || step === "depositing") && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div
                  className={`w-2 h-2-full ${
                    step === "approving"
                      ? "bg-harbor animate-pulse"
                      : "bg-harbor"
                  }`}
                />
                <span
                  className={
                    step === "approving" ? "text-harbor" : "text-[#F5F5F5]/70"
                  }
                >
                  Step 1: Approve {collateralSymbol}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div
                  className={`w-2 h-2-full ${
                    step === "depositing"
                      ? "bg-harbor animate-pulse"
                      : step === "approving"
                      ? "bg-zinc-600"
                      : "bg-harbor"
                  }`}
                />
                <span
                  className={
                    step === "depositing" ? "text-harbor" : "text-[#F5F5F5]/70"
                  }
                >
                  Step 2: Deposit to Genesis
                </span>
              </div>
            </div>
          )}

          {/* Transaction Hash */}
          {txHash && (
            <div className="text-xs text-center text-zinc-400">
              Tx:{" "}
              <a
                href={`https://etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white"
              >
                {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </a>
            </div>
          )}

          {/* Success Message */}
          {step === "success" && (
            <div className="p-3 bg-harbor/10 border border-harbor/30 text-harbor text-sm text-center">
              ✅ Deposit successful!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-harbor/20">
          <button
            onClick={handleClose}
            className={`flex-1 py-2 px-4 text-[#F5F5F5]/70 hover:text-[#F5F5F5] transition-colors ${geo.className}`}
            disabled={step === "approving" || step === "depositing"}
          >
            {step === "success" ? "Close" : "Cancel"}
          </button>
          <button
            onClick={handleMainButtonClick}
            disabled={isButtonDisabled()}
            className={`flex-1 py-2 px-4 font-medium transition-colors ${
              geo.className
            } ${
              step === "success"
                ? "bg-[#4A7C59] hover:bg-[#3A6147] text-white"
                : "bg-[#4A7C59] hover:bg-[#3A6147] text-white disabled:bg-zinc-800 disabled:text-zinc-500"
            }`}
          >
            {getButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
};
