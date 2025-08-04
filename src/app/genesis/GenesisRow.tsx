"use client";

import { useState } from "react";
import Image from "next/image";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { markets } from "../../config/markets";

interface GenesisRowProps {
  marketId: string;
  market: any;
  allMarketsData: any;
  allTokenData: any;
  refetchAllData: () => void;
  genesisMarkets: any[];
}

export function GenesisRow({
  marketId,
  market,
  allMarketsData,
  allTokenData,
  refetchAllData,
  genesisMarkets,
}: GenesisRowProps) {
  const { address, isConnected } = useAccount();

  const formatDisplayEther = (value: bigint | undefined) => {
    if (!value) return "0";
    const num = Number(formatEther(value));
    if (num > 0 && num < 0.0001) return "<0.0001";
    return num.toLocaleString("en-US", {
      maximumFractionDigits: 2,
    });
  };

  const marketIndex = genesisMarkets.findIndex(([id]) => id === marketId);
  const dataOffset = marketIndex * (address ? 5 : 3);
  const tokenDataOffset = marketIndex * (address ? 4 : 2);

  const totalDeposits = allTokenData?.[tokenDataOffset + 1]?.result;
  const collateralSymbol = allTokenData?.[tokenDataOffset]?.result;

  const onChainGenesisEnded = allMarketsData?.[dataOffset]?.result === true;
  const isCompleted = onChainGenesisEnded || market.status === "completed";

  const totalRewardsAmount = market.rewardToken?.amount || 0;
  const totalRewardsSymbol = market.rewardToken?.symbol || "";

  return (
    <tr
      key={marketId}
      className="transition hover:bg-grey-light/20 text-sm cursor-pointer border-t border-white/10"
    >
      <td className="py-1 px-8 whitespace-nowrap">
        <div className="flex items-center gap-4">
          <div className="flex w-6 items-center justify-center">
            <Image
              src={market.chain.logo}
              alt={market.chain.name}
              width={32}
              height={32}
              className="flex-shrink-0-full border-1 antialiased border-white/50"
            />
          </div>
          <div className="flex flex-col items-start gap-1">
            <span className="font-medium ">{market.name}</span>
          </div>
        </div>
      </td>
      <td className="py-3 px-6 text-right">
        {formatDisplayEther(totalDeposits)} {collateralSymbol}
      </td>
      <td className="py-3 px-6 text-right">
        {totalRewardsAmount.toLocaleString()} {totalRewardsSymbol}
      </td>
      <td className="py-3 px-6 text-right">
        {/* Placeholder for APR/Rewards */} TBD
      </td>
      <td className="w-48 py-3 px-6 text-right font-normal">
        <button
          onClick={() => {
            /* Logic to handle deposit/claim */
          }}
          className="bg-green-500/10 border-green-500/50 text-green-400 border-lg px-4 py-2 hover:bg-green-500/20"
        >
          {isCompleted ? "Claim" : "Deposit"}
        </button>
      </td>
    </tr>
  );
}
