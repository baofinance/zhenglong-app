"use client";

import { useState, useEffect } from "react";

console.log("[DEBUG] MintRedeem file loaded - SIMPLIFIED");

export default function MintRedeem() {
  console.log("[DEBUG] MintRedeem function executing - SIMPLIFIED");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.log("[DEBUG] MintRedeem effect running - SIMPLIFIED");
    setMounted(true);
  }, []);

  console.log("[DEBUG] MintRedeem rendering - SIMPLIFIED");

  return (
    <div>
      <h1>MintRedeem Page</h1>
      <p>Mounted: {mounted.toString()}</p>
    </div>
  );
}
