"use client";

import { MultiMarketGenesisAdmin } from "../../../components/MultiMarketGenesisAdmin";
import Navigation from "../../../components/Navigation";

export default function GenesisAdmin() {
  return (
    <div className="min-h-screen bg-black text-white max-w-[1500px] mx-auto">
      <Navigation />
      <MultiMarketGenesisAdmin />
    </div>
  );
}
