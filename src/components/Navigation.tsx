"use client";

import Link from "next/link";
import Image from "next/image";
import ConnectButton from "./ConnectButton";

export default function Navigation() {
  const navLinks = [
    { href: "/", label: "Mint & Redeem" },
    { href: "/earn", label: "Earn" },
    { href: "/vote", label: "Vote" },
    { href: "/genesis", label: "Genesis" },
    { href: "/staking", label: "Staking" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1A1A1A]/90 backdrop-blur-sm border-b border-white/10">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          {/* Left side: Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 flex items-center justify-center">
              <Image
                src="/logo.svg"
                alt="Zhenglong Protocol"
                width={28}
                height={28}
                className="w-full h-full"
              />
            </div>
            <span className="text-lg text-white font-geo tracking-wider">
              ZHENGLONG
            </span>
          </Link>

          {/* Center: Navigation Links */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-white/60 hover:text-white transition-colors relative group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white scale-x-0 group-hover:scale-x-100 transition-transform origin-center"></span>
                </Link>
              ))}
            </div>
          </div>

          {/* Right side: Connect Button */}
          <appkit-button size="sm" balance="hide" />
        </div>
      </div>
    </nav>
  );
}
