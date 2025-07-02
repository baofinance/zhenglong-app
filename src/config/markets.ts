export type MarketStatus = "coming_soon" | "genesis" | "live" | "archived";

export interface ContractAddresses {
  collateralToken: string;
  underlyingCollateralToken?: string;
  feeReceiver: string;
  genesis: string;
  leveragedToken: string;
  minter: string;
  owner: string;
  peggedToken: string;
  priceOracle: string;
  stabilityPoolCollateral: string;
  stabilityPoolLeveraged: string;
  reservePool: string;
  rebalancePoolCollateral: string;
  rebalancePoolLeveraged: string;
  collateralPrice: string;
}

export interface GenesisConfig {
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  rewards: {
    pegged: {
      symbol: string;
      amount: string; // Amount in ether units
    };
    leveraged: {
      symbol: string;
      amount: string; // Amount in ether units
    };
  };
  tokenDistribution: {
    pegged: {
      percentage: number;
      description: string;
    };
    leveraged: {
      percentage: number;
      description: string;
    };
  };
  // Additional genesis configuration
  isActive: boolean; // Whether genesis is currently active (can be overridden)
  displayStatus: "upcoming" | "active" | "ended" | "completed"; // Display status for UI
  description?: string; // Genesis-specific description
  terms?: string; // Terms and conditions for genesis
}

export interface MarketInfo {
  id: string;
  title: string;
  name: string; // Full market name
  description: string; // Market description
  collateralTokens: string[];
  peggedToken: {
    name: string;
    description: string;
  };
  leveragedToken: {
    name: string;
    description: string;
  };
  status: MarketStatus;
  launchDate?: string; // ISO date string
  // Contract addresses for this market
  addresses: ContractAddresses;
  // Genesis configuration for this market
  genesis: GenesisConfig;
  rewardToken: {
    symbol: string;
    amount: string;
  };
  chain: {
    id: number;
    name: string;
    logo: string; // Path to chain logo or URL
  };
}

