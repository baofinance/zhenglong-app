import { ethers } from "hardhat";

async function main() {
  console.log("Updating price in MockPriceFeed...");

  const mockPriceFeedAddress = "0x97541208c6C8ecfbe57B8A44ba86f2A88bA783e2";
  const mockPriceFeedABI = [
    {
      inputs: [],
      name: "updatePrice",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ];

  const MockPriceFeed = await ethers.getContractAt(
    mockPriceFeedABI,
    mockPriceFeedAddress
  );
  const tx = await MockPriceFeed.updatePrice();
  await tx.wait();

  console.log("Price updated successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
