import { ethers } from "hardhat";

async function main() {
  console.log("Deploying MockPriceFeed...");

  const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
  const mockPriceFeed = await MockPriceFeed.deploy();

  await mockPriceFeed.waitForDeployment();
  const address = await mockPriceFeed.getAddress();

  console.log("MockPriceFeed deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