export const marketsConfig: Record<string, MarketInfo> = {
  "eth-usd": {
    id: "eth-usd",
    title: "ETH/USD",
    name: "ETH/USD",
    description: "Ethereum / US Dollar",
    collateralTokens: ["wstETH"],
    peggedToken: {
      name: "zheUSD",
      description: "A stablecoin pegged to the US Dollar.",
    },
    leveragedToken: {
      name: "steamedETH",
      description: "Leveraged exposure to ETH.",
    },
    status: "genesis",
    launchDate: "2024-12-01T00:00:00Z",
    addresses: {
      collateralToken: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
      underlyingCollateralToken: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
      feeReceiver: "0xAE7Dbb17bc40D53A6363409c6B1ED88d3cFdc31e",
      genesis: "0x3f75c48fceefAb5A28649e360288a4a29262bea6",
      leveragedToken: "0xddCF8c63f36eb83b72BAf6dA3AA799f9A08caa9A",
      minter: "0x5f9dD176ea5282d392225ceC5c2E7A24d5d02672",
      owner: "0xAE7Dbb17bc40D53A6363409c6B1ED88d3cFdc31e",
      peggedToken: "0x07d15D57a3b0457677885C16E2bdF8653FC4e38b",
      priceOracle: "0x8Bb877fa0bbD7ea09f7aCd70eDF79dFf5b8a54dD",
      stabilityPoolCollateral: "0x319554eF50998660776CF0EF924073e5c416b890",
      stabilityPoolLeveraged: "0xf5C468f11D73c183619faac4cDeB6272b6C390Bb",
      reservePool: "0x6c9a2f9A94770336403E69e9eA5D88C97EF3b78A",
      rebalancePoolCollateral: "0x319554eF50998660776CF0EF924073e5c416b890",
      rebalancePoolLeveraged: "0xf5C468f11D73c183619faac4cDeB6272b6C390Bb",
      collateralPrice: "0x8Bb877fa0bbD7ea09f7aCd70eDF79dFf5b8a54dD",
    },
    rewardToken: {
      symbol: "STEAM",
      amount: "1000000", // 1 million STEAM tokens for genesis
    },
    genesis: {
      startDate: "2025-07-01T00:00:00Z",
      endDate: "2025-07-15T23:59:59Z",
      rewards: {
        pegged: {
          symbol: "zheUSD",
          amount: "1000000",
        },
        leveraged: {
          symbol: "steamedETH",
          amount: "1000000",
        },
      },
      tokenDistribution: {
        pegged: {
          percentage: 50,
          description: "A pegged token tracking the price of US Dollar.",
        },
        leveraged: {
          percentage: 50,
          description: "A leveraged token, long on ETH vs USD.",
        },
      },
      isActive: true,
      displayStatus: "active",
      description:
        "Genesis period for ETH/USD market. Deposit wstETH collateral to earn STEAM rewards.",
    },
    chain: {
      id: 1,
      name: "Ethereum",
      logo: "/eth-logo.svg", // You'll need to add this logo to your public folder
    },
  },
  "btc-usd": {
    id: "btc-usd",
    title: "BTC/USD",
    name: "BTC/USD",
    description: "Bitcoin / US Dollar",
    collateralTokens: ["wBTC", "tBTC"],
    peggedToken: {
      name: "zheUSD",
      description: "Pegged to the US Dollar.",
    },
    leveragedToken: {
      name: "steamedBTC/USD",
      description: "Leveraged exposure to Bitcoin vs USD.",
    },
    status: "genesis",
    addresses: {
      // TODO: Add actual contract addresses for BTC/USD market
      collateralToken: "0x0000000000000000000000000000000000000000",
      feeReceiver: "0x0000000000000000000000000000000000000000",
      genesis: "0x0000000000000000000000000000000000000000",
      leveragedToken: "0x0000000000000000000000000000000000000000",
      minter: "0x0000000000000000000000000000000000000000",
      owner: "0x0000000000000000000000000000000000000000",
      peggedToken: "0x0000000000000000000000000000000000000000",
      priceOracle: "0x0000000000000000000000000000000000000000",
      stabilityPoolCollateral: "0x0000000000000000000000000000000000000000",
      stabilityPoolLeveraged: "0x0000000000000000000000000000000000000000",
      reservePool: "0x0000000000000000000000000000000000000000",
      rebalancePoolCollateral: "0x0000000000000000000000000000000000000000",
      rebalancePoolLeveraged: "0x0000000000000000000000000000000000000000",
      collateralPrice: "0x0000000000000000000000000000000000000000",
    },
    rewardToken: {
      symbol: "STEAM",
      amount: "500000", // 500,000 STEAM tokens for genesis
    },
    genesis: {
      startDate: "2024-04-01T00:00:00Z",
      endDate: "2024-04-02T20:15:00Z",
      rewards: {
        pegged: {
          symbol: "zheUSD",
          amount: "500000",
        },
        leveraged: {
          symbol: "steamedBTC",
          amount: "500000",
        },
      },
      tokenDistribution: {
        pegged: {
          percentage: 50,
          description: "A pegged token tracking the price of US Dollar.",
        },
        leveraged: {
          percentage: 50,
          description:
            "A leveraged token representing a volatile position on BTC.",
        },
      },
      isActive: false,
      displayStatus: "upcoming",
      description:
        "Genesis period for BTC/USD market. Deposit BTC-based collateral to earn rewards.",
    },
    chain: {
      id: 1,
      name: "Ethereum",
      logo: "/eth-logo.svg", // BTC/USD market on Ethereum
    },
  },
  "sol-usd": {
    id: "sol-usd",
    title: "SOL/USD",
    name: "SOL/USD",
    description: "Solana / US Dollar",
    collateralTokens: ["wSOL", "SOL"],
    peggedToken: {
      name: "zheUSD",
      description: "A stablecoin pegged to the US Dollar.",
    },
    leveragedToken: {
      name: "steamedSOL",
      description: "Leveraged exposure to Solana.",
    },
    status: "coming_soon",
    addresses: {
      // TODO: Add actual contract addresses for SOL/USD market
      collateralToken: "0x0000000000000000000000000000000000000000",
      feeReceiver: "0x0000000000000000000000000000000000000000",
      genesis: "0x0000000000000000000000000000000000000000",
      leveragedToken: "0x0000000000000000000000000000000000000000",
      minter: "0x0000000000000000000000000000000000000000",
      owner: "0x0000000000000000000000000000000000000000",
      peggedToken: "0x0000000000000000000000000000000000000000",
      priceOracle: "0x0000000000000000000000000000000000000000",
      stabilityPoolCollateral: "0x0000000000000000000000000000000000000000",
      stabilityPoolLeveraged: "0x0000000000000000000000000000000000000000",
      reservePool: "0x0000000000000000000000000000000000000000",
      rebalancePoolCollateral: "0x0000000000000000000000000000000000000000",
      rebalancePoolLeveraged: "0x0000000000000000000000000000000000000000",
      collateralPrice: "0x0000000000000000000000000000000000000000",
    },
    rewardToken: {
      symbol: "STEAM",
      amount: "250000", // 250,000 STEAM tokens for genesis
    },
    genesis: {
      startDate: "2024-05-01T00:00:00Z",
      endDate: "2024-05-02T20:15:00Z",
      rewards: {
        pegged: {
          symbol: "zheUSD",
          amount: "250000",
        },
        leveraged: {
          symbol: "steamedSOL",
          amount: "250000",
        },
      },
      tokenDistribution: {
        pegged: {
          percentage: 50,
          description: "A pegged token tracking the price of US Dollar.",
        },
        leveraged: {
          percentage: 50,
          description:
            "A leveraged token representing a volatile position on SOL.",
        },
      },
      isActive: false,
      displayStatus: "upcoming",
      description: "Genesis period for SOL/USD market. Coming soon.",
    },
    chain: {
      id: 101,
      name: "Solana",
      logo: "/sol-logo.svg", // You'll need to add this logo to your public folder
    },
  },
};

