"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Geo } from "next/font/google";

const geo = Geo({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

console.log("[DEBUG] MintRedeem file loaded - SIMPLIFIED");

export default function MintRedeem() {
  console.log("[DEBUG] MintRedeem function executing - SIMPLIFIED");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.log("[DEBUG] MintRedeem effect running - SIMPLIFIED");
    setMounted(true);
  }, []);

  console.log("[DEBUG] MintRedeem rendering - SIMPLIFIED");

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A1A1A] to-black text-[#F5F5F5] font-sans relative">
      {/* Steam Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Large base squares */}
        <div className="absolute top-[10%] left-[20%] w-[200px] h-[200px] bg-[#4A7C59]/[0.06]"></div>
        <div className="absolute top-[15%] left-[35%] w-[180px] h-[180px] bg-[#4A7C59]/[0.05]"></div>
        <div className="absolute top-[20%] left-[50%] w-[160px] h-[160px] bg-[#4A7C59]/[0.07]"></div>

        {/* Medium squares - Layer 1 */}
        <div className="absolute top-[30%] left-[15%] w-[150px] h-[150px] bg-[#4A7C59]/[0.04] animate-float-1"></div>
        <div className="absolute top-[35%] left-[30%] w-[140px] h-[140px] bg-[#4A7C59]/[0.045] animate-float-2"></div>
        <div className="absolute top-[40%] left-[45%] w-[130px] h-[130px] bg-[#4A7C59]/[0.055] animate-float-3"></div>

        {/* Medium squares - Layer 2 */}
        <div className="absolute top-[50%] left-[25%] w-[120px] h-[120px] bg-[#4A7C59]/[0.065] animate-float-4"></div>
        <div className="absolute top-[55%] left-[40%] w-[110px] h-[110px] bg-[#4A7C59]/[0.05] animate-float-1"></div>
        <div className="absolute top-[60%] left-[55%] w-[100px] h-[100px] bg-[#4A7C59]/[0.06] animate-float-2"></div>

        {/* Small squares */}
        <div className="absolute top-[70%] left-[20%] w-[80px] h-[80px] bg-[#4A7C59]/[0.075] animate-steam-1"></div>
        <div className="absolute top-[75%] left-[35%] w-[70px] h-[70px] bg-[#4A7C59]/[0.07] animate-steam-2"></div>
        <div className="absolute top-[80%] left-[50%] w-[60px] h-[60px] bg-[#4A7C59]/[0.08] animate-steam-3"></div>
        <div className="absolute top-[85%] left-[65%] w-[50px] h-[50px] bg-[#4A7C59]/[0.065] animate-steam-1"></div>
        <div className="absolute top-[90%] left-[80%] w-[40px] h-[40px] bg-[#4A7C59]/[0.075] animate-steam-2"></div>
        <div className="absolute top-[95%] left-[95%] w-[30px] h-[30px] bg-[#4A7C59]/[0.07] animate-steam-3"></div>
      </div>

      <Navigation />

      <main className="container mx-auto px-6 pt-32 pb-20 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={`text-4xl text-[#4A7C59] ${geo.className}`}>
            MINT & REDEEM
          </h1>
          <p className="text-[#F5F5F5]/60 text-lg mt-4">
            Mint or redeem pegged and leverage tokens from any market
          </p>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          <p className="text-[#F5F5F5]">Mounted: {mounted.toString()}</p>
          {/* Additional content will go here */}
        </div>
      </main>
    </div>
  );
}
