"use client";

import { useState, useEffect } from "react";
import { Geo } from "next/font/google";
import { useGenesisClaim } from "../hooks/useGenesisClaim";
import { useAccount } from "wagmi";
import GenesisClaimStatusModal from "./GenesisClaimStatusModal";

const geo = Geo({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const formatEther = (value: bigint | undefined) => {
  if (!value) return "0";
  const num = Number(value) / 1e18;
  if (num > 0 && num < 0.0001) return "<0.0001";
  return num.toFixed(4);
};

interface GenesisClaimProps {
  marketId: string;
  collateralSymbol?: string;
}

export default function GenesisClaim({
  marketId,
  collateralSymbol,
}: GenesisClaimProps) {
  const { isConnected } = useAccount();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastClaimedPegged, setLastClaimedPegged] = useState<bigint>(BigInt(0));
  const [lastClaimedLeveraged, setLastClaimedLeveraged] = useState<bigint>(
    BigInt(0)
  );

  const {
    canClaim,
    genesisEnded,
    userShares,
    claimablePegged,
    claimableLeveraged,
    claimTokens,
    withdrawCollateral,
    isPending,
    claimSuccess,
    claimHash,
    market,
  } = useGenesisClaim(marketId);

  // Show modal when claim transaction is submitted
  useEffect(() => {
    if (claimHash) {
      setLastClaimedPegged(claimablePegged);
      setLastClaimedLeveraged(claimableLeveraged);
      setShowSuccessModal(true);
    }
  }, [claimHash, claimablePegged, claimableLeveraged]);

  if (!isConnected) {
    return (
      <div className="text-center p-6">
        <p className="text-[#F5F5F5]/60">
          Please connect your wallet to view claimable tokens
        </p>
      </div>
    );
  }

  if (!genesisEnded) {
    return (
      <div className="text-center p-6">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-yellow-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3
            className={`text-lg font-medium text-[#F5F5F5] mb-2 ${geo.className}`}
          >
            Genesis Still Active
          </h3>
          <p className="text-sm text-[#F5F5F5]/60">
            Token claiming will be available after genesis ends
          </p>
        </div>
      </div>
    );
  }

  if (!canClaim || userShares === BigInt(0)) {
    return (
      <div className="text-center p-6">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-400/10 border border-gray-400/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            </svg>
          </div>
          <h3
            className={`text-lg font-medium text-[#F5F5F5] mb-2 ${geo.className}`}
          >
            No Tokens to Claim
          </h3>
          <p className="text-sm text-[#F5F5F5]/60">
            You don't have any tokens available to claim
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3
          className={`text-xl font-medium text-[#F5F5F5] mb-2 ${geo.className}`}
        >
          Claim Your Tokens
        </h3>
        <p className="text-sm text-[#F5F5F5]/60">
          Genesis has ended. You can now claim your pegged and leveraged tokens.
        </p>
      </div>

      {/* Claimable Token Amounts */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50/10 border border-blue-400/20">
          <div className={`text-2xl font-bold text-blue-400 ${geo.className}`}>
            {formatEther(claimablePegged)}
          </div>
          <div className="text-sm text-[#F5F5F5]/60 mt-1">
            {market?.peggedToken.name || "Pegged Token"}
          </div>
          <div className="text-xs text-[#F5F5F5]/40 mt-1">Pegged Tokens</div>
        </div>
        <div className="text-center p-4 bg-purple-50/10 border border-purple-400/20">
          <div
            className={`text-2xl font-bold text-purple-400 ${geo.className}`}
          >
            {formatEther(claimableLeveraged)}
          </div>
          <div className="text-sm text-[#F5F5F5]/60 mt-1">
            {market?.leveragedToken.name || "Leveraged Token"}
          </div>
          <div className="text-xs text-[#F5F5F5]/40 mt-1">Leveraged Tokens</div>
        </div>
      </div>

      {/* Claim Button */}
      <div className="space-y-4">
        <button
          onClick={() => {
            // Show modal immediately when button is clicked
            setLastClaimedPegged(claimablePegged);
            setLastClaimedLeveraged(claimableLeveraged);
            setShowSuccessModal(true);
            // Then call the claim function
            claimTokens();
          }}
          disabled={
            isPending ||
            !isConnected ||
            (claimablePegged === 0n && claimableLeveraged === 0n)
          }
          className={`w-full py-4 font-medium transition-colors ${
            isPending ||
            !isConnected ||
            (claimablePegged === 0n && claimableLeveraged === 0n)
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {isPending
            ? "Claiming..."
            : claimablePegged === 0n && claimableLeveraged === 0n
            ? "No Tokens to Claim"
            : "Claim Tokens (Free)"}
        </button>

        {/* Benefits Info */}
        <div className="text-sm text-[#F5F5F5]/50 text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span className="text-green-400">✅</span>
            <span>No fees charged for claiming</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-green-400">🎯</span>
            <span>Get your full share of pegged and leveraged tokens</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-green-400">⚡</span>
            <span>Instant transfer - no waiting for redemption</span>
          </div>
        </div>

        {/* Alternative Withdrawal Option */}
        <div className="pt-4 border-t border-[#4A7C59]/20">
          <details className="text-sm">
            <summary className="cursor-pointer text-[#F5F5F5]/60 hover:text-[#F5F5F5] transition-colors">
              Alternative: Withdraw original collateral (with fees)
            </summary>
            <div className="mt-3 p-3 bg-yellow-400/10 border border-yellow-400/20 text-yellow-300">
              <p className="text-xs mb-2">
                ⚠️ Instead of claiming tokens, you can withdraw your original{" "}
                {collateralSymbol || "collateral"} collateral. This redeems your
                tokens back to collateral but charges redemption fees.
              </p>
              <p className="text-xs">
                <strong>Recommended:</strong> Claim tokens (free) and redeem
                them separately if needed.
              </p>
            </div>
          </details>
        </div>
      </div>

      {/* Transaction Status Modal */}
      <GenesisClaimStatusModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        market={market}
        claimedPegged={lastClaimedPegged}
        claimedLeveraged={lastClaimedLeveraged}
        transactionHash={claimHash}
      />
    </div>
  );
}
