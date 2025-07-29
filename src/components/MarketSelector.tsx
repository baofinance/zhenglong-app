"use client";

import { useState, useRef, useEffect } from "react";
import { markets } from "../config/markets";

interface MarketSelectorProps {
  selectedMarketId: string;
  onMarketChange: (marketId: string) => void;
}

export default function MarketSelector({
  selectedMarketId,
  onMarketChange,
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
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-neutral-800 text-white rounded-full h-12 w-48 flex items-center justify-between px-4 hover:bg-neutral-700 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-400 hover:scale-105 focus:scale-105"
        >
          <span>{selectedMarket?.name || "Select Market"}</span>
          <svg
            className={`w-4 h-4 text-green-400 transition-transform ${
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
      <div
        className={`absolute z-10 mt-2 w-[300px] origin-top-left left-0 rounded-md bg-neutral-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none transition-all duration-300 ease-in-out ${
          isOpen
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="p-1 max-h-64 overflow-y-auto">
          {availableMarkets.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              No markets available
            </div>
          ) : (
            availableMarkets.map((market) => (
              <button
                key={market.id}
                onClick={() => handleMarketSelect(market.id)}
                className="w-full p-3 text-left hover:bg-neutral-700 transition-colors rounded-xl flex justify-between items-start"
              >
                <div className="text-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-base">{market.name}</span>
                    {getStatusBadge(market.status)}
                  </div>
                  <div className="text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <span>wstETH</span>
                      <span>•</span>
                      <span>{market.peggedToken.name}</span>
                      <span>•</span>
                      <span>{market.leveragedToken.name}</span>
                    </div>
                  </div>
                </div>

                {selectedMarketId === market.id && (
                  <svg
                    className="w-5 h-5 text-green-400 ml-4 flex-shrink-0 mt-1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
