import { contracts } from "./contracts";

export const markets = {
  "eth-usd": {
    name: "ETH/USD",
    status: "genesis" as const,
    chain: {
      name: "Ethereum",
      logo: "icons/eth.png",
    },
    addresses: {
      minter: contracts.minter,
      peggedToken: contracts.peggedToken,
      leveragedToken: contracts.leveragedToken,
      steam: contracts.steam,
      veSteam: contracts.veSteam,
      reservePool: contracts.reservePool,
      stabilityPoolManager: contracts.stabilityPoolManager,
      genesis: contracts.genesis,
      priceOracle: contracts.priceOracle,
      feeReceiver: contracts.feeReceiver,
      collateralToken: contracts.wrappedCollateralToken,
      wrappedCollateralToken: contracts.collateralToken,
    },
    peggedToken: {
      name: "zheUSD",
      symbol: "zheUSD",
      description: "Pegged to ETH price with USD stability",
    },
    leveragedToken: {
      name: "steamedETH/USD",
      symbol: "steamedETH/USD",
      description: "Leveraged exposure to ETH price movements",
    },
    rewardToken: {
      name: "Steam",
      symbol: "STEAM",
      amount: "1000000", // 1M tokens
      description: "Governance and reward token",
    },
    genesis: {
      startDate: "2025-01-01T00:00:00Z",
      endDate: "2025-12-31T23:59:59Z",
      tokenDistribution: {
        pegged: {
          ratio: 0.5,
          description: "50% of your deposit as pegged tokens",
        },
        leveraged: {
          ratio: 0.5,
          description: "50% of your deposit as leveraged tokens",
        },
      },
    },
  },
} as const;

// Helper functions for genesis status
export function getGenesisStatus(market: any, onChainGenesisEnded: boolean) {
  const now = new Date();
  const startDate = new Date(market.genesis.startDate);
  const endDate = new Date(market.genesis.endDate);

  if (onChainGenesisEnded) {
    return {
      phase: "completed" as const,
      onChainStatus: "completed" as const,
      canClaim: true,
      canDeposit: false,
      canWithdraw: false,
    };
  }

  if (now < startDate) {
    return {
      phase: "scheduled" as const,
      onChainStatus: "scheduled" as const,
      canClaim: false,
      canDeposit: false,
      canWithdraw: false,
    };
  }

  if (now >= startDate && now <= endDate) {
    return {
      phase: "live" as const,
      onChainStatus: "live" as const,
      canClaim: false,
      canDeposit: true,
      canWithdraw: true,
    };
  }

  return {
    phase: "closed" as const,
    onChainStatus: "closed" as const,
    canClaim: true,
    canDeposit: false,
    canWithdraw: true,
  };
}

export function getGenesisPhaseInfo(phase: string) {
  switch (phase) {
    case "scheduled":
      return { title: "SCHEDULED", description: "Genesis period not started" };
    case "live":
      return { title: "LIVE", description: "Genesis period is active" };
    case "closed":
      return { title: "CLOSED", description: "Genesis period ended" };
    case "completed":
      return { title: "COMPLETED", description: "Genesis period completed" };
    default:
      return { title: "UNKNOWN", description: "Unknown status" };
  }
}

export function isGenesisActive(market: any) {
  const status = getGenesisStatus(market, false);
  return status.phase === "live";
}

export function getPrimaryRewardToken(market: any) {
  return market.rewardToken;
}
