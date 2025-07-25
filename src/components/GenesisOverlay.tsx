import { ReactNode } from "react";
import Link from "next/link";

interface GenesisOverlayProps {
  children: ReactNode;
  className?: string;
  marketName?: string;
  isActive?: boolean;
  geoClassName?: string;
}

export default function GenesisOverlay({
  children,
  className = "",
  marketName = "this market",
  isActive = false,
  geoClassName = "",
}: GenesisOverlayProps) {
  return (
    <div className={`relative ${className}`}>
      {children}
      {isActive && (
        <div className="absolute inset-0 z-50 bg-black/15 flex items-center justify-center cursor-not-allowed backdrop-blur-sm pointer-events-auto">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-md py-6 border-y border-[#4A7C59]/20 pointer-events-auto">
            <div className="text-center space-y-4 max-w-md mx-auto px-8">
              <div
                className={`text-[#4A7C59] font-bold text-4xl tracking-wider ${geoClassName}`}
              >
                Genesis Active
              </div>
              <div className="text-white/80 text-sm max-w-xs mx-auto">
                {marketName} is currently in genesis period. Mint/redeem
                functions will be available after genesis ends.
              </div>
              <Link
                href="/genesis"
                className={`inline-block px-4 py-2 bg-[#4A7C59] hover:bg-[#3A6147] text-white text-sm font-medium transition-colors pointer-events-auto ${geoClassName}`}
              >
                Genesis Page
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
