"use client";

import React, { useMemo, useState } from "react";
import Head from "next/head";
import { useAccount } from "wagmi";
import { markets } from "../config/markets";
import MarketSelector from "@/components/MarketSelector";
import MintRedeemForm from "@/components/MintRedeemForm";
import HistoricalDataChart from "@/components/HistoricalDataChart";

type TokenType = "LONG" | "STEAMED";

export default function MintRedeemPage() {
  const { address, isConnected } = useAccount();
  const [selectedMarket, setSelectedMarket] = useState<string>("eth-usd");
  const [selectedType, setSelectedType] = useState<TokenType>("LONG");

  const currentMarket = useMemo(() => {
    const m = markets[selectedMarket as keyof typeof markets];
    return m ? { ...m, id: selectedMarket } : null;
  }, [selectedMarket]);

  const currentMarketInfo = useMemo(
    () => markets[selectedMarket as keyof typeof markets],
    [selectedMarket]
  );

  return (
    <>
      <Head>
        <title>Mint / Redeem</title>
        <meta name="description" content="Mint and Redeem tokens" />
      </Head>

      <div className="min-h-screen text-[#F5F5F5] max-w-[1300px] mx-auto font-sans relative">
        <main className="container mx-auto px-4 sm:px-10 pb-6">
          {/* Header */}
          <section className="mb-6">
            <div className="outline outline-1 outline-white/10 rounded-sm p-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:items-center justify-between">
                <h1 className="font-semibold font-mono text-white">
                  Mint / Redeem
                </h1>
                <div className="min-w-[260px]">
                  <MarketSelector
                    selectedMarketId={selectedMarket}
                    onMarketChange={setSelectedMarket}
                  />
                </div>
              </div>
              <p className="mt-2 text-white/60 text-sm">
                Use your collateral to mint or redeem pegged and leveraged
                tokens. Neutral, minimal, and fast.
              </p>
            </div>
          </section>

          {/* Content */}
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
              {/* Left: Form */}
              <div className="outline outline-1 outline-white/10 rounded-sm p-3 sm:p-4">
                <div className="flex mb-3 gap-4">
                  <button
                    onClick={() => setSelectedType("LONG")}
                    className={
                      selectedType === "LONG"
                        ? "text-white font-semibold"
                        : "text-white/60 hover:text-white"
                    }
                  >
                    Pegged
                  </button>
                  <button
                    onClick={() => setSelectedType("STEAMED")}
                    className={
                      selectedType === "STEAMED"
                        ? "text-white font-semibold"
                        : "text-white/60 hover:text-white"
                    }
                  >
                    Leveraged
                  </button>
                </div>
                {currentMarket ? (
                  <MintRedeemForm
                    currentMarket={currentMarket}
                    isConnected={isConnected}
                    userAddress={address}
                    marketInfo={currentMarketInfo}
                    selectedType={selectedType}
                  />
                ) : (
                  <div className="text-white/60 text-sm">Loading…</div>
                )}
              </div>

              {/* Right: Chart */}
              <div className="outline outline-1 outline-white/10 rounded-sm p-3 sm:p-4">
                {currentMarket ? (
                  <div className="h-[340px] sm:h-[420px]">
                    <HistoricalDataChart marketId={selectedMarket} />
                  </div>
                ) : (
                  <div className="text-white/60 text-sm">Loading chart…</div>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
