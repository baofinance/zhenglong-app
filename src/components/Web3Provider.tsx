"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { anvil } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";

// Create a query client
const queryClient = new QueryClient();

// Set up wagmi config
const wagmiConfig = createConfig({
  chains: [anvil],
  connectors: [injected()],
  transports: {
    [anvil.id]: http("http://127.0.0.1:8545"),
  },
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log("[DEBUG] Wagmi config created with chains:", [anvil]);
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
