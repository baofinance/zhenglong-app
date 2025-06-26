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

export const markets: Markets = {
  "steth-usd": {
    id: "steth-usd",
    name: "stETH/USD",
    description: "Lido Staked ETH / US Dollar",
    addresses: {
      collateralToken: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
      underlyingCollateralToken: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
      feeReceiver: "0xE3e7A4B35574Ce4b9Bc661cD93e8804Da548932a",
      genesis: "0xb53249FEBB6562Abf19BD728d6775c09d2ae0438",
      leveragedToken: "0xC6c0E14c02C2dBd4f116230f01D03836620167B9",
      minter: "0xAD44f37213E7b7f08Ac9A984993429Dac957Ec62",
      owner: "0xFC69e0a5823E2AfCBEb8a35d33588360F1496a00",
      peggedToken: "0xD0725945859175dabd070855bC3F1c37a3aF605F",
      priceOracle: "0x6dB83DF31b4402Cbd0D113481c3B1F114321d0ca",
      stabilityPoolCollateral: "0xEeED66583c579F3eEDF7270AE204419fE3fF09f5",
      stabilityPoolLeveraged: "0x733697D06E9AbC1C45d1a1c75D18910d43133a6F",
      reservePool: "0x96e74d78A9EC0dB11C8c9fF2FD93bC98D8895B5A",
      rebalancePoolCollateral: "0x37e2156B0d78098F06F8075a18d7E3a09483048e",
      rebalancePoolLeveraged: "0xfC47d03bd4C8a7E62A62f29000ceBa4D84142343",
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
