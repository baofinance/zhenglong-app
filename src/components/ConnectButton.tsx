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
  const { connect, connectors } = useConnect();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConnect = () => {
    const injected = connectors[0];
    if (injected) {
      connect({ connector: injected });
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
      className={`bg-[#4A7C59] hover:bg-[#3A6147] px-6 py-2 text-white text-lg tracking-wider transition-all uppercase ${geo.className}`}
    >
      {isConnected ? formatAddress(address!) : "Connect Wallet"}
    </button>
  );
}
