import { pools, poolsByAddress, Pool } from "@/config/pools";

export const usePools = () => {
  const getAllPools = (): Pool[] => {
    return pools;
  };

  const getPoolByAddress = (address: `0x${string}`): Pool | undefined => {
    return poolsByAddress[address];
  };

  const getPoolsByType = (type: "stability" | "liquidity"): Pool[] => {
    return pools.filter((pool) => pool.type === type);
  };

  const getPoolsByMarket = (marketId: string): Pool[] => {
    return pools.filter((pool) => pool.marketId === marketId);
  };

  return {
    getAllPools,
    getPoolByAddress,
    getPoolsByType,
    getPoolsByMarket,
  };
};
