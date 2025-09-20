"use client";

import { wagmiConfig } from "@/config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { type ReactNode } from "react";
import { cookieToInitialState, WagmiProvider, type Config } from "wagmi";
import { CurrencyProvider } from "./CurrencyContext";

// Set up queryClient
const queryClient = new QueryClient();

function ContextProvider({
  children,
  cookies,
}: Readonly<{
  children: React.ReactNode;
  cookies: string | null;
}>) {
  const initialState = cookieToInitialState(
    wagmiConfig as unknown as Config,
    cookies
  );

  return (
    <WagmiProvider
      config={wagmiConfig as unknown as Config}
      initialState={initialState}
    >
      <QueryClientProvider client={queryClient}>
        <CurrencyProvider>{children}</CurrencyProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default ContextProvider;
