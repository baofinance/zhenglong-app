export const votingABI = [
  {
    inputs: [{ name: "user", type: "address" }],
    name: "totalPower",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "usedPower",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "collateralWeight",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "leveragedWeight",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "collateralWeight", type: "uint256" },
      { name: "leveragedWeight", type: "uint256" }
    ],
    name: "vote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  }
] as const; 