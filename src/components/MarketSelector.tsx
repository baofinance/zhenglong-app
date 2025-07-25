"use client";

import { useState, useRef, useEffect } from "react";
import { markets } from "../config/markets";

interface MarketSelectorProps {
  selectedMarketId: string;
  onMarketChange: (marketId: string) => void;
  geoClassName: string;
}

export default function MarketSelector({
  selectedMarketId,
  onMarketChange,
  geoClassName,
}: MarketSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const availableMarkets = Object.entries(markets).map(([id, market]) => ({
    id,
    ...market,
  }));
  const selectedMarket = markets[selectedMarketId as keyof typeof markets];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMarketSelect = (marketId: string) => {
    onMarketChange(marketId);
    setIsOpen(false);
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      live: "text-green-400 bg-green-400/10",
      genesis: "text-blue-400 bg-blue-400/10",
      coming_soon: "text-yellow-400 bg-yellow-400/10",
      archived: "text-gray-400 bg-gray-400/10",
    };

    return (
      <span
        className={`text-xs px-2 py-1 ${
          statusStyles[status as keyof typeof statusStyles] ||
          statusStyles.archived
        }`}
      >
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-4">
        <label className="text-[#F5F5F5]/70">Market</label>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`px-4 py-2 bg-[#202020] text-[#F5F5F5] border border-[#4A7C59]/30 hover:border-[#4A7C59] hover:bg-[#2A2A2A] outline-none transition-all text-left w-[200px] shadow-md font-medium ${geoClassName} flex items-center justify-between`}
        >
          <span>{selectedMarket?.name || "Select Market"}</span>
          <svg
            className={`w-4 h-4 text-[#4A7C59] transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[300px] bg-[#1A1A1A] border border-[#4A7C59]/30 shadow-xl z-[60] max-h-64 overflow-y-auto">
          <div className="p-2">
            {availableMarkets.length === 0 ? (
              <div className="p-4 text-center text-[#F5F5F5]/50">
                No markets available
              </div>
            ) : (
              availableMarkets.map((market) => (
                <button
                  key={market.id}
                  onClick={() => handleMarketSelect(market.id)}
                  className={`w-full p-3 text-left hover:bg-[#2A2A2A] transition-colors ${
                    selectedMarketId === market.id
                      ? "bg-[#4A7C59]/20 border border-[#4A7C59]/30"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-medium text-base ${geoClassName}`}>
                      {market.name}
                    </span>
                    {getStatusBadge(market.status)}
                  </div>
                  <div className="text-sm text-[#F5F5F5]/60">
                    <div className="flex items-center gap-2">
                      <span className="text-[#4A7C59]">wstETH</span>
                      <span>•</span>
                      <span>{market.peggedToken.name}</span>
                      <span>•</span>
                      <span>{market.leveragedToken.name}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
