"use client";

import React, { useState } from "react";
import { formatEther } from "viem";
import { useAdminAccess } from "../../../hooks/useAdminAccess";
import { useGenesisStatus } from "../../../hooks/useGenesisAdminStats";
import { useGenesisAdmin } from "../../../hooks/useAdminActions";

export function GenesisAdminPage() {
  const { isAdmin } = useAdminAccess();
  const { isActive, isEnded, totalCollateral, status } = useGenesisStatus();
  const { endGenesis, isPending, isSuccess } = useGenesisAdmin();

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-red-900/20 border border-red-500/30-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">
              Access Denied
            </h2>
            <p className="text-red-300">
              Only the Genesis owner can access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8 text-[#4A7C59]">
          Genesis Admin Panel
        </h1>

        {/* Status Overview */}
        <div className="bg-zinc-900/50/95 p-6 shadow-[0_0_15px_rgba(74,124,89,0.1)] mb-6">
          <h2 className="text-xl font-semibold mb-4 text-[#4A7C59]">
            Genesis Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-[#F5F5F5]/70">Status:</span>
              <span
                className={`ml-2 px-3 py-1 text-sm font-medium ${
                  status === "ACTIVE"
                    ? "bg-green-900/30 text-green-400 border border-green-500/30"
                    : "bg-red-900/30 text-red-400 border border-red-500/30"
                }`}
              >
                {status}
              </span>
            </div>
            <div>
              <span className="text-[#F5F5F5]/70">Total Collateral:</span>
              <span className="ml-2 font-mono text-[#4A7C59]">
                {formatEther(totalCollateral)} wstETH
              </span>
            </div>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="bg-zinc-900/50/95 p-6 shadow-[0_0_15px_rgba(74,124,89,0.1)] mb-6">
          <h2 className="text-xl font-semibold mb-4 text-[#4A7C59]">
            Admin Actions
          </h2>

          {isActive ? (
            <div>
              <p className="text-[#F5F5F5]/70 mb-4">
                Genesis is currently active. Users can deposit wstETH
                collateral. Once you're ready to end the genesis phase, click
                the button below.
              </p>
              <button
                onClick={endGenesis}
                disabled={isPending || totalCollateral === 0n}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3-lg font-medium transition-colors"
              >
                {isPending ? "Ending Genesis..." : "End Genesis Phase"}
              </button>
              {totalCollateral === 0n && (
                <p className="text-yellow-400 mt-2 text-sm">
                  ⚠️ No collateral has been deposited yet. Genesis cannot be
                  ended.
                </p>
              )}
            </div>
          ) : (
            <div className="text-green-400">
              <p>
                ✅ Genesis phase has ended. Users can now claim their tokens or
                withdraw collateral.
              </p>
            </div>
          )}

          {isSuccess && (
            <div className="mt-4 p-4 bg-green-900/30 border border-green-500/30 text-green-400-lg">
              🎉 Genesis phase ended successfully! Users can now claim their
              tokens.
            </div>
          )}
        </div>

        {/* Genesis Statistics */}
        <div className="bg-zinc-900/50/95 p-6 shadow-[0_0_15px_rgba(74,124,89,0.1)]">
          <h2 className="text-xl font-semibold mb-4 text-[#4A7C59]">
            Genesis Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-[#202020]-lg">
              <div className="text-2xl font-bold text-blue-400">
                {formatEther(totalCollateral)}
              </div>
              <div className="text-[#F5F5F5]/70">Total wstETH Deposited</div>
            </div>
            <div className="text-center p-4 bg-[#202020]-lg">
              <div className="text-2xl font-bold text-green-400">
                {totalCollateral > 0n ? formatEther(totalCollateral / 2n) : "0"}
              </div>
              <div className="text-[#F5F5F5]/70">
                Pegged Tokens to be Minted
              </div>
            </div>
            <div className="text-center p-4 bg-[#202020]-lg">
              <div className="text-2xl font-bold text-purple-400">
                {totalCollateral > 0n
                  ? formatEther(totalCollateral - totalCollateral / 2n)
                  : "0"}
              </div>
              <div className="text-[#F5F5F5]/70">
                Leveraged Tokens to be Minted
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
