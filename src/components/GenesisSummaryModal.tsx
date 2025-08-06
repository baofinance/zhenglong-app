"use client";

import { Geo } from "next/font/google";

const geo = Geo({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

interface GenesisSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  marketName: string;
}

export default function GenesisSummaryModal({
  isOpen,
  onClose,
  marketName,
}: GenesisSummaryModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900/50 border border-[#4A7C59]/20 max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <h2
            className={`text-xl font-medium text-[#F5F5F5] mb-2 ${geo.className}`}
          >
            Genesis Summary
          </h2>
        </div>

        <div className="text-sm text-zinc-300 space-y-3">
          <p>
            <span className="text-white font-medium">Genesis ended.</span>{" "}
            Collateral was split 50/50:
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
              <span className="text-blue-400 font-medium">ZHE</span>
              <span className="text-zinc-400">
                - Tracks {marketName} price feed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
              <span className="text-purple-400 font-medium">STEAMED</span>
              <span className="text-zinc-400">
                - Leveraged collateral vs feed
              </span>
            </div>
          </div>
          <p>
            Both tokens are now{" "}
            <span className="text-white font-medium">fully functional</span> and
            tradeable.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 font-medium transition-colors bg-[#4A7C59] hover:bg-[#3A6147] text-white"
        >
          Close
        </button>
      </div>
    </div>
  );
}
