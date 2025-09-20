"use client";

import React, { useMemo, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { Copy, Check, LogOut, Wallet, AlertTriangle } from "lucide-react";
import { mainnet } from "wagmi/chains";
import DecryptedText from "./DecryptedText";

function formatAddress(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export default function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { data: balance } = useBalance({
    address,
    query: { enabled: !!address },
  });
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const available = useMemo(
    () => connectors.filter((c) => c.ready),
    [connectors]
  );

  const wrongNetwork = isConnected && chainId !== mainnet.id;
  const displayAddr = useMemo(
    () => (address ? formatAddress(address) : ""),
    [address]
  );

  async function handleCopy() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          "relative inline-flex items-center gap-2 rounded-sm outline outline-1 px-3 py-1.5 text-sm text-white hover:outline-white/20 " +
          (wrongNetwork ? "outline-red-500/60" : "outline-white/10")
        }
      >
        <Wallet className="h-4 w-4 text-white/70" />
        {isConnected ? (
          <DecryptedText
            text={displayAddr}
            parentClassName="inline-block"
            className=""
            encryptedClassName="text-white/40"
            animateOn="view"
            useOriginalCharsOnly
            speed={60}
          />
        ) : (
          <span>Connect</span>
        )}
        {wrongNetwork && (
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500" />
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-100 transition-opacity"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-sm bg-[#0c0d0d] outline outline-1 outline-white/10 text-white shadow-2xl">
            <div className="border-b border-white/10 p-4 flex items-center justify-between">
              <h3 className="font-semibold font-mono">
                {isConnected ? "Wallet" : "Connect Wallet"}
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-white/60 hover:text-white"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {isConnected ? (
              <div className="p-4 space-y-3">
                {wrongNetwork && (
                  <div className="flex items-center justify-between rounded-sm border border-red-500/30 bg-red-500/5 p-2">
                    <div className="flex items-center gap-2 text-sm text-red-300">
                      <AlertTriangle className="h-4 w-4" /> Wrong network
                    </div>
                    <button
                      onClick={() => switchChain({ chainId: mainnet.id })}
                      disabled={isSwitching}
                      className="rounded-sm outline outline-1 outline-white/10 px-2 py-1 text-xs hover:outline-white/20 disabled:opacity-50"
                    >
                      {isSwitching ? "Switching..." : "Switch to Ethereum"}
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-sm text-white/80">
                    <div className="font-mono">
                      {displayAddr ? (
                        <DecryptedText
                          text={displayAddr}
                          parentClassName="inline-block"
                          className=""
                          encryptedClassName="text-white/40"
                          animateOn="hover"
                        />
                      ) : (
                        <span className="text-white/40">—</span>
                      )}
                    </div>
                    <div className="text-white/60 text-xs">
                      Chain ID {chainId}
                    </div>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 rounded-sm outline outline-1 outline-white/10 px-2 py-1 text-xs hover:outline-white/20"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </>
                    )}
                  </button>
                </div>

                <div className="rounded-sm bg-white/5 outline outline-1 outline-white/10 p-3">
                  <div className="text-xs text-white/60">Balance</div>
                  <div className="font-mono text-white">
                    {balance
                      ? `${Number(balance.value) / 10 ** balance.decimals} ${
                          balance.symbol
                        }`
                      : "—"}
                  </div>
                </div>

                <button
                  onClick={() => {
                    disconnect();
                    setOpen(false);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-sm outline outline-1 outline-white/10 px-3 py-2 hover:outline-white/20"
                >
                  <LogOut className="h-4 w-4" /> Disconnect
                </button>
              </div>
            ) : (
              <div className="p-3">
                <div className="space-y-2">
                  {available.map((c) => (
                    <button
                      key={c.uid}
                      onClick={async () => {
                        await connect({ connector: c });
                        setOpen(false);
                      }}
                      disabled={isPending}
                      className="w-full flex items-center justify-between rounded-sm outline outline-1 outline-white/10 px-3 py-2 hover:outline-white/20 disabled:opacity-50"
                    >
                      <span className="text-left">{c.name}</span>
                      <span className="text-white/50 text-xs">
                        {c.ready ? "Available" : "Unavailable"}
                      </span>
                    </button>
                  ))}
                  {available.length === 0 && (
                    <div className="text-sm text-white/60 p-2 text-center">
                      No wallet connectors available in this browser.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
