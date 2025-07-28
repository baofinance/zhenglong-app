"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const navLinks = [
    {
      label: "App",
      subLinks: [
        { href: "/", label: "Mint & Redeem" },
        { href: "/earn", label: "Earn" },
        { href: "/staking", label: "Staking" },
      ],
    },
    { href: "/vote", label: "Vote" },
    { href: "/genesis", label: "Genesis" },
  ];

  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-screen">
      <div className="px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left side: Logo */}
          <div className="flex gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-6 h-6 flex items-center justify-center">
                <Image
                  src="/logo.svg"
                  alt="Zhenglong Protocol"
                  width={28}
                  height={28}
                  className="w-full h-full"
                />
              </div>
              <span className="text-md text-[#4A7C59] tracking-wider font-semibold">
                Zhenglong
              </span>
            </Link>

            {/* Center: Navigation Links */}
            <div className="">
              <div className="flex gap-8">
                {navLinks.map((link) => {
                  const isActive = link.subLinks
                    ? link.subLinks.some(
                        (sub) =>
                          sub.href === pathname ||
                          (sub.href !== "/" && pathname.startsWith(sub.href))
                      )
                    : link.href === pathname;

                  const linkClasses = `text-md font-semibold transition-colors relative group ${
                    isActive ? "text-white" : "text-white/60"
                  } hover:text-white`;

                  if (link.subLinks) {
                    return (
                      <div key={link.label} className="relative group">
                        <div
                          className={`flex items-center cursor-pointer ${linkClasses}`}
                        >
                          {link.label}
                          <svg
                            className="w-4 h-4 ml-1 transition-transform group-hover:rotate-180"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            ></path>
                          </svg>
                          <span
                            className={`absolute -bottom-2 left-0 w-full h-0.5 transition-transform origin-left duration-300 ${
                              isActive
                                ? "scale-x-100 bg-white"
                                : "scale-x-0 bg-white/20 group-hover:scale-x-100"
                            }`}
                          ></span>
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-max opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-1 invisible group-hover:visible">
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-neutral-900 transform rotate-45 border-l border-t border-white/10"></div>
                          <div className="bg-neutral-900 border border-white/10 rounded-lg shadow-2xl">
                            <div className="p-2">
                              {link.subLinks.map((subLink) => {
                                const isSublinkActive =
                                  subLink.href === pathname ||
                                  (subLink.href !== "/" &&
                                    pathname.startsWith(subLink.href));
                                return (
                                  <Link
                                    key={subLink.href}
                                    href={subLink.href}
                                    className={`block text-nowrap bg-white/5 px-4 py-4 text-sm rounded-md text-semibold transition-colors mb-2 ${
                                      isSublinkActive
                                        ? "text-white bg-white/10"
                                        : "text-white/60 hover:bg-white/5 hover:text-white"
                                    }`}
                                  >
                                    {subLink.label}
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={linkClasses}
                    >
                      {link.label}
                      <span
                        className={`absolute -bottom-2 left-0 w-full h-0.5 transition-transform origin-left duration-300 ${
                          isActive
                            ? "scale-x-100 bg-white"
                            : "scale-x-0 bg-white/20 group-hover:scale-x-100"
                        }`}
                      ></span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right side: Connect Button */}
          <appkit-button size="sm" balance="hide" />
        </div>
      </div>
    </nav>
  );
}
