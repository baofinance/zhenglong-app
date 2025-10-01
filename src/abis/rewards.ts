export const rewardsABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "getClaimableRewards",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "claimRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
