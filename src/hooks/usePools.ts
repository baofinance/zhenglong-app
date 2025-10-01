import { pools, poolsByAddress, Pool } from "@/config/pools";
import { markets, MarketConfig } from "@/config/contracts";

export const usePools = () => {
  const getAllPools = (): Pool[] => {
    return pools;
  };

  const getPoolByAddress = (address: `0x${string}`): Pool | undefined => {
    return poolsByAddress[address];
  };
  const getPoolsByType = (type: "Collateral" | "Leveraged"): Pool[] => {
    return pools.filter((pool) => pool.type === type);
  };

  const getPoolsByMarket = (marketId: string): Pool[] => {
    return pools.filter((pool) => pool.marketId === marketId);
  };

  const getMarketByPool = (
    poolAddress: `0x${string}`
  ): MarketConfig | undefined => {
    const pool = poolsByAddress[poolAddress];
    if (!pool) return undefined;
    return markets[pool.marketId];
  };

  return {
    getAllPools,
    getPoolByAddress,
    getPoolsByType,
    getPoolsByMarket,
    getMarketByPool,
  };
};
