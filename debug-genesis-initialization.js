const { createPublicClient, http } = require("viem");
const { anvil } = require("viem/chains");

// New contract addresses
const addresses = {
  Genesis: "0x49c58c6BE0680Eb756595c0F59ab3E0b6e1624cd",
  Minter: "0xE41bBcf8ec773B477735b0b0D8bF6E7Ca6BDe9Ee",
  PeggedToken: "0x6c7Df3575f1d69eb3B245A082937794794C2b82E",
  LeveragedToken: "0x74ef79CFC735A10436eF9D4808547df0Ce38f788",
  WSTETH: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
  privilegedAddress: "0xAE7Dbb17bc40D53A6363409c6B1ED88d3cFdc31e",
};

// Minimal ABI for basic initialization functions
const genesisABI = [
  {
    inputs: [],
    name: "owner",
    outputs: [{ type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "genesisIsEnded",
    outputs: [{ type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  // Try common initialization function signatures
  {
    inputs: [
      { name: "collateralToken_", type: "address" },
      { name: "peggedToken_", type: "address" },
      { name: "leveragedToken_", type: "address" },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "collateralToken_", type: "address" },
      { name: "peggedToken_", type: "address" },
      { name: "leveragedToken_", type: "address" },
      { name: "minter_", type: "address" },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Alternative initialize signature
  {
    inputs: [
      {
        name: "config",
        type: "tuple",
        components: [
          { name: "collateralToken", type: "address" },
          { name: "peggedToken", type: "address" },
          { name: "leveragedToken", type: "address" },
          { name: "minter", type: "address" },
        ],
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Common storage getter functions
  {
    inputs: [],
    name: "collateralToken",
    outputs: [{ type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "peggedToken",
    outputs: [{ type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "leveragedToken",
    outputs: [{ type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "minter",
    outputs: [{ type: "address" }],
    stateMutability: "view",
    type: "function",
  },
];

const client = createPublicClient({
  chain: anvil,
  transport: http("http://127.0.0.1:8545"),
});

async function checkInitialization() {
  console.log("🔍 Checking Genesis contract initialization status...\n");

  try {
    console.log("📊 Basic Contract Info:");
    console.log("Genesis Address:", addresses.Genesis);
    console.log("Expected Owner:", addresses.privilegedAddress);

    // Check ownership
    try {
      const owner = await client.readContract({
        address: addresses.Genesis,
        abi: genesisABI,
        functionName: "owner",
      });
      console.log("Current Owner:", owner);
      console.log(
        "Owner Match:",
        owner.toLowerCase() === addresses.privilegedAddress.toLowerCase()
      );
    } catch (err) {
      console.log("❌ Error reading owner:", err.message);
    }

    // Check if genesis is ended
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

    console.log("\n🔧 Checking Token Configurations:");

    // Check if token addresses are configured
    const tokenChecks = [
      { name: "collateralToken", expected: addresses.WSTETH },
      { name: "peggedToken", expected: addresses.PeggedToken },
      { name: "leveragedToken", expected: addresses.LeveragedToken },
      { name: "minter", expected: addresses.Minter },
    ];

    let needsInitialization = false;

    for (const check of tokenChecks) {
      try {
        const result = await client.readContract({
          address: addresses.Genesis,
          abi: genesisABI,
          functionName: check.name,
        });

        if (
          result === "0x0000000000000000000000000000000000000000" ||
          !result
        ) {
          console.log(`❌ ${check.name}: NOT CONFIGURED (${result})`);
          needsInitialization = true;
        } else {
          console.log(`✅ ${check.name}: ${result}`);
          if (
            check.expected &&
            result.toLowerCase() !== check.expected.toLowerCase()
          ) {
            console.log(`⚠️  Expected: ${check.expected}`);
          }
        }
      } catch (err) {
        console.log(
          `❌ ${check.name}: Function not found or error - ${err.message}`
        );
        needsInitialization = true;
      }
    }

    if (needsInitialization) {
      console.log("\n🚨 DIAGNOSIS: Genesis contract needs initialization!");
      console.log("\n💡 SOLUTION: Run the following initialization command:");
      console.log("\n📋 Initialization Parameters:");
      console.log("- Collateral Token:", addresses.WSTETH);
      console.log("- Pegged Token:", addresses.PeggedToken);
      console.log("- Leveraged Token:", addresses.LeveragedToken);
      console.log("- Minter:", addresses.Minter);

      console.log("\n🔧 Suggested Fix (run in your deployment script):");
      console.log(`
// Using ethers.js:
const genesis = await ethers.getContractAt("Genesis", "${addresses.Genesis}");
await genesis.initialize(
  "${addresses.WSTETH}",      // collateralToken
  "${addresses.PeggedToken}",  // peggedToken
  "${addresses.LeveragedToken}", // leveragedToken
  "${addresses.Minter}"        // minter (if needed)
);

// Or using cast CLI:
cast send ${addresses.Genesis} "initialize(address,address,address,address)" \\
  ${addresses.WSTETH} \\
  ${addresses.PeggedToken} \\
  ${addresses.LeveragedToken} \\
  ${addresses.Minter} \\
  --rpc-url http://127.0.0.1:8545 \\
  --private-key YOUR_PRIVATE_KEY
      `);
    } else {
      console.log("\n✅ Genesis contract appears to be properly initialized!");
    }
  } catch (error) {
    console.error("❌ Error checking initialization:", error);
  }
}

checkInitialization().catch(console.error);
