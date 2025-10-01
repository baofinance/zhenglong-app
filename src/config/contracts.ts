// Contract addresses for the new deployment
export const contracts = {
  minter: "0xE41bBcf8ec773B477735b0b0D8bF6E7Ca6BDe9Ee",
  peggedToken: "0x6c7Df3575f1d69eb3B245A082937794794C2b82E",
  leveragedToken: "0x74ef79CFC735A10436eF9D4808547df0Ce38f788",
  steam: "0x5f9dD176ea5282d392225ceC5c2E7A24d5d02672",
  veSteam: "0x819F9213cE51Adac4C1c2EF7D4Cba563727C1206",
  reservePool: "0x289BD64Deb826c134dA670f8B759FB4CA018dF4B",
  stabilityPoolManager: "0xeC67cF0755c0A5aaD6C4A4235fDfA35c1EFEA6A9",
  genesis: "0x49c58c6BE0680Eb756595c0F59ab3E0b6e1624cd",
  priceOracle: "0x2C834EFcDd2E9D04C1a34367BA9D8aa587F90fBe",
  feeReceiver: "0x3A5fBC501c5D515383fADFf5ebD92C393f5eFee9",
  gaugeController: "0x3860B063928436F548c3A58A40c4d1d171E78838",
  steamMinter: "0x14835B093D320AA5c9806BBC64C17F0F2546D9EE",
  collateralToken: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
  wrappedCollateralToken: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
} as const;

// Legacy CONTRACTS constant for backward compatibility
export const CONTRACTS = {
  MINTER: "0xE41bBcf8ec773B477735b0b0D8bF6E7Ca6BDe9Ee",
  PEGGED_TOKEN: "0x6c7Df3575f1d69eb3B245A082937794794C2b82E",
  LEVERAGED_TOKEN: "0x74ef79CFC735A10436eF9D4808547df0Ce38f788",
  GENESIS: "0x49c58c6BE0680Eb756595c0F59ab3E0b6e1624cd",
  STABILITY_POOL_MANAGER: "0xeC67cF0755c0A5aaD6C4A4235fDfA35c1EFEA6A9",
  STABILITY_POOL_COLLATERAL: "0x5ea494676ecE7e46837038eDab78B7C3557A3977",
  STABILITY_POOL_PEGGED: "0x0659A97068958Ebaba97121A6D7a2a95924824Ea",
  STABILITY_POOL_COLLATERAL_STAKE: "0xe828215EB5A61a5cB62fB980288B835689af4091",
  STABILITY_POOL_STEAMED_STAKE: "0xd3873FDF150b3fFFb447d3701DFD234DF452f367",
  PRICE_ORACLE: "0x2C834EFcDd2E9D04C1a34367BA9D8aa587F90fBe",
  TOKEN_DISTRIBUTOR: "0x819F9213cE51Adac4C1c2EF7D4Cba563727C1206",
  RESERVE_POOL: "0x289BD64Deb826c134dA670f8B759FB4CA018dF4B",
  CONFIG: "0x3A5fBC501c5D515383fADFf5ebD92C393f5eFee9",
  GAUGE_CONTROLLER: "0x3860B063928436F548c3A58A40c4d1d171E78838",
  STEAM_MINTER: "0x14835B093D320AA5c9806BBC64C17F0F2546D9EE",
  WSTETH: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
  STETH: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
  CHAIN_ID: 31337,
  RPC_URL: "http://127.0.0.1:8545",
} as const;

