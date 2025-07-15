import { markets } from "./contracts";

// TODO: URGENT - Update steamedUSD and BTC icons once final token assets are available
// Current icons are placeholders:
// - /icons/steamedUSD.png
// - /icons/btc.png

export interface Pool {
  id: string;
  groupName: string;
  groupIcon: string;
  groupSubText?: string;
  name: string;
  assetIcons: string[];
  address: `0x${string}`;
  type: "Collateral" | "Leveraged";
  leverage?: number;
  tokenSymbol: string;
  chain: string;
  chainId: number;
  chainIcon: string;
  description: string;
  marketId: string;
  poolType: "collateral" | "leveraged";
}

const launchPools: Pool[] = [
  // Group 1: zheETH Deposits
  {
    id: "zheeth-fxsave",
    groupName: "zheETH Deposits",
    groupIcon: "🟢",
    name: "fxSAVE Pool",
    assetIcons: ["/icons/fxSave.png"],
    address: markets.zheeth.addresses.stabilityPoolCollateral as `0x${string}`,
    type: "Collateral",
    tokenSymbol: "fxSAVE",
    chain: "Ethereum",
    chainId: 1,
    chainIcon: "/icons/eth.png",
    description: "Deposit fxSAVE to earn yield and secure the protocol.",
    marketId: "zheeth",
    poolType: "collateral",
  },
  {
    id: "zheeth-steamedusd-eth",
    groupName: "zheETH Deposits",
    groupIcon: "🟢",
    name: "steamedUSD / ETH",
    assetIcons: ["/icons/steamedUSD.png", "/icons/eth.png"], // TODO: Update steamedUSD icon when available
    address: markets.zheeth.addresses.stabilityPoolLeveraged as `0x${string}`,
    type: "Leveraged",
    leverage: 2,
    tokenSymbol: "steamedUSD/ETH",
    chain: "Ethereum",
    chainId: 1,
    chainIcon: "/icons/eth.png",
    description:
      "Provide liquidity for the steamedUSD/ETH pair to earn leveraged rewards.",
    marketId: "zheeth",
    poolType: "leveraged",
  },
  // Group 2: zheBTC Deposits (fxSAVE collateral)
  {
    id: "zhebtc-fxsave-fxsave",
    groupName: "zheBTC Deposits",
    groupIcon: "🟠",
    groupSubText: "(fxSAVE collateral)",
    name: "fxSAVE Pool",
    assetIcons: ["/icons/fxSave.png"],
    address: markets["zhebtc-fxsave"].addresses
      .stabilityPoolCollateral as `0x${string}`,
    type: "Collateral",
    tokenSymbol: "fxSAVE",
    chain: "Ethereum",
    chainId: 1,
    chainIcon: "/icons/eth.png",
    description: "Deposit fxSAVE to earn yield and secure the protocol.",
    marketId: "zhebtc-fxsave",
    poolType: "collateral",
  },
  {
    id: "zhebtc-fxsave-steamedusd-btc",
    groupName: "zheBTC Deposits",
    groupIcon: "🟠",
    groupSubText: "(fxSAVE collateral)",
    name: "steamedUSD / BTC",
    assetIcons: ["/icons/steamedUSD.png", "/icons/btc.png"], // TODO: Update steamedUSD and BTC icons when available
    address: markets["zhebtc-fxsave"].addresses
      .stabilityPoolLeveraged as `0x${string}`,
    type: "Leveraged",
    leverage: 2,
    tokenSymbol: "steamedUSD/BTC",
    chain: "Ethereum",
    chainId: 1,
    chainIcon: "/icons/eth.png",
    description:
      "Provide liquidity for the steamedUSD/BTC pair to earn leveraged rewards.",
    marketId: "zhebtc-fxsave",
    poolType: "leveraged",
  },
  // Group 3: zheBTC Deposits (wstETH collateral)
  {
    id: "zhebtc-wsteth-wsteth",
    groupName: "zheBTC Deposits",
    groupIcon: "🔵",
    groupSubText: "(wstETH collateral)",
    name: "wstETH Pool",
    assetIcons: ["/icons/wstETH.webp"],
    address: markets["zhebtc-wsteth"].addresses
      .stabilityPoolCollateral as `0x${string}`,
    type: "Collateral",
    tokenSymbol: "wstETH",
    chain: "Ethereum",
    chainId: 1,
    chainIcon: "/icons/eth.png",
    description: "Deposit wstETH to earn yield and secure the protocol.",
    marketId: "zhebtc-wsteth",
    poolType: "collateral",
  },
  {
    id: "zhebtc-wsteth-steamedeth-btc",
    groupName: "zheBTC Deposits",
    groupIcon: "🔵",
    groupSubText: "(wstETH collateral)",
    name: "steamedETH / BTC",
    assetIcons: ["/icons/steamedeth.svg", "/icons/btc.png"], // TODO: Update BTC icon when available
    address: markets["zhebtc-wsteth"].addresses
      .stabilityPoolLeveraged as `0x${string}`,
    type: "Leveraged",
    leverage: 2,
    tokenSymbol: "steamedETH/BTC",
    chain: "Ethereum",
    chainId: 1,
    chainIcon: "/icons/eth.png",
    description:
      "Provide liquidity for the steamedETH/BTC pair to earn leveraged rewards.",
    marketId: "zhebtc-wsteth",
    poolType: "leveraged",
  },
];

export const pools: Pool[] = launchPools;

export const poolsByAddress = pools.reduce((acc, pool) => {
  acc[pool.address] = pool;
  return acc;
}, {} as Record<`0x${string}`, Pool>);
