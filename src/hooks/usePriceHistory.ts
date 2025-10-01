import { useState, useEffect } from "react";
import { usePublicClient } from "wagmi";
import { formatEther, decodeEventLog } from "viem";
import { markets } from "../config/markets";
import type { PriceDataPoint } from "../config/contracts";
import { minterABI } from "../config/contracts";

const BLOCKS_PER_DAY = 7200; // Approximate number of blocks per day on Ethereum
const DAYS_TO_FETCH = 30; // Number of days of history to fetch

const mintEventAbi = {
  anonymous: false,
  inputs: [
    { indexed: true, name: "user", type: "address" },
    { indexed: false, name: "collateralAmount", type: "uint256" },
    { indexed: false, name: "tokenAmount", type: "uint256" },
    { indexed: false, name: "timestamp", type: "uint256" },
  ],
  name: "LeveragedTokenMinted",
  type: "event",
} as const;

const redeemEventAbi = {
  anonymous: false,
  inputs: [
    { indexed: true, name: "user", type: "address" },
    { indexed: false, name: "tokenAmount", type: "uint256" },
    { indexed: false, name: "collateralAmount", type: "uint256" },
    { indexed: false, name: "timestamp", type: "uint256" },
  ],
  name: "LeveragedTokenRedeemed",
  type: "event",
} as const;

export function usePriceHistory(marketId: string, tokenSymbol: string) {
  const [priceHistory, setPriceHistory] = useState<PriceDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const publicClient = usePublicClient();

  useEffect(() => {
    async function fetchPriceHistory() {
      setIsLoading(true);
      try {
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock - BigInt(BLOCKS_PER_DAY * DAYS_TO_FETCH);

        // Fetch mint events
        const mintEvents = await publicClient.getLogs({
          address: markets[marketId].addresses.minter as `0x${string}`,
          event: mintEventAbi,
          fromBlock,
          toBlock: currentBlock,
        });

        // Fetch redeem events
        const redeemEvents = await publicClient.getLogs({
          address: markets[marketId].addresses.minter as `0x${string}`,
          event: redeemEventAbi,
          fromBlock,
          toBlock: currentBlock,
        });

        // Process events into price points
        const pricePoints: PriceDataPoint[] = [
          ...mintEvents.map((event) => {
            const decodedData = decodeEventLog({
              abi: [mintEventAbi],
              data: event.data,
              topics: event.topics,
            });
            return {
              timestamp: Number(decodedData.args.timestamp),
              price:
                Number(formatEther(decodedData.args.collateralAmount)) /
                Number(formatEther(decodedData.args.tokenAmount)),
              type: "mint" as const,
              tokenAmount: decodedData.args.tokenAmount,
              collateralAmount: decodedData.args.collateralAmount,
            };
          }),
          ...redeemEvents.map((event) => {
            const decodedData = decodeEventLog({
              abi: [redeemEventAbi],
              data: event.data,
              topics: event.topics,
            });
            return {
              timestamp: Number(decodedData.args.timestamp),
              price:
                Number(formatEther(decodedData.args.collateralAmount)) /
                Number(formatEther(decodedData.args.tokenAmount)),
              type: "redeem" as const,
              tokenAmount: decodedData.args.tokenAmount,
              collateralAmount: decodedData.args.collateralAmount,
            };
          }),
        ].sort((a, b) => a.timestamp - b.timestamp);

        setPriceHistory(pricePoints);
      } catch (error) {
        console.error("Error fetching price history:", error);
        setPriceHistory([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPriceHistory();
  }, [marketId, tokenSymbol, publicClient]);

  return {
    priceHistory,
    isLoading,
  };
}