// Helper function to get markets by status
export function getMarketsByStatus(status: MarketStatus): MarketInfo[] {
  return Object.values(marketsConfig).filter(
    (market) => market.status === status
  );
}

// Helper function to get available markets (not coming_soon or archived)
export function getAvailableMarkets(): MarketInfo[] {
  return Object.values(marketsConfig).filter(
    (market) => market.status === "live" || market.status === "genesis"
  );
}

// Helper function to get market by ID
export function getMarketById(id: string): MarketInfo | undefined {
  return marketsConfig[id];
}

// Enhanced genesis status that combines on-chain state with config
export interface GenesisStatus {
  onChainStatus: "scheduled" | "live" | "closed" | "completed";
  displayStatus: "upcoming" | "active" | "ended" | "completed";
  timeRemaining?: string;
  progress?: number;
  canDeposit: boolean;
  canWithdraw: boolean;
  canClaim: boolean;
  phase: "scheduled" | "live" | "closed" | "completed";
}

export function getGenesisStatus(
  market: MarketInfo,
  onChainGenesisEnded: boolean = false
): GenesisStatus {
  const now = new Date();
  const startDate = new Date(market.genesis.startDate);
  const endDate = new Date(market.genesis.endDate);

  // Determine on-chain status
  let onChainStatus: "scheduled" | "live" | "closed" | "completed";
  let displayStatus: "upcoming" | "active" | "ended" | "completed";
  let canDeposit = false;
  let canWithdraw = false;
  let canClaim = false;
  let phase: "scheduled" | "live" | "closed" | "completed";

  if (onChainGenesisEnded) {
    // Genesis has been ended on-chain
    onChainStatus = "completed";
    displayStatus = "completed";
    canDeposit = false;
    canWithdraw = true; // Users can still withdraw their deposits
    canClaim = true; // Users can claim their rewards
    phase = "completed";
  } else if (now < startDate) {
    // Before scheduled start
    onChainStatus = "scheduled";
    displayStatus = "upcoming";
    canDeposit = false;
    canWithdraw = false;
    canClaim = false;
    phase = "scheduled";
  } else if (now >= startDate && now <= endDate) {
    // Within scheduled window
    onChainStatus = "live";
    displayStatus = "active";
    canDeposit = true;
    canWithdraw = true;
    canClaim = false; // Can't claim until genesis ends
    phase = "live";
  } else {
    // Past scheduled end but not ended on-chain
    onChainStatus = "closed";
    displayStatus = "ended";
    canDeposit = false;
    canWithdraw = true;
    canClaim = false; // Can't claim until genesis is ended on-chain
    phase = "closed";
  }

  // Calculate time remaining and progress
  let timeRemaining: string | undefined;
  let progress: number | undefined;

  if (displayStatus === "upcoming") {
    const timeRemainingMs = Math.max(0, startDate.getTime() - now.getTime());
    const days = Math.floor(timeRemainingMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeRemainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    timeRemaining = `${days}d ${hours}h`;
  } else if (displayStatus === "active") {
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    progress = Math.min(100, (elapsed / totalDuration) * 100);

    const timeRemainingMs = Math.max(0, endDate.getTime() - now.getTime());
    const days = Math.floor(timeRemainingMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeRemainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor(
      (timeRemainingMs % (1000 * 60 * 60)) / (1000 * 60)
    );
    timeRemaining = `${days}d ${hours}h ${minutes}m`;
  }

  return {
    onChainStatus,
    displayStatus,
    timeRemaining,
    progress,
    canDeposit,
    canWithdraw,
    canClaim,
    phase,
  };
}

// Helper function to get primary reward token (STEAM for now)
export function getPrimaryRewardToken(market: MarketInfo) {
  return {
    symbol: market.genesis.rewards.leveraged.symbol,
    amount: market.genesis.rewards.leveraged.amount,
  };
}

// Helper function to check if genesis is currently active (depends on on-chain state)
export function isGenesisActive(
  market: MarketInfo,
  onChainGenesisEnded: boolean = false
): boolean {
  const status = getGenesisStatus(market, onChainGenesisEnded);
  return status.onChainStatus === "live";
}

// Helper function to get phase-specific information
export function getGenesisPhaseInfo(
  phase: "scheduled" | "live" | "closed" | "completed"
) {
  const phaseInfo = {
    scheduled: {
      title: "Scheduled",
      description: "Genesis period is scheduled to start",
    },
    live: {
      title: "Live",
      description: "Genesis period is active - deposits open",
    },
    closed: {
      title: "Closed",
      description: "Genesis period has ended - awaiting completion",
    },
    completed: {
      title: "Completed",
      description: "Genesis completed - rewards distributed",
    },
  };

  return phaseInfo[phase];
}

// For backward compatibility and convenience
export const marketConfig = marketsConfig["eth-usd"];
export const contractAddresses = marketsConfig["eth-usd"].addresses;

// Legacy type alias for backward compatibility
export type MarketConfig = MarketInfo;