export type MarketConfig = {
  id: string;
  name: string;
  description: string;
  addresses: {
    collateralToken: `0x${string}`;
    underlyingCollateralToken: `0x${string}`;
    feeReceiver: `0x${string}`;
    genesis: `0x${string}`;
    leveragedToken: `0x${string}`;
    minter: `0x${string}`;
    owner: `0x${string}`;
    peggedToken: `0x${string}`;
    priceOracle: `0x${string}`;
    stabilityPoolCollateral: `0x${string}`;
    stabilityPoolLeveraged: `0x${string}`;
    reservePool: `0x${string}`;
    rebalancePoolCollateral: `0x${string}`;
    rebalancePoolLeveraged: `0x${string}`;
    collateralPrice: `0x${string}`;
  };
  genesis: {
    startDate: string;
    endDate: string;
    rewards: {
      pegged: {
        symbol: string;
        amount: string;
      };
      leveraged: {
        symbol: string;
        amount: string;
      };
    };
    collateralRatio: number;
    leverageRatio: number;
  };
};

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
      collateralToken: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
      underlyingCollateralToken: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
      feeReceiver: "0x72f78328bf23b9A44d3Cc41189e5fd874BF01cBC",
      genesis: "0x576C5cF0774990CEf78f15B9D7d9946E44e8fDa3",
      leveragedToken: "0x6dD1d5459CfF7eD8Bd60FdD08fb461A5A849469B",
      minter: "0x3FD3d725e7Ab6C1E12a916410437f47b002560d2",
      owner: "0xFC69e0a5823E2AfCBEb8a35d33588360F1496a00",
      peggedToken: "0x84F36aeF81aBf1E34bcA9e470fE15e12697CB7Fd",
      priceOracle: "0x3F6514E6bBFFeE6cEDE3d07850F84cDde3D1F825",
      stabilityPoolCollateral: "0xF0F53654c24ae511099D032020975C4baa273d12",
      stabilityPoolLeveraged: "0x59D0e1Cd1b5521E8F21AcA6B8Fd95181297E2784",
      reservePool: "0x3c682cf8492e3e7206E984278bd30e030C703De8",
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

// Contract ABIs
export const STABILITY_POOL_MANAGER_ABI = [
  {
    inputs: [],
    name: "rebalanceThreshold",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const GENESIS_ABI = [
  // Custom Errors
  {
    type: "error",
    name: "GenesisAlreadyEnded",
    inputs: [],
  },
  {
    type: "error",
    name: "OnlyOwner",
    inputs: [],
  },
  {
    type: "error",
    name: "NoCollateralDeposited",
    inputs: [],
  },
  {
    type: "error",
    name: "GenesisNotActive",
    inputs: [],
  },
  {
    type: "error",
    name: "InsufficientBalance",
    inputs: [],
  },
  // Additional potential custom errors
  {
    type: "error",
    name: "Unauthorized",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidState",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidOperation",
    inputs: [],
  },
  {
    type: "error",
    name: "ContractPaused",
    inputs: [],
  },
  {
    type: "error",
    name: "ZeroAmount",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidAmount",
    inputs: [],
  },
  {
    type: "error",
    name: "TransferFailed",
    inputs: [],
  },
  {
    type: "error",
    name: "InsufficientCollateral",
    inputs: [],
  },
  {
    type: "error",
    name: "NotOwner",
    inputs: [],
  },
  {
    type: "error",
    name: "AlreadyInitialized",
    inputs: [],
  },
  // Functions
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
  {
    inputs: [],
    name: "totalPeggedAtGenesisEnd",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalLeveragedAtGenesisEnd",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  // Core Genesis functions
  {
    inputs: [],
    name: "collateralToken",
    outputs: [{ type: "address", name: "token" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "peggedToken",
    outputs: [{ type: "address", name: "token" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "leveragedToken",
    outputs: [{ type: "address", name: "token" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalDeposits",
    outputs: [{ type: "uint256", name: "total" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalRewards",
    outputs: [
      { type: "uint256", name: "peggedAmount" },
      { type: "uint256", name: "leveragedAmount" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "depositor", type: "address" }],
    name: "balanceOf",
    outputs: [{ type: "uint256", name: "share" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "depositor", type: "address" }],
    name: "claimable",
    outputs: [
      { type: "uint256", name: "peggedAmount" },
      { type: "uint256", name: "leveragedAmount" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "collateralIn", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    name: "withdraw",
    outputs: [{ type: "uint256", name: "collateralOut" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "receiver", type: "address" }],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
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
