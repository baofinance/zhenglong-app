"use client";

import { WagmiConfig } from "wagmi";
import { configureChains, createConfig } from "wagmi";
import { Chain, mainnet, sepolia } from "wagmi/chains";
import { InjectedConnector } from "wagmi/connectors/injected";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { useEffect } from "react";

// Define local Anvil chain
const anvil: Chain = {
  id: 31337,
  name: "Anvil",
  network: "anvil",
  nativeCurrency: {
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
    public: {
      http: ["http://127.0.0.1:8545"],
    },
  },
  testnet: true,
};

// Configure chains & providers
const { publicClient, webSocketPublicClient } = configureChains(
  [anvil],
  [
    jsonRpcProvider({
      rpc: (chain) => {
        console.log("[DEBUG] Setting up RPC connection for chain:", chain.name);
        if (chain.id === anvil.id) {
          return {
            http: "http://127.0.0.1:8545",
          };
        }
        return {
          http: chain.rpcUrls.default.http[0],
        };
      },
    }),
  ]
);

// Set up wagmi config
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    new InjectedConnector({
      chains: [anvil],
      options: {
        name: "MetaMask",
        shimDisconnect: true,
      },
    }),
  ],
  publicClient,
  webSocketPublicClient,
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log("[DEBUG] Public client configuration:", publicClient);
    console.log("[DEBUG] Available chains:", [anvil]);
  }, []);

  return <WagmiConfig config={wagmiConfig}>{children}</WagmiConfig>;
}
