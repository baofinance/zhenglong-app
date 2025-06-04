export interface ContractAddresses {
  collateralToken: string;
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

export const markets: Markets = {
  "steth-usd": {
    id: "steth-usd",
    name: "stETH/USD",
    description: "Lido Staked ETH / US Dollar",
    addresses: {
      collateralToken: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
      feeReceiver: "0x99aA73dA6309b8eC484eF2C95e96C131C1BBF7a0",
      genesis: "0xEd3AAE51d33138ef67555AE0925A38E77Df5B7e0",
      leveragedToken: "0xAf7868a9BB72E16B930D50636519038d7F057470",
      minter: "0x3aD2306eDfBe72ce013cdb6b429212d9CdDE4F96",
      owner: "0xFC69e0a5823E2AfCBEb8a35d33588360F1496a00",
      peggedToken: "0x7945b0A6674b175695e5d1D08aE1e6F13744Abb0",
      priceOracle: "0x97541208c6C8ecfbe57B8A44ba86f2A88bA783e2",
      rebalancePoolCollateral: "0x37e2156B0d78098F06F8075a18d7E3a09483048e",
      rebalancePoolLeveraged: "0xfC47d03bd4C8a7E62A62f29000ceBa4D84142343",
      reservePool: "0xFBc00Fa47a7d3bbE3e82B5Aa560B47008c1bD64c",
      collateralPrice: "0xCfE54B5cD566aB89272946F602D76Ea879CAb4a8",
    },
    genesis: {
      startDate: "2024-03-21T00:00:00Z",
      endDate: "2024-03-22T20:15:00Z",
      rewards: {
        pegged: {
          symbol: "zheUSD",
          amount: "1000000", // 1 million zheUSD
        },
        leveraged: {
          symbol: "steamedETH",
          amount: "1000000", // 1 million STEAM
        },
      },
      collateralRatio: 1.0,
      leverageRatio: 1.0,
    },
  },
};

// For backward compatibility and convenience
export const marketConfig = markets["steth-usd"];
export const contractAddresses = markets["steth-usd"].addresses;

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

// Add price history types
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
