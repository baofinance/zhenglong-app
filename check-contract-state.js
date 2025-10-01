const { createPublicClient, http } = require("viem");
const { anvil } = require("viem/chains");

// New contract addresses
const addresses = {
  Genesis: "0x49c58c6BE0680Eb756595c0F59ab3E0b6e1624cd",
  Minter: "0xE41bBcf8ec773B477735b0b0D8bF6E7Ca6BDe9Ee",
  ReservePool: "0x289BD64Deb826c134dA670f8B759FB4CA018dF4B",
  StabilityPoolManager: "0xeC67cF0755c0A5aaD6C4A4235fDfA35c1EFEA6A9",
  FeeReceiver: "0x3A5fBC501c5D515383fADFf5ebD92C393f5eFee9",
  PeggedToken: "0x6c7Df3575f1d69eb3B245A082937794794C2b82E",
  LeveragedToken: "0x74ef79CFC735A10436eF9D4808547df0Ce38f788",
  STEAM: "0x5f9dD176ea5282d392225ceC5c2E7A24d5d02672",
  veSTEAM: "0x819F9213cE51Adac4C1c2EF7D4Cba563727C1206",
  PriceOracle: "0x2C834EFcDd2E9D04C1a34367BA9D8aa587F90fBe",
  StabilityPoolCollateral: "0x0659A97068958Ebaba97121A6D7a2a95924824Ea",
  StabilityPoolSteamed: "0xd3873FDF150b3fFFb447d3701DFD234DF452f367",
  // Standard tokens
  WSTETH: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
  STETH: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
};

const genesisABI = [
  {
    inputs: [],
    name: "genesisIsEnded",
    outputs: [{ type: "bool", name: "ended" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ type: "address", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "collateralToken",
    outputs: [{ type: "address", name: "token" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalDeposits",
    outputs: [{ type: "uint256", name: "total" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "collateralIn", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const erc20ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ type: "string" }],
    stateMutability: "view",
    type: "function",
  },
];

const client = createPublicClient({
  chain: anvil,
  transport: http("http://127.0.0.1:8545"),
});

async function checkContractState() {
  console.log("🔍 Checking contract state...\n");

  try {
    // Check Genesis contract
    console.log("📊 Genesis Contract Status:");
    console.log("Address:", addresses.Genesis);

    try {
      const genesisEnded = await client.readContract({
        address: addresses.Genesis,
        abi: genesisABI,
        functionName: "genesisIsEnded",
      });
      console.log("Genesis Ended:", genesisEnded);
    } catch (err) {
      console.log("❌ Error reading genesisIsEnded:", err.message);
    }

    try {
      const owner = await client.readContract({
        address: addresses.Genesis,
        abi: genesisABI,
        functionName: "owner",
      });
      console.log("Owner:", owner);
    } catch (err) {
      console.log("❌ Error reading owner:", err.message);
    }

    try {
      const collateralToken = await client.readContract({
        address: addresses.Genesis,
        abi: genesisABI,
        functionName: "collateralToken",
      });
      console.log("Collateral Token:", collateralToken);
    } catch (err) {
      console.log("❌ Error reading collateralToken:", err.message);
    }

    try {
      const totalDeposits = await client.readContract({
        address: addresses.Genesis,
        abi: genesisABI,
        functionName: "totalDeposits",
      });
      console.log("Total Deposits:", totalDeposits.toString());
    } catch (err) {
      console.log("❌ Error reading totalDeposits:", err.message);
    }

    console.log("\n💰 Token Balances:");

    // Check WSTETH
    try {
      const wstethSymbol = await client.readContract({
        address: addresses.WSTETH,
        abi: erc20ABI,
        functionName: "symbol",
      });
      console.log("WSTETH Symbol:", wstethSymbol);
    } catch (err) {
      console.log("❌ Error reading WSTETH symbol:", err.message);
    }

    // Check if Genesis has any WSTETH balance
    try {
      const genesisWstethBalance = await client.readContract({
        address: addresses.WSTETH,
        abi: erc20ABI,
        functionName: "balanceOf",
        args: [addresses.Genesis],
      });
      console.log("Genesis WSTETH Balance:", genesisWstethBalance.toString());
    } catch (err) {
      console.log("❌ Error reading Genesis WSTETH balance:", err.message);
    }

    // Test contract exists
    console.log("\n🔧 Contract Existence Tests:");
    const bytecode = await client.getBytecode({
      address: addresses.Genesis,
    });
    console.log(
      "Genesis contract bytecode length:",
      bytecode ? bytecode.length : 0
    );

    if (!bytecode || bytecode === "0x") {
      console.log(
        "❌ Genesis contract has no bytecode! Contract may not be deployed."
      );
    } else {
      console.log("✅ Genesis contract exists and has bytecode");
    }

    // Test a simple deposit simulation (dry run)
    console.log("\n🧪 Testing Deposit Function:");
    try {
      const testAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Common test address
      const testAmount = BigInt("1000000000000000000"); // 1 ETH

      await client.simulateContract({
        address: addresses.Genesis,
        abi: genesisABI,
        functionName: "deposit",
        args: [testAmount, testAddress],
      });
      console.log("✅ Deposit function simulation passed");
    } catch (err) {
      console.log("❌ Deposit function simulation failed:", err.message);
      console.log(
        "Details:",
        err.details || err.cause || "No additional details"
      );
    }
  } catch (error) {
    console.error("❌ Error checking contract state:", error);
  }
}

checkContractState().catch(console.error);
