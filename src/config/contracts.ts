// Import market configuration from the unified markets config
export {
  marketsConfig as markets,
  marketConfig,
  contractAddresses,
  getGenesisStatus,
  getPrimaryRewardToken,
  isGenesisActive,
  getGenesisPhaseInfo,
  type MarketInfo as MarketConfig,
  type ContractAddresses,
  type GenesisConfig,
  type GenesisStatus,
} from "./markets";

// Legacy CONTRACTS constant for backward compatibility
export const CONTRACTS = {
  MINTER: "0x5f9dD176ea5282d392225ceC5c2E7A24d5d02672",
  PEGGED_TOKEN: "0x07d15D57a3b0457677885C16E2bdF8653FC4e38b",
  LEVERAGED_TOKEN: "0xddCF8c63f36eb83b72BAf6dA3AA799f9A08caa9A",
  GENESIS: "0x3f75c48fceefAb5A28649e360288a4a29262bea6",
  STABILITY_POOL_MANAGER: "0x84F36aeF81aBf1E34bcA9e470fE15e12697CB7Fd",
  STABILITY_POOL_COLLATERAL: "0x319554eF50998660776CF0EF924073e5c416b890",
  STABILITY_POOL_PEGGED: "0xf5C468f11D73c183619faac4cDeB6272b6C390Bb",
  PRICE_ORACLE: "0x8Bb877fa0bbD7ea09f7aCd70eDF79dFf5b8a54dD",
  TOKEN_DISTRIBUTOR: "0x8fF6E100EB12Ec17Bf1D0ac53431715ebB845E5D",
  RESERVE_POOL: "0x6c9a2f9A94770336403E69e9eA5D88C97EF3b78A",
  CONFIG: "0x74ef79CFC735A10436eF9D4808547df0Ce38f788",
  WSTETH: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
  STETH: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
  CHAIN_ID: 31337,
  RPC_URL: "http://127.0.0.1:8545",
} as const;

// Contract ABIs
export const GENESIS_ABI = [
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "endGenesis",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "genesisIsEnded",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const ERC20_ABI = [
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

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
