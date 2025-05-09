"use client";

import Link from "next/link";
import Image from "next/image";
import { Geo } from "next/font/google";
import ConnectButton from "./ConnectButton";

const geo = Geo({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export default function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1A1A1A]/90 backdrop-blur-sm border-b border-[#4A7C59]/20">
      <div className="container mx-auto px-6">
        <div className="flex items-center h-20">
          {/* Left side: Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-20 h-18 flex items-center justify-center">
              <Image
                src="/logo.svg"
                alt="Zhenglong Protocol"
                width={80}
                height={70}
                className="w-full h-full"
              />
            </div>
            <span
              className={`text-3xl tracking-wider text-[#4A7C59] ${geo.className}`}
            >
              zhenglong
            </span>
          </Link>

          {/* Center: Navigation Links */}
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-12">
              <span
                className={`text-xl text-white/50 cursor-not-allowed transition-colors ${geo.className} relative group`}
                title="Coming Soon"
              >
                Mint/Redeem
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Coming Soon
                </span>
              </span>
              <span
                className={`text-xl text-white/50 cursor-not-allowed transition-colors ${geo.className} relative group`}
                title="Coming Soon"
              >
                Earn
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Coming Soon
                </span>
              </span>
              <span
                className={`text-xl text-white/50 cursor-not-allowed transition-colors ${geo.className} relative group`}
                title="Coming Soon"
              >
                Vote
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Coming Soon
                </span>
              </span>
              <span
                className={`text-xl text-white/50 cursor-not-allowed transition-colors ${geo.className} relative group`}
                title="Coming Soon"
              >
                Genesis
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Coming Soon
                </span>
              </span>
              <span
                className={`text-xl text-white/50 cursor-not-allowed transition-colors ${geo.className} relative group`}
                title="Coming Soon"
              >
                Staking
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Coming Soon
                </span>
              </span>
            </div>
          </div>

          {/* Right side: Connect Button */}
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
}
