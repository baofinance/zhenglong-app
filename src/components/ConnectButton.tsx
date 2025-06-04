"use client";

import { useAccount, useConnect } from "wagmi";
import { Geo } from "next/font/google";
import { useState, useEffect } from "react";

const geo = Geo({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export default function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, error, isLoading, pendingConnector } =
    useConnect();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConnect = async () => {
    const injected = connectors[0];
    if (injected) {
      try {
        await connect({ connector: injected });
      } catch (err) {
        console.error("Failed to connect:", err);
      }
    } else {
      console.error("No injected connector found");
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Return a placeholder during server-side rendering
  if (!mounted) {
    return (
      <button
        className={`bg-[#4A7C59] hover:bg-[#3A6147] px-6 py-2 text-white text-lg tracking-wider transition-all uppercase ${geo.className}`}
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isLoading}
      className={`${
        isLoading
          ? "bg-[#3A6147] cursor-wait"
          : "bg-[#4A7C59] hover:bg-[#3A6147]"
      } px-6 py-2 text-white text-lg tracking-wider transition-all uppercase ${
        geo.className
      }`}
    >
      {isLoading
        ? `Connecting to ${pendingConnector?.name || "wallet"}...`
        : isConnected
        ? formatAddress(address!)
        : "Connect Wallet"}
    </button>
  );
}
