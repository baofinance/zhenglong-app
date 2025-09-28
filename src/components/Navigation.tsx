"use client";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import CurrencySelect from "./CurrencySelect";
import { useCurrency } from "@/contexts/CurrencyContext";
import WalletButton from "./WalletButton";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function Example() {
  const { code, setCode, options } = useCurrency();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  const linkClass = (href: string) =>
    `rounded-md px-3 py-2 text-sm font-medium ${
      isActive(href)
        ? "text-white bg-white/5"
        : "text-gray-300 hover:bg-white/5 hover:text-white"
    }`;

  const optionsForSelect = options.map((o) => ({
    code: o.code,
    label: o.label,
    symbol: o.symbol,
  }));

  return (
    <Disclosure<"nav">
      as="nav"
      className="relative bg-[#111213] after:pointer-events-none max-w-7xl mx-auto after:absolute after:inset-x-0 after:bottom-0 after:h-px mb-6"
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="w-8 h-8 relative mr-4">
              <Image
                src="/logo.png"
                alt="Logo"
                fill
                className="object-contain invert"
                priority
              />
            </Link>
            <div className="hidden sm:block">
              <div className="flex space-x-2">
                <Link
                  href="/"
                  className={linkClass("/")}
                  aria-current={isActive("/") ? "page" : undefined}
                >
                  Dashboard
                </Link>
                {/* <Link
                  href="/"
                  className={linkClass("/")}
                  aria-current={isActive("/") ? "page" : undefined}
                >
                  Mint + Redeem
                </Link> */}
                <Link
                  href="/genesis"
                  className={linkClass("/genesis")}
                  aria-current={isActive("/genesis") ? "page" : undefined}
                >
                  Genesis
                </Link>
                <Link
                  href="/earn"
                  className={linkClass("/earn")}
                  aria-current={isActive("/earn") ? "page" : undefined}
                >
                  Earn
                </Link>
              </div>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:block">
            <div className="flex items-center gap-3">
              <CurrencySelect
                value={code}
                onValueChange={setCode}
                options={optionsForSelect}
              />
              <WalletButton />
            </div>
          </div>
          <div className="-mr-2 flex sm:hidden">
            {/* Mobile menu button */}
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-white/5 hover:text-white focus:outline-2 focus:-outline-offset-1 focus:outline-harbor">
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Open main menu</span>
              <Bars3Icon
                aria-hidden="true"
                className="block size-6 group-data-open:hidden"
              />
              <XMarkIcon
                aria-hidden="true"
                className="hidden size-6 group-data-open:block"
              />
            </DisclosureButton>
          </div>
        </div>
      </div>

      <DisclosurePanel className="sm:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1">
          <DisclosureButton
            as={Link}
            href="/dashboard"
            className={linkClass("/dashboard")}
            aria-current={isActive("/dashboard") ? "page" : undefined}
          >
            Dashboard
          </DisclosureButton>
          <DisclosureButton
            as={Link}
            href="/"
            className={linkClass("/")}
            aria-current={isActive("/") ? "page" : undefined}
          >
            Mint + Redeem
          </DisclosureButton>
          <DisclosureButton
            as={Link}
            href="/genesis"
            className={linkClass("/genesis")}
            aria-current={isActive("/genesis") ? "page" : undefined}
          >
            Genesis
          </DisclosureButton>
          <DisclosureButton
            as={Link}
            href="/earn"
            className={linkClass("/earn")}
            aria-current={isActive("/earn") ? "page" : undefined}
          >
            Earn
          </DisclosureButton>
        </div>
        <div className="border-t border-white/10 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <CurrencySelect
              value={code}
              onValueChange={setCode}
              options={optionsForSelect}
            />
            <WalletButton />
          </div>
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}
