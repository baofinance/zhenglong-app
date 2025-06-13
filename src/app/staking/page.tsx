"use client";

import { useState, useEffect } from "react";
import { Geo } from "next/font/google";
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from "wagmi";
import { parseEther, formatEther } from "viem";
import { toast } from "react-hot-toast";
import ConnectButton from "@/components/ConnectButton";
import Navigation from "@/components/Navigation";
import { votingEscrowABI } from "@/abis/votingEscrowABI";
import { erc20ABI } from "@/abis/erc20ABI";

const geo = Geo({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

interface StakingInfo {
  totalStaked: bigint;
  userStaked: bigint;
  userLockEnd: bigint;
  userBalance: bigint;
  userAllowance: bigint;
}

interface StakingState {
  amount: string;
  lockDuration: number; // in weeks
  activeTab: "stake" | "increase" | "extend" | "withdraw";
}

export default function Staking() {
  const { address, isConnected } = useAccount();
  const [stakingState, setStakingState] = useState<StakingState>({
    amount: "",
    lockDuration: 1,
    activeTab: "stake",
  });
  const [stakingInfo, setStakingInfo] = useState<StakingInfo>({
    totalStaked: BigInt(0),
    userStaked: BigInt(0),
    userLockEnd: BigInt(0),
    userBalance: BigInt(0),
    userAllowance: BigInt(0),
  });

  // Contract reads
  const { data: totalStaked, isLoading: isLoadingTotalStaked } = useContractRead({
    address: "0xVotingEscrowAddress" as `0x${string}`,
    abi: votingEscrowABI,
    functionName: "totalSupply",
  });

  const { data: userStaked, isLoading: isLoadingUserStaked } = useContractRead({
    address: "0xVotingEscrowAddress" as `0x${string}`,
    abi: votingEscrowABI,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    enabled: !!address,
  });

  const { data: userLockEnd, isLoading: isLoadingLockEnd } = useContractRead({
    address: "0xVotingEscrowAddress" as `0x${string}`,
    abi: votingEscrowABI,
    functionName: "locked__end",
    args: [address as `0x${string}`],
    enabled: !!address,
  });

  const { data: userBalance, isLoading: isLoadingBalance } = useContractRead({
    address: "0xTokenAddress" as `0x${string}`,
    abi: erc20ABI,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    enabled: !!address,
  });

  const { data: userAllowance, isLoading: isLoadingAllowance } = useContractRead({
    address: "0xTokenAddress" as `0x${string}`,
    abi: erc20ABI,
    functionName: "allowance",
    args: [address as `0x${string}`, "0xVotingEscrowAddress" as `0x${string}`],
    enabled: !!address,
  });

  // Contract writes
  const { write: approve, data: approveData } = useContractWrite({
    address: "0xTokenAddress" as `0x${string}`,
    abi: erc20ABI,
    functionName: "approve",
  });

  const { write: createLock, data: createLockData } = useContractWrite({
    address: "0xVotingEscrowAddress" as `0x${string}`,
    abi: votingEscrowABI,
    functionName: "create_lock",
  });

  const { write: increaseAmount, data: increaseAmountData } = useContractWrite({
    address: "0xVotingEscrowAddress" as `0x${string}`,
    abi: votingEscrowABI,
    functionName: "increase_amount",
  });

  const { write: increaseLockTime, data: increaseLockTimeData } = useContractWrite({
    address: "0xVotingEscrowAddress" as `0x${string}`,
    abi: votingEscrowABI,
    functionName: "increase_unlock_time",
  });

  const { write: withdraw, data: withdrawData } = useContractWrite({
    address: "0xVotingEscrowAddress" as `0x${string}`,
    abi: votingEscrowABI,
    functionName: "withdraw",
  });

  // Transaction status
  const { isLoading: isApproving } = useWaitForTransaction({
    hash: approveData?.hash,
  });

  const { isLoading: isStaking } = useWaitForTransaction({
    hash: createLockData?.hash,
  });

  const { isLoading: isIncreasing } = useWaitForTransaction({
    hash: increaseAmountData?.hash,
  });

  const { isLoading: isExtending } = useWaitForTransaction({
    hash: increaseLockTimeData?.hash,
  });

  const { isLoading: isWithdrawing } = useWaitForTransaction({
    hash: withdrawData?.hash,
  });

  // Update staking info
  useEffect(() => {
    if (totalStaked && userStaked && userLockEnd && userBalance && userAllowance) {
      setStakingInfo({
        totalStaked: totalStaked as bigint,
        userStaked: userStaked as bigint,
        userLockEnd: userLockEnd as bigint,
        userBalance: userBalance as bigint,
        userAllowance: userAllowance as bigint,
      });
    }
  }, [totalStaked, userStaked, userLockEnd, userBalance, userAllowance]);

  // Handle stake
  const handleStake = async () => {
    if (!isConnected || !stakingState.amount || !address) return;

    try {
      const parsedAmount = parseEther(stakingState.amount);
      const unlockTime = Math.floor(Date.now() / 1000) + stakingState.lockDuration * 7 * 24 * 60 * 60;

      // Check if approval is needed
      if (parsedAmount > stakingInfo.userAllowance) {
        await approve({
          args: ["0xVotingEscrowAddress" as `0x${string}`, parsedAmount],
        });
        toast.success("Approval successful!");
      }

      // Create lock
      await createLock({
        args: [parsedAmount, BigInt(unlockTime)],
      });
      toast.success("Staking successful!");
      setStakingState((prev) => ({ ...prev, amount: "" }));
    } catch (error) {
      toast.error("Failed to stake. Please try again.");
      console.error("Stake error:", error);
    }
  };

  // Handle increase amount
  const handleIncreaseAmount = async () => {
    if (!isConnected || !stakingState.amount || !address) return;

    try {
      const parsedAmount = parseEther(stakingState.amount);

      // Check if approval is needed
      if (parsedAmount > stakingInfo.userAllowance) {
        await approve({
          args: ["0xVotingEscrowAddress" as `0x${string}`, parsedAmount],
        });
        toast.success("Approval successful!");
      }

      await increaseAmount({
        args: [parsedAmount],
      });
      toast.success("Stake increased successfully!");
      setStakingState((prev) => ({ ...prev, amount: "" }));
    } catch (error) {
      toast.error("Failed to increase stake. Please try again.");
      console.error("Increase stake error:", error);
    }
  };

  // Handle extend lock
  const handleExtendLock = async () => {
    if (!isConnected || !address) return;

    try {
      const unlockTime = Math.floor(Date.now() / 1000) + stakingState.lockDuration * 7 * 24 * 60 * 60;

      await increaseLockTime({
        args: [BigInt(unlockTime)],
      });
      toast.success("Lock extended successfully!");
    } catch (error) {
      toast.error("Failed to extend lock. Please try again.");
      console.error("Extend lock error:", error);
    }
  };

  // Handle withdraw
  const handleWithdraw = async () => {
    if (!isConnected || !address) return;

    try {
      await withdraw();
      toast.success("Withdrawal successful!");
    } catch (error) {
      toast.error("Failed to withdraw. Please try again.");
      console.error("Withdraw error:", error);
    }
  };

  // Calculate boost multiplier based on lock duration
  const calculateBoost = (weeks: number) => {
    const baseBoost = 1;
    const maxBoost = 2.5;
    const maxWeeks = 208; // 4 years
    return baseBoost + ((maxBoost - baseBoost) * weeks) / maxWeeks;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A1A1A] to-black text-[#F5F5F5] font-sans relative">
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

      <main className="container mx-auto px-6 pt-28 pb-20 relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className={`text-4xl text-[#4A7C59] ${geo.className}`}>
            STAKE STEAM
          </h1>
          <p className="text-[#F5F5F5]/60 text-sm mt-2 max-w-xl mx-auto">
            Lock your STEAM tokens to earn voting power and protocol rewards
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Stats Overview */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-[#0A0A0A] p-6 shadow-custom-dark">
              <p className="text-[#F5F5F5]/60 text-sm mb-2">Total Value Locked</p>
              <p className="text-[#4A7C59] text-2xl font-medium">
                {isLoadingTotalStaked
                  ? "Loading..."
                  : `${formatEther(stakingInfo.totalStaked)} STEAM`}
              </p>
            </div>
            <div className="bg-[#0A0A0A] p-6 shadow-custom-dark">
              <p className="text-[#F5F5F5]/60 text-sm mb-2">Your Stake</p>
              <p className="text-[#4A7C59] text-2xl font-medium">
                {isLoadingUserStaked
                  ? "Loading..."
                  : `${formatEther(stakingInfo.userStaked)} STEAM`}
              </p>
            </div>
            <div className="bg-[#0A0A0A] p-6 shadow-custom-dark">
              <p className="text-[#F5F5F5]/60 text-sm mb-2">Your Balance</p>
              <p className="text-[#4A7C59] text-2xl font-medium">
                {isLoadingBalance
                  ? "Loading..."
                  : `${formatEther(stakingInfo.userBalance)} STEAM`}
              </p>
            </div>
          </div>

          {/* Staking Interface */}
          <div className="bg-[#0A0A0A] p-8 shadow-custom-dark">
            {/* Action Tabs */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {(["stake", "increase", "extend", "withdraw"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStakingState((prev) => ({ ...prev, activeTab: tab }))}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    stakingState.activeTab === tab
                      ? "bg-[#4A7C59] text-white"
                      : "bg-[#1A1A1A] text-[#F5F5F5]/60 hover:bg-[#2A2A2A]"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Input Section */}
            {stakingState.activeTab !== "withdraw" && (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <p className="text-[#F5F5F5]/60">Amount</p>
                    <p className="text-[#F5F5F5]/60">
                      Balance: {isLoadingBalance ? "Loading..." : `${formatEther(stakingInfo.userBalance)} STEAM`}
                    </p>
                  </div>
                  <input
                    type="text"
                    value={stakingState.amount}
                    onChange={(e) => setStakingState((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="Enter amount in STEAM"
                    className="w-full bg-[#1A1A1A] border border-[#4A7C59]/20 focus:border-[#4A7C59] outline-none transition-all p-4 text-[#F5F5F5] placeholder-[#F5F5F5]/30"
                  />
                </div>

                {stakingState.activeTab !== "increase" && (
                  <div>
                    <div className="flex justify-between mb-2">
                      <p className="text-[#F5F5F5]/60">Lock Duration</p>
                      <p className="text-[#4A7C59]">
                        Boost: {calculateBoost(stakingState.lockDuration).toFixed(2)}x
                      </p>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="208"
                      value={stakingState.lockDuration}
                      onChange={(e) => setStakingState((prev) => ({ ...prev, lockDuration: Number(e.target.value) }))}
                      className="w-full h-2 bg-[#1A1A1A] border border-[#4A7C59]/20 focus:border-[#4A7C59] outline-none transition-all"
                    />
                    <div className="flex justify-between mt-2">
                      <span className="text-[#F5F5F5]/60 text-sm">1 week</span>
                      <span className="text-[#F5F5F5]/60 text-sm">4 years</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Button */}
            <div className="mt-8">
              <button
                onClick={
                  stakingState.activeTab === "stake"
                    ? handleStake
                    : stakingState.activeTab === "increase"
                    ? handleIncreaseAmount
                    : stakingState.activeTab === "extend"
                    ? handleExtendLock
                    : handleWithdraw
                }
                disabled={
                  isApproving ||
                  isStaking ||
                  isIncreasing ||
                  isExtending ||
                  isWithdrawing ||
                  (stakingState.activeTab !== "withdraw" && !stakingState.amount)
                }
                className={`w-full px-6 py-3 text-sm font-medium transition-colors ${
                  isApproving ||
                  isStaking ||
                  isIncreasing ||
                  isExtending ||
                  isWithdrawing ||
                  (stakingState.activeTab !== "withdraw" && !stakingState.amount)
                    ? "bg-[#1F3529] text-[#4A7C59] cursor-not-allowed"
                    : "bg-[#4A7C59] text-white hover:bg-[#3A6147]"
                }`}
              >
                {isApproving
                  ? "Approving..."
                  : isStaking
                  ? "Staking..."
                  : isIncreasing
                  ? "Increasing..."
                  : isExtending
                  ? "Extending..."
                  : isWithdrawing
                  ? "Withdrawing..."
                  : stakingState.activeTab.charAt(0).toUpperCase() + stakingState.activeTab.slice(1)}
              </button>
            </div>

            {!isConnected ? (
              <div className="flex justify-center mt-8">
                <ConnectButton />
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
