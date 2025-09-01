"use client";

import { Fragment, ReactNode, useMemo, useState } from "react";
import Image from "next/image";
import GenesisAPRCalculator from "./GenesisAPRCalculator";
import { markets } from "@/config/markets";

type MarketOption = {
  id: string;
  name: string;
  chainLogo: string;
  rewardTokenSymbol: string;
  rewardPoolAmount: number;
  collateralSymbol: string | undefined;
};

type GenesisMarketDropdownProps = {
  trigger: ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (marketId: string) => void;
  // On-chain fetched data, indexed by marketId
  totalDepositsByMarket?: Record<string, bigint | undefined>;
};

export default function GenesisMarketDropdown({
  trigger,
  isOpen,
  onOpenChange,
  onSelect,
  totalDepositsByMarket,
}: GenesisMarketDropdownProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const options: MarketOption[] = useMemo(() => {
    return Object.entries(markets).map(([id, m]) => ({
      id,
      name: m.name,
      chainLogo: m.chain.logo,
      rewardTokenSymbol: m.rewardToken.symbol,
      rewardPoolAmount: Number(m.rewardToken.amount),
      collateralSymbol: undefined, // populated by parent if needed
    }));
  }, []);

  return (
    <div className="relative">
      <div onClick={() => onOpenChange(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      {isOpen && (
        <div className="absolute right-0 z-30 mt-2 w-[680px] max-w-[90vw] bg-neutral-900/95 outline outline-1 outline-white/10 shadow-xl">
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {options.map((opt) => (
              <Fragment key={opt.id}>
                <button
                  onClick={() => onSelect(opt.id)}
                  onMouseEnter={() => setHovered(opt.id)}
                  onMouseLeave={() => setHovered(null)}
                  className="text-left group"
                >
                  <div className="rounded-md bg-zinc-900/60 outline outline-1 outline-white/10 p-4 transition-colors group-hover:bg-zinc-800/60">
                    <div className="flex items-center gap-3 mb-3">
                      <Image
                        src={opt.chainLogo}
                        alt={opt.name}
                        width={24}
                        height={24}
                        className="w-6 h-6"
                      />
                      <div className="text-white font-medium">{opt.name}</div>
                    </div>
                    <GenesisAPRCalculator
                      marketId={opt.id}
                      rewardTokenSymbol={opt.rewardTokenSymbol}
                      rewardPoolAmount={opt.rewardPoolAmount}
                      totalDeposits={totalDepositsByMarket?.[opt.id]}
                      collateralSymbol={opt.collateralSymbol ?? "COLL"}
                    />
                  </div>
                </button>
              </Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
