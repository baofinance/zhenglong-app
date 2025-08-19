"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export default function Navigation() {
  const navLinks = [
    { href: "/", label: "Mint & Redeem" },
    { href: "/earn", label: "Earn" },
    { href: "/staking", label: "Staking" },
    { href: "https://snapshot.box", label: "Vote" },
    { href: "/genesis", label: "Genesis" },
  ];

  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 mx-auto max-w-[1300px] font-sans">
      <div className="px-6">
        <div className="flex items-center justify-between h-16 border-b border-white/10">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center">
                <Image
                  src="/logo.svg"
                  alt="Zhenglong Protocol"
                  width={28}
                  height={28}
                  className="w-full h-full"
                />
              </div>
            </Link>

            <div className="flex items-center gap-4">
              {navLinks.map((link) => {
                const isActive =
                  link.href === pathname ||
                  (link.href !== "/" && pathname.startsWith(link.href));

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={clsx(
                      "text-base font-medium transition-colors",
                      isActive
                        ? " text-white"
                        : " hover:text-white/80 text-white/60 "
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div>
            <appkit-button size="sm" balance="hide" />
          </div>
        </div>
      </div>
    </nav>
  );
}
