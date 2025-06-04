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
            <div className="w-8 h-8 flex items-center justify-center">
              <Image
                src="/logo.svg"
                alt="Zhenglong Protocol"
                width={32}
                height={32}
                className="w-full h-full"
              />
            </div>
            <span
              className={`text-xl tracking-wider text-[#4A7C59] ${geo.className}`}
            >
              ZHENGLONG
            </span>
          </Link>

          {/* Center: Navigation Links */}
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-12">
              <Link
                href="/app"
                className={`text-xl text-white hover:text-white/80 transition-colors ${geo.className}`}
              >
                MINT/REDEEM
              </Link>
              <Link
                href="/earn"
                className={`text-xl text-white hover:text-white/80 transition-colors ${geo.className}`}
              >
                EARN
              </Link>
              <Link
                href="/vote"
                className={`text-xl text-white hover:text-white/80 transition-colors ${geo.className}`}
              >
                VOTE
              </Link>
              <Link
                href="/genesis"
                className={`text-xl text-white hover:text-white/80 transition-colors ${geo.className}`}
              >
                GENESIS
              </Link>
              <Link
                href="/staking"
                className={`text-xl text-white hover:text-white/80 transition-colors ${geo.className}`}
              >
                STAKING
              </Link>
            </div>
          </div>

          {/* Right side: Connect Button */}
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
}
