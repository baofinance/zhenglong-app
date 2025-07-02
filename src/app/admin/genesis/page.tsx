"use client";

import { GenesisAdminPage } from "./GenesisAdmin";
import Navigation from "../../../components/Navigation";

export default function GenesisAdmin() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      <GenesisAdminPage />
    </div>
  );
}
