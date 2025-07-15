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

export interface MarketConfig {
  id: string;
  name: string;
  description: string;
  addresses: ContractAddresses;
  genesis: {
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
    collateralRatio: number;
    leverageRatio: number;
  };
}

export type Markets = {
  [key: string]: MarketConfig;
};

// ============================================================================
// Market Configurations
// When adding new markets, add them to this object following the same structure
// Make sure to:
// 1. Use a descriptive key that reflects the market pair (e.g. "steth-usd")
// 2. Include all required contract addresses
// 3. Set appropriate genesis parameters
// 4. Update any dependent configurations
// ============================================================================

export const markets: Markets = {
  zheeth: {
    id: "zheeth",
    name: "zheETH",
    description: "zheETH",
    addresses: {
      collateralToken: "0x0000000000000000000000000000000000000005",
      underlyingCollateralToken: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
      feeReceiver: "0xE3e7A4B35574Ce4b9Bc661cD93e8804Da548932a",
      genesis: "0x0000000000000000000000000000000000000003",
      leveragedToken: "0x0000000000000000000000000000000000000007",
      minter: "0x0000000000000000000000000000000000000004",
      owner: "0xFC69e0a5823E2AfCBEb8a35d33588360F1496a00",
      peggedToken: "0x0000000000000000000000000000000000000006",
      priceOracle: "0x0000000000000000000000000000000000000008",
      stabilityPoolCollateral: "0x000000000000000000000000000000000000000a",
      stabilityPoolLeveraged: "0x000000000000000000000000000000000000000b",
      reservePool: "0x0000000000000000000000000000000000000009",
      rebalancePoolCollateral: "0x37e2156B0d78098F06F8075a18d7E3a09483048e",
      rebalancePoolLeveraged: "0xfC47d03bd4C8a7E62A62f29000ceBa4D84142343",
      collateralPrice: "0xCfE54B5cD566aB89272946F602D76Ea879CAb4a8",
    },
    genesis: {
      startDate: "2024-03-21T00:00:00Z",
      endDate: "2024-09-01T00:00:00Z",
      rewards: {
        pegged: {
          symbol: "fxSAVE",
          amount: "1000000", // 1 million fxSAVE
        },
        leveraged: {
          symbol: "steamedUSD/ETH",
          amount: "1000000", // 1 million steamedUSD/ETH
        },
      },
      collateralRatio: 1.0,
      leverageRatio: 2 * 1e18,
    },
  },
  "zhebtc-fxsave": {
    id: "zhebtc-fxsave",
    name: "zheBTC (fxSAVE collateral)",
    description: "zheBTC (fxSAVE collateral)",
    addresses: {
      collateralToken: "0x0000000000000000000000000000000000000015",
      underlyingCollateralToken: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
      feeReceiver: "0xE3e7A4B35574Ce4b9Bc661cD93e8804Da548932a",
      genesis: "0x0000000000000000000000000000000000000013",
      leveragedToken: "0x0000000000000000000000000000000000000017",
      minter: "0x0000000000000000000000000000000000000014",
      owner: "0xFC69e0a5823E2AfCBEb8a35d33588360F1496a00",
      peggedToken: "0x0000000000000000000000000000000000000016",
      priceOracle: "0x0000000000000000000000000000000000000018",
      stabilityPoolCollateral: "0x000000000000000000000000000000000000001a",
      stabilityPoolLeveraged: "0x000000000000000000000000000000000000001b",
      reservePool: "0x0000000000000000000000000000000000000019",
      rebalancePoolCollateral: "0x37e2156B0d78098F06F8075a18d7E3a09483048e",
      rebalancePoolLeveraged: "0xfC47d03bd4C8a7E62A62f29000ceBa4D84142343",
      collateralPrice: "0xCfE54B5cD566aB89272946F602D76Ea879CAb4a8",
    },
    genesis: {
      startDate: "2024-03-21T00:00:00Z",
      endDate: "2024-09-01T00:00:00Z",
      rewards: {
        pegged: {
          symbol: "fxSAVE",
          amount: "1000000", // 1 million fxSAVE
        },
        leveraged: {
          symbol: "steamedUSD/BTC",
          amount: "1000000", // 1 million steamedUSD/BTC
        },
      },
      collateralRatio: 1.0,
      leverageRatio: 2 * 1e18,
    },
  },
  "zhebtc-wsteth": {
    id: "zhebtc-wsteth",
    name: "zheBTC (wstETH collateral)",
    description: "zheBTC (wstETH collateral)",
    addresses: {
      collateralToken: "0x0000000000000000000000000000000000000025",
      underlyingCollateralToken: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
      feeReceiver: "0xE3e7A4B35574Ce4b9Bc661cD93e8804Da548932a",
      genesis: "0x0000000000000000000000000000000000000023",
      leveragedToken: "0x0000000000000000000000000000000000000027",
      minter: "0x0000000000000000000000000000000000000024",
      owner: "0xFC69e0a5823E2AfCBEb8a35d33588360F1496a00",
      peggedToken: "0x0000000000000000000000000000000000000026",
      priceOracle: "0x0000000000000000000000000000000000000028",
      stabilityPoolCollateral: "0x000000000000000000000000000000000000002a",
      stabilityPoolLeveraged: "0x000000000000000000000000000000000000002b",
      reservePool: "0x0000000000000000000000000000000000000029",
      rebalancePoolCollateral: "0x37e2156B0d78098F06F8075a18d7E3a09483048e",
      rebalancePoolLeveraged: "0xfC47d03bd4C8a7E62A62f29000ceBa4D84142343",
      collateralPrice: "0xCfE54B5cD566aB89272946F602D76Ea879CAb4a8",
    },
    genesis: {
      startDate: "2024-03-21T00:00:00Z",
      endDate: "2024-09-01T00:00:00Z",
      rewards: {
        pegged: {
          symbol: "wstETH",
          amount: "1000000", // 1 million wstETH
        },
        leveraged: {
          symbol: "steamedETH/BTC",
          amount: "1000000", // 1 million steamedETH/BTC
        },
      },
      collateralRatio: 1.0,
      leverageRatio: 2 * 1e18,
    },
  },
};

// For backward compatibility and convenience
export const marketConfig = markets["zheeth"];
export const contractAddresses = markets["zheeth"].addresses;

// ============================================================================
// Contract ABIs and Types
// ============================================================================

export const minterABI = [
  {
    inputs: [],
    name: "collateralTokenBalance",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalCollateralValue",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalPeggedValue",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalLeveragedValue",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "collateralRatio",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "collateralAmount", type: "uint256" },
      { indexed: false, name: "tokenAmount", type: "uint256" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
    name: "LeveragedTokenMinted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "user", type: "address" },
      { indexed: false, name: "tokenAmount", type: "uint256" },
      { indexed: false, name: "collateralAmount", type: "uint256" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
    name: "LeveragedTokenRedeemed",
    type: "event",
  },
] as const;

// Price history types
export interface PriceDataPoint {
  timestamp: number;
  price: number;
  type: "mint" | "redeem" | "oracle";
  tokenAmount: bigint;
  collateralAmount: bigint;
}

export interface TokenPriceHistory {
  [tokenSymbol: string]: PriceDataPoint[];
}
