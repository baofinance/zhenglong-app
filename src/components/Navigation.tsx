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

export default function Example() {
  return (
    <Disclosure<"nav">
      as="nav"
      className="relative bg-zinc-950 after:pointer-events-none max-w-7xl mx-auto after:absolute after:inset-x-0 after:bottom-0 after:h-px  mb-6"
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <div className="shrink-0 flex items-center">
              <img
                alt="Harbor"
                src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
                className="h-6 my-auto w-auto font-medium mr-2"
              />
              <a
                href="/dashboard"
                className="rounded-md bg-gray-950/50 py-2 text-base font-mono font-bold text-white"
              >
                Harbor
              </a>
            </div>
            <div className="hidden sm:ml-4 sm:block">
              <div className="flex">
                <a
                  href="/dashboard"
                  className="rounded-md bg-gray-950/50 px-3 py-2 text-sm font-medium font-mono text-white"
                >
                  Dashboard
                </a>
                <a
                  href="/"
                  className="rounded-md px-3 py-2 text-sm font-medium font-mono text-gray-400 hover:bg-white/5 hover:text-white"
                >
                  Mint + Redeem
                </a>
                <a
                  href="/genesis"
                  className="rounded-md px-3 py-2 text-sm font-medium font-mono text-gray-400 hover:bg-white/5 hover:text-white"
                >
                  Genesis
                </a>
                <a
                  href="/earn"
                  className="rounded-md px-3 py-2 text-sm font-medium font-mono text-gray-400 hover:bg-white/5 hover:text-white"
                >
                  Earn
                </a>
              </div>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:block">
            <div className="flex items-center">
              <appkit-account-button balance="hide" />
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
        <div className="space-y-1 px-2 pt-2 pb-3">
          {/* Current: "bg-gray-950/50 text-white", Default: "text-gray-300 hover:bg-white/5 hover:text-white" */}
          <DisclosureButton
            as="a"
            href="#"
            className="block rounded-md bg-gray-950/50 px-3 py-2 text-base font-medium text-white"
          >
            Dashboard
          </DisclosureButton>
          <DisclosureButton
            as="a"
            href="#"
            className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white"
          >
            Team
          </DisclosureButton>
          <DisclosureButton
            as="a"
            href="#"
            className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white"
          >
            Projects
          </DisclosureButton>
          <DisclosureButton
            as="a"
            href="#"
            className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white"
          >
            Calendar
          </DisclosureButton>
        </div>
        <div className="border-t border-white/10 pt-4 pb-3">
          <div className="flex items-center px-5">
            <div className="shrink-0">
              <img
                alt=""
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                className="size-10 rounded-full bg-gray-800 outline -outline-offset-1 outline-white/10"
              />
            </div>
            <div className="ml-3">
              <div className="text-base font-medium text-white">Tom Cook</div>
              <div className="text-sm font-medium text-gray-400">
                tom@example.com
              </div>
            </div>
            <button
              type="button"
              className="relative ml-auto shrink-0 rounded-full p-1 text-gray-400 hover:text-white focus:outline-2 focus:outline-offset-2 focus:outline-indigo-500"
            >
              <span className="absolute -inset-1.5" />
              <span className="sr-only">View notifications</span>
              <BellIcon aria-hidden="true" className="size-6" />
            </button>
          </div>
          <div className="mt-3 space-y-1 px-2">
            <DisclosureButton
              as="a"
              href="#"
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-white/5 hover:text-white"
            >
              Your profile
            </DisclosureButton>
            <DisclosureButton
              as="a"
              href="#"
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-white/5 hover:text-white"
            >
              Settings
            </DisclosureButton>
            <DisclosureButton
              as="a"
              href="#"
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-white/5 hover:text-white"
            >
              Sign out
            </DisclosureButton>
          </div>
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}
