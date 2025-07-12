import { markets } from "./contracts";

export interface Pool {
  address: `0x${string}`;
  type: "stability" | "liquidity";
  marketId: string;
  poolType: "collateral" | "leveraged";
  name: string;
  tokenSymbol: string;
  chain: string;
  chainId: number;
  chainIcon: string;
}

const generatePools = (): Pool[] => {
  const allPools: Pool[] = [];

  for (const marketId in markets) {
    const market = markets[marketId];

    if (market.addresses.stabilityPoolCollateral) {
      allPools.push({
        address: market.addresses.stabilityPoolCollateral as `0x${string}`,
        type: "stability",
        marketId,
        poolType: "collateral",
        name: `${market.genesis.rewards.pegged.symbol} Stability Pool`,
        tokenSymbol: market.genesis.rewards.pegged.symbol,
        chain: "Ethereum",
        chainId: 1,
        chainIcon: "/icons/eth.png",
      });
    }

    if (market.addresses.stabilityPoolLeveraged) {
      allPools.push({
        address: market.addresses.stabilityPoolLeveraged as `0x${string}`,
        type: "stability",
        marketId,
        poolType: "leveraged",
        name: `${market.genesis.rewards.leveraged.symbol} Leveraged Pool`,
        tokenSymbol: market.genesis.rewards.leveraged.symbol,
        chain: "Ethereum",
        chainId: 1,
        chainIcon: "/icons/eth.png",
      });
    }

    // Add liquidity pools here if they exist in the market config
  }

  return allPools;
};

export const pools: Pool[] = generatePools();

export const poolsByAddress = pools.reduce((acc, pool) => {
  acc[pool.address] = pool;
  return acc;
}, {} as Record<`0x${string}`, Pool>);
