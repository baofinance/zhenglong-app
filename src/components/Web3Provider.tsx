"use client";

import { WagmiConfig } from "wagmi";
import { configureChains, createConfig } from "wagmi";
import { Chain } from "wagmi/chains";
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
};

// Configure chains & providers with debug logging
const { publicClient } = configureChains(
  [anvil],
  [
    jsonRpcProvider({
      rpc: () => {
        console.log(
          "[DEBUG] Setting up RPC connection to:",
          "http://127.0.0.1:8545"
        );
        return {
          http: "http://127.0.0.1:8545",
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
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log("[DEBUG] Public client configuration:", publicClient);
    console.log("[DEBUG] Available chains:", anvil);
  }, []);

  return <WagmiConfig config={wagmiConfig}>{children}</WagmiConfig>;
}
