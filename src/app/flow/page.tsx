"use client";

import React, { useMemo, useState } from "react";
import { useAccount, useContractReads } from "wagmi";

// Proxy at 0xb00b4fFDccDD4593b5c433a57c3a0bcB0c568D15
const proxyAddress = "0xb00b4fFDccDD4593b5c433a57c3a0bcB0c568D15" as const;

// Minimal ABI for required reads
const proxyAbi = [
  { inputs: [], name: "getPrice", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  {
    inputs: [],
    name: "latestAnswer",
    outputs: [
      { name: "minPrice", type: "uint256" },
      { name: "maxPrice", type: "uint256" },
      { name: "minRate", type: "uint256" },
      { name: "maxRate", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // getConstraints returns (uint64,uint256)
  { inputs: [{ name: "id", type: "uint8" }], name: "getConstraints", outputs: [{ type: "uint64" }, { type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "id", type: "uint8" }], name: "feedIdentifiers", outputs: [{ type: "bytes32" }], stateMutability: "view", type: "function" },
] as const;

// Minimal Chainlink aggregator ABI for description()
const aggregatorAbi = [
  {
    inputs: [],
    name: "description",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

function format18(value?: bigint, maxFrac = 6) {
  if (value === undefined) return "-";
  const n = Number(value) / 1e18;
  return n.toLocaleString(undefined, { maximumFractionDigits: maxFrac });
}

function formatBytes32(b?: `0x${string}`) { return b || "-"; }

function formatFeedIdentifier(b?: `0x${string}`) {
  if (!b) return "-";
  return b.replace(/^0x000000000000000000000000/i, "0x");
}

function formatHeartbeat(value?: bigint) {
  if (value === undefined) return "-";
  const seconds = Number(value);
  if (seconds <= 60) return `${seconds}s`;
  if (seconds <= 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds <= 86400) return `${(seconds / 3600).toFixed(1)}h`;
  return `${(seconds / 86400).toFixed(1)}d`;
}

function formatPercent18(value?: bigint, maxFrac = 2) {
  if (value === undefined) return "-";
  const pct = (Number(value) / 1e18) * 100;
  return `${pct.toFixed(maxFrac)}%`;
}

function decodeBytes32ToAscii(bytes?: `0x${string}`): string {
  if (!bytes) return "";
  try {
    const hex = bytes.slice(2);
    const raw = Array.from({ length: hex.length / 2 }, (_, i) =>
      String.fromCharCode(parseInt(hex.substr(i * 2, 2), 16))
    ).join("");
    const trimmed = raw.replace(/\u0000+$/g, "");
    // keep only printable ASCII
    const printable = trimmed.replace(/[^\x20-\x7E]/g, "");
    return printable.trim();
  } catch {
    return "";
  }
}

function deriveFeedName(bytes?: `0x${string}`): string {
  const ascii = decodeBytes32ToAscii(bytes);
  if (ascii.includes(".eth")) return ascii;
  if (/^[-a-zA-Z0-9 .:_/()]+$/.test(ascii) && ascii.length >= 3) return ascii;
  return "-";
}

function bytes32ToAddress(bytes?: `0x${string}`): `0x${string}` | undefined {
  if (!bytes || bytes.length !== 66) return undefined;
  const tail = bytes.slice(-40);
  return (`0x${tail}`) as `0x${string}`;
}

export default function FlowPage() {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const ids = useMemo(() => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const, []);
  const ZERO_BYTES32 =
    "0x0000000000000000000000000000000000000000000000000000000000000000" as const;

  const { data } = useContractReads({
    contracts: [
      { address: proxyAddress, abi: proxyAbi, functionName: "getPrice" },
      { address: proxyAddress, abi: proxyAbi, functionName: "latestAnswer" },
      ...ids.flatMap((id) => ([
        { address: proxyAddress, abi: proxyAbi, functionName: "getConstraints", args: [id] as const },
        { address: proxyAddress, abi: proxyAbi, functionName: "feedIdentifiers", args: [id] as const },
      ])),
    ],
  });

  const price = data?.[0]?.result as bigint | undefined;
  const tuple = data?.[1]?.result as [bigint, bigint, bigint, bigint] | undefined;

  // Derive aggregator addresses from feedIdentifiers (bytes32 left-padded addresses)
  const aggregatorAddresses = useMemo(() => {
    const out: (`0x${string}` | undefined)[] = ids.map((id, i) => {
      const f = data?.[3 + i * 2]?.result as `0x${string}` | undefined;
      return bytes32ToAddress(f);
    });
    return out.filter((a): a is `0x${string}` => Boolean(a));
  }, [data, ids]);

  // Fetch descriptions for derived aggregator addresses
  const { data: descReads } = useContractReads({
    contracts: aggregatorAddresses.map((addr) => ({
      address: addr,
      abi: aggregatorAbi,
      functionName: "description" as const,
    })),
    query: { enabled: aggregatorAddresses.length > 0 },
  });

  const addressToDescription = useMemo(() => {
    const map = new Map<string, string>();
    aggregatorAddresses.forEach((addr, idx) => {
      const d = descReads?.[idx]?.result as string | undefined;
      if (addr && typeof d === "string" && d.trim().length > 0) {
        map.set(addr.toLowerCase(), d.trim());
      }
    });
    return map;
  }, [aggregatorAddresses, descReads]);

  const rows = ids
    .map((id, i) => {
      const c = data?.[2 + i * 2]?.result as [bigint, bigint] | undefined;
      const f = data?.[3 + i * 2]?.result as `0x${string}` | undefined;
      const asciiName = deriveFeedName(f);
      const aggAddr = bytes32ToAddress(f);
      const desc = aggAddr ? addressToDescription.get(aggAddr.toLowerCase()) : undefined;
      const name = desc && desc.length > 0 ? desc : asciiName;
      return { id, constraintA: c?.[0], constraintB: c?.[1], feed: f, name };
    })
    .filter((r) => r.feed && r.feed !== ZERO_BYTES32);

  const primaryFeedName = rows[0]?.name && rows[0]?.name !== "-" ? rows[0]!.name : "fxSAVE/ETH";
  const feedLabel = "fxSAVE/ETH";

  return (
    <div className="min-h-screen text-[#F5F5F5] max-w-[1300px] mx-auto font-sans relative">
      <main className="container mx-auto px-4 sm:px-10 pb-6">
        <section className="mb-6">
          <div className="outline outline-1 outline-white/10 rounded-sm p-4">
            <div className="flex items-center justify-between">
              <h1 className="font-semibold font-mono text-white">Flow</h1>
            </div>
            <p className="mt-2 text-white/60 text-sm">
              Harbor uses oracles and contract rates for our haTokens and earn pools.
            </p>
            <p className="mt-1 text-white/60 text-sm">
              Here you can see all details regarding the pricefeeds we have and can potentially implement.
            </p>
          </div>
        </section>

        {/* Feeds list (hardcoded for now) */}
        <section className="mb-6">
          <div className="outline outline-1 outline-white/10 rounded-sm p-3 sm:p-4 overflow-x-auto">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-white/90">Feeds</h2>
              <div className="text-xs text-white/50">1 feed</div>
            </div>
            <table className="min-w-full text-left text-sm table-fixed">
              <thead>
                <tr className="border-b border-white/10 uppercase tracking-wider text-[10px] text-white/60">
                  <th className="py-3 px-4 font-normal">Feed</th>
                  <th className="w-40 py-3 px-4 font-normal">Type</th>
                  <th className="w-48 py-3 px-4 font-normal">Price</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  className="border-t border-white/10 hover:bg-white/5 transition cursor-pointer"
                  onClick={() => setIsExpanded((v) => !v)}
                >
                  <td className="py-2 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">fxSAVE/ETH</span>
                    </div>
                  </td>
                  <td className="py-2 px-4">Chainlink</td>
                  <td className="py-2 px-4 font-mono">{format18(price)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {isExpanded && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="outline outline-1 outline-white/10 rounded-sm p-4">
              <div className="text-white/60 text-xs mb-1">{feedLabel} - Price</div>
              <div className="text-2xl font-mono">{format18(price)}</div>
              <div className="text-white/40 text-xs">18 decimals</div>
            </div>
            <div className="outline outline-1 outline-white/10 rounded-sm p-4">
              <div className="text-white/60 text-xs mb-1">Latest oracle feed data</div>
              <div className="space-y-1 font-mono">
                <div>{feedLabel} min price: {format18(tuple?.[0])}</div>
                <div>{feedLabel} max price: {format18(tuple?.[1])}</div>
                <div>fxSAVE min rate: {format18(tuple?.[2])}</div>
                <div>fxSAVE max rate: {format18(tuple?.[3])}</div>
              </div>
            </div>
          </section>
        )}

        {isExpanded && (
          <section>
            <div className="outline outline-1 outline-white/10 rounded-sm p-3 sm:p-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm table-fixed">
                <thead>
                  <tr className="border-b border-white/10 uppercase tracking-wider text-[10px] text-white/60">
                    <th className="py-3 px-4 font-normal">ID</th>
                    <th className="py-3 px-4 font-normal">Feed Name / Description</th>
                    <th className="py-3 px-4 font-normal">Feed Identifier</th>
                    <th className="py-3 px-4 font-normal">Heartbeat Window</th>
                    <th className="py-3 px-4 font-normal">Deviation Threshold</th>
                  </tr>
                </thead>
                <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-white/10">
                    <td className="py-2 px-4 font-mono">{r.id}</td>
                    <td className="py-2 px-4 font-mono">{r.name}</td>
                    <td className="py-2 px-4 font-mono">{formatFeedIdentifier(r.feed)}</td>
                    <td className="py-2 px-4 font-mono">{formatHeartbeat(r.constraintA)}</td>
                    <td className="py-2 px-4 font-mono">{formatPercent18(r.constraintB)}</td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

