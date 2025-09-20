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

export default function Example() {
  const { code, setCode, options } = useCurrency();
  return (
    <Disclosure<"nav">
      as="nav"
      className="relative bg-[#111213] after:pointer-events-none max-w-7xl mx-auto after:absolute after:inset-x-0 after:bottom-0 after:h-px mb-6"
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <div className="shrink-0">
              <div className="h-8 w-8 bg-indigo-600 " />
            </div>
            <div className="hidden sm:ml-4 sm:block">
              <div className="flex space-x-2">
                <a
                  href="/dashboard"
                  className="rounded-md px-3 py-2 text-sm font-medium text-white"
                >
                  Dashboard
                </a>
                <a
                  href="/"
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white"
                >
                  Mint + Redeem
                </a>
                <a
                  href="/genesis"
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white"
                >
                  Genesis
                </a>
                <a
                  href="/earn"
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white"
                >
                  Earn
                </a>
              </div>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:block">
            <div className="flex items-center gap-3">
              <CurrencySelect
                value={code}
                onValueChange={setCode}
                options={options as any}
              />
              <WalletButton />
            </div>
          </div>
          <div className="-mr-2 flex sm:hidden">
            {/* Mobile menu button */}
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-white/5 hover:text-white focus:outline-2 focus:-outline-offset-1 focus:outline-indigo-500">
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
            as="a"
            href="/dashboard"
            className="block rounded-md px-3 py-2 text-base font-medium text-white hover:bg-white/5"
          >
            Dashboard
          </DisclosureButton>
          <DisclosureButton
            as="a"
            href="/"
            className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white"
          >
            Mint + Redeem
          </DisclosureButton>
          <DisclosureButton
            as="a"
            href="/genesis"
            className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white"
          >
            Genesis
          </DisclosureButton>
          <DisclosureButton
            as="a"
            href="/earn"
            className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white"
          >
            Earn
          </DisclosureButton>
        </div>
        <div className="border-t border-white/10 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <CurrencySelect
              value={code}
              onValueChange={setCode}
              options={options as any}
            />
            <WalletButton />
          </div>
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}
