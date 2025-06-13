"use client";

import { useState, useEffect } from "react";
import { Geo } from "next/font/google";
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from "wagmi";
import { parseEther, formatEther } from "viem";
import { toast } from "react-hot-toast";
import ConnectButton from "@/components/ConnectButton";
import Navigation from "@/components/Navigation";
import { stakingABI } from "@/abis/stakingABI";

const geo = Geo({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

interface StakingInfo {
  totalStaked: bigint;
  userStaked: bigint;
  userVotingPower: bigint;
  userLockEnd: bigint;
  userRewards: bigint;
  totalRewards: bigint;
  lockDuration: bigint;
}

export default function Stake() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("");
  const [lockDuration, setLockDuration] = useState(1);
  const [stakingInfo, setStakingInfo] = useState<StakingInfo>({
    totalStaked: BigInt(0),
    userStaked: BigInt(0),
    userVotingPower: BigInt(0),
    userLockEnd: BigInt(0),
    userRewards: BigInt(0),
    totalRewards: BigInt(0),
    lockDuration: BigInt(0),
  });

  // Contract reads
  const { data: totalStaked, isLoading: isLoadingTotalStaked } = useContractRead({
    address: "0x...", // Add your staking contract address
    abi: stakingABI,
    functionName: "totalStaked",
  });

  const { data: userStaked, isLoading: isLoadingUserStaked } = useContractRead({
    address: "0x...", // Add your staking contract address
    abi: stakingABI,
    functionName: "userStaked",
    args: [address],
    enabled: !!address,
  });

  const { data: userVotingPower, isLoading: isLoadingVotingPower } = useContractRead({
    address: "0x...", // Add your staking contract address
    abi: stakingABI,
    functionName: "userVotingPower",
    args: [address],
    enabled: !!address,
  });

  const { data: userLockEnd, isLoading: isLoadingLockEnd } = useContractRead({
    address: "0x...", // Add your staking contract address
    abi: stakingABI,
    functionName: "userLockEnd",
    args: [address],
    enabled: !!address,
  });

  const { data: userRewards, isLoading: isLoadingRewards } = useContractRead({
    address: "0x...", // Add your staking contract address
    abi: stakingABI,
    functionName: "userRewards",
    args: [address],
    enabled: !!address,
  });

  const { data: totalRewards, isLoading: isLoadingTotalRewards } = useContractRead({
    address: "0x...", // Add your staking contract address
    abi: stakingABI,
    functionName: "totalRewards",
  });

  // Contract writes
  const { write: stake, data: stakeData } = useContractWrite({
    address: "0x...", // Add your staking contract address
    abi: stakingABI,
    functionName: "stake",
  });

  const { write: increaseStake, data: increaseStakeData } = useContractWrite({
    address: "0x...", // Add your staking contract address
    abi: stakingABI,
    functionName: "increaseStake",
  });

  const { write: extendLock, data: extendLockData } = useContractWrite({
    address: "0x...", // Add your staking contract address
    abi: stakingABI,
    functionName: "extendLock",
  });

  const { write: withdraw, data: withdrawData } = useContractWrite({
    address: "0x...", // Add your staking contract address
    abi: stakingABI,
    functionName: "withdraw",
  });

  const { write: claimRewards, data: claimRewardsData } = useContractWrite({
    address: "0x...", // Add your staking contract address
    abi: stakingABI,
    functionName: "claimRewards",
  });

  // Transaction status
  const { isLoading: isStakingPending } = useWaitForTransaction({
    hash: stakeData?.hash,
  });

  const { isLoading: isIncreasingPending } = useWaitForTransaction({
    hash: increaseStakeData?.hash,
  });

  const { isLoading: isExtendingPending } = useWaitForTransaction({
    hash: extendLockData?.hash,
  });

  const { isLoading: isWithdrawingPending } = useWaitForTransaction({
    hash: withdrawData?.hash,
  });

  const { isLoading: isClaimingPending } = useWaitForTransaction({
    hash: claimRewardsData?.hash,
  });

  // Update staking info
  useEffect(() => {
    if (totalStaked && userStaked && userVotingPower && userLockEnd && userRewards && totalRewards) {
      setStakingInfo({
        totalStaked: totalStaked as bigint,
        userStaked: userStaked as bigint,
        userVotingPower: userVotingPower as bigint,
        userLockEnd: userLockEnd as bigint,
        userRewards: userRewards as bigint,
        totalRewards: totalRewards as bigint,
        lockDuration: BigInt(0), // This should be fetched from the contract
      });
    }
  }, [totalStaked, userStaked, userVotingPower, userLockEnd, userRewards, totalRewards]);

  // Handle stake
  const handleStake = async () => {
    if (!amount || !stake) return;

    try {
      await stake({
        args: [parseEther(amount), lockDuration],
      });
      toast.success("Staking transaction submitted!");
    } catch (error) {
      toast.error("Failed to stake. Please try again.");
      console.error("Stake error:", error);
    }
  };

  // Handle increase stake
  const handleIncreaseStake = async () => {
    if (!amount || !increaseStake) return;

    try {
      await increaseStake({
        args: [parseEther(amount)],
      });
      toast.success("Increase stake transaction submitted!");
    } catch (error) {
      toast.error("Failed to increase stake. Please try again.");
      console.error("Increase stake error:", error);
    }
  };

  // Handle extend lock
  const handleExtendLock = async () => {
    if (!extendLock) return;

    try {
      await extendLock({
        args: [lockDuration],
      });
      toast.success("Lock extension transaction submitted!");
    } catch (error) {
      toast.error("Failed to extend lock. Please try again.");
      console.error("Extend lock error:", error);
    }
  };

  // Handle withdraw
  const handleWithdraw = async () => {
    if (!withdraw) return;

    try {
      await withdraw();
      toast.success("Withdrawal transaction submitted!");
    } catch (error) {
      toast.error("Failed to withdraw. Please try again.");
      console.error("Withdraw error:", error);
    }
  };

  // Handle claim rewards
  const handleClaimRewards = async () => {
    if (!claimRewards) return;

    try {
      await claimRewards();
      toast.success("Rewards claim transaction submitted!");
    } catch (error) {
      toast.error("Failed to claim rewards. Please try again.");
      console.error("Claim rewards error:", error);
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
            Boost rewards, Share protocol revenue and vote on liquidity incentives
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
              <p className="text-[#F5F5F5]/60 text-sm mb-2">Total Rewards</p>
              <p className="text-[#4A7C59] text-2xl font-medium">
                {isLoadingTotalRewards
                  ? "Loading..."
                  : `${formatEther(stakingInfo.totalRewards)} STEAM`}
              </p>
            </div>
            <div className="bg-[#0A0A0A] p-6 shadow-custom-dark">
              <p className="text-[#F5F5F5]/60 text-sm mb-2">Your Rewards</p>
              <p className="text-[#4A7C59] text-2xl font-medium">
                {isLoadingRewards
                  ? "Loading..."
                  : `${formatEther(stakingInfo.userRewards)} STEAM`}
              </p>
            </div>
          </div>

          {/* Staking Interface */}
          <div className="bg-[#0A0A0A] p-8 shadow-custom-dark">
            {/* User Stats */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-[#1A1A1A] p-6 border border-[#4A7C59]/20">
                <p className="text-[#F5F5F5]/60 text-sm mb-2">Your Stake</p>
                <p className="text-[#4A7C59] text-2xl font-medium">
                  {isLoadingUserStaked
                    ? "Loading..."
                    : `${formatEther(stakingInfo.userStaked)} STEAM`}
                </p>
              </div>
              <div className="bg-[#1A1A1A] p-6 border border-[#4A7C59]/20">
                <p className="text-[#F5F5F5]/60 text-sm mb-2">Voting Power</p>
                <p className="text-[#4A7C59] text-2xl font-medium">
                  {isLoadingVotingPower
                    ? "Loading..."
                    : `${formatEther(stakingInfo.userVotingPower)} vSTEAM`}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button
                onClick={handleStake}
                disabled={isStakingPending || !amount}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  isStakingPending || !amount
                    ? "bg-[#1F3529] text-[#4A7C59] cursor-not-allowed"
                    : "bg-[#4A7C59] text-white hover:bg-[#3A6147]"
                }`}
              >
                {isStakingPending ? "Staking..." : "Stake"}
              </button>
              <button
                onClick={handleIncreaseStake}
                disabled={isIncreasingPending || !amount}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  isIncreasingPending || !amount
                    ? "bg-[#1F3529] text-[#4A7C59] cursor-not-allowed"
                    : "bg-[#4A7C59] text-white hover:bg-[#3A6147]"
                }`}
              >
                {isIncreasingPending ? "Increasing..." : "Increase"}
              </button>
              <button
                onClick={handleExtendLock}
                disabled={isExtendingPending}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  isExtendingPending
                    ? "bg-[#1F3529] text-[#4A7C59] cursor-not-allowed"
                    : "bg-[#4A7C59] text-white hover:bg-[#3A6147]"
                }`}
              >
                {isExtendingPending ? "Extending..." : "Extend"}
              </button>
              <button
                onClick={handleWithdraw}
                disabled={isWithdrawingPending}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  isWithdrawingPending
                    ? "bg-[#1F3529] text-[#4A7C59] cursor-not-allowed"
                    : "bg-[#4A7C59] text-white hover:bg-[#3A6147]"
                }`}
              >
                {isWithdrawingPending ? "Withdrawing..." : "Withdraw"}
              </button>
            </div>

            {/* Input Section */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <p className="text-[#F5F5F5]/60">Amount</p>
                  <p className="text-[#F5F5F5]/60">
                    Balance: {isLoadingUserStaked ? "Loading..." : `${formatEther(stakingInfo.userStaked)} STEAM`}
                  </p>
                </div>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount in STEAM"
                  className="w-full bg-[#1A1A1A] border border-[#4A7C59]/20 focus:border-[#4A7C59] outline-none transition-all p-4 text-[#F5F5F5] placeholder-[#F5F5F5]/30"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <p className="text-[#F5F5F5]/60">Lock Duration</p>
                  <p className="text-[#4A7C59]">
                    Boost: {calculateBoost(lockDuration).toFixed(2)}x
                  </p>
                </div>
                <input
                  type="range"
                  min="1"
                  max="208"
                  value={lockDuration}
                  onChange={(e) => setLockDuration(Number(e.target.value))}
                  className="w-full h-2 bg-[#1A1A1A] border border-[#4A7C59]/20 focus:border-[#4A7C59] outline-none transition-all"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-[#F5F5F5]/60 text-sm">1 week</span>
                  <span className="text-[#F5F5F5]/60 text-sm">4 years</span>
                </div>
              </div>

              {/* Rewards Section */}
              <div className="bg-[#1A1A1A] p-6 border border-[#4A7C59]/20">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[#F5F5F5]/60 text-sm mb-1">Available Rewards</p>
                    <p className="text-[#4A7C59] text-xl font-medium">
                      {isLoadingRewards
                        ? "Loading..."
                        : `${formatEther(stakingInfo.userRewards)} STEAM`}
                    </p>
                  </div>
                  <button
                    onClick={handleClaimRewards}
                    disabled={isClaimingPending || stakingInfo.userRewards === BigInt(0)}
                    className={`px-6 py-3 text-sm font-medium transition-colors ${
                      isClaimingPending || stakingInfo.userRewards === BigInt(0)
                        ? "bg-[#1F3529] text-[#4A7C59] cursor-not-allowed"
                        : "bg-[#4A7C59] text-white hover:bg-[#3A6147]"
                    }`}
                  >
                    {isClaimingPending ? "Claiming..." : "Claim Rewards"}
                  </button>
                </div>
              </div>

              {!isConnected ? (
                <div className="flex justify-center mt-8">
                  <ConnectButton />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
