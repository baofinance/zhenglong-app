import { createPublicClient, http } from "viem";
import { localhost } from "viem/chains";
import { markets } from "../config/contracts";

const client = createPublicClient({
  chain: localhost,
  transport: http("http://127.0.0.1:8545"),
});

async function verifyContract(address: string, name: string) {
  try {
    const code = await client.getBytecode({
      address: address as `0x${string}`,
    });
    if (code === "0x") {
      console.error(`❌ ${name} (${address}) is not deployed`);
      return false;
    }
    console.log(`✅ ${name} (${address}) is deployed`);
    return true;
  } catch (error) {
    console.error(`❌ Error checking ${name} (${address}):`, error);
    return false;
  }
}

async function verifyAllContracts() {
  const market = markets["steth-usd"];
  const addresses = market.addresses;

  console.log("\nVerifying contract deployments on Anvil chain...\n");

  const results = await Promise.all([
    verifyContract(addresses.collateralToken, "Collateral Token"),
    verifyContract(addresses.feeReceiver, "Fee Receiver"),
    verifyContract(addresses.genesis, "Genesis"),
    verifyContract(addresses.leveragedToken, "Leveraged Token"),
    verifyContract(addresses.minter, "Minter"),
    verifyContract(addresses.owner, "Owner"),
    verifyContract(addresses.peggedToken, "Pegged Token"),
    verifyContract(addresses.priceOracle, "Price Oracle"),
    verifyContract(addresses.reservePool, "Reserve Pool"),
  ]);

  const allDeployed = results.every((result) => result);
  console.log("\nSummary:");
  console.log(
    allDeployed
      ? "✅ All contracts are deployed"
      : "❌ Some contracts are not deployed"
  );
}

verifyAllContracts().catch(console.error);
