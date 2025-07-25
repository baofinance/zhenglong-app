// Usage:
//   node scripts/checkAllowance.js <owner> <token> <spender> [rpcUrl]
// Example:
//   node scripts/checkAllowance.js 0xYourWallet 0x7f39C5... 0x49c58c... http://127.0.0.1:8545
// If rpcUrl is omitted it defaults to http://127.0.0.1:8545

const { createPublicClient, http } = require("viem");
const { anvil } = require("viem/chains");

async function main() {
  const [owner, token, spender, rpcUrl = "http://127.0.0.1:8545"] =
    process.argv.slice(2);

  if (!owner || !token || !spender) {
    console.error(
      "Missing arguments. Usage: node scripts/checkAllowance.js <owner> <token> <spender> [rpcUrl]"
    );
    process.exit(1);
  }

  const ERC20_ABI = [
    {
      inputs: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
      ],
      name: "allowance",
      outputs: [{ type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "decimals",
      outputs: [{ type: "uint8" }],
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
    transport: http(rpcUrl),
  });

  try {
    const [rawAllowance, decimals, symbol] = await Promise.all([
      client.readContract({
        address: token,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [owner, spender],
      }),
      client.readContract({
        address: token,
        abi: ERC20_ABI,
        functionName: "decimals",
      }),
      client.readContract({
        address: token,
        abi: ERC20_ABI,
        functionName: "symbol",
      }),
    ]);

    const divisor = 10n ** BigInt(decimals);
    const humanReadable = Number(rawAllowance) / Number(divisor);

    console.log(`Allowance of ${symbol} for Genesis/spender:`);
    console.log(`Owner   : ${owner}`);
    console.log(`Token   : ${token}`);
    console.log(`Spender : ${spender}`);
    console.log(`Raw     : ${rawAllowance.toString()}`);
    console.log(`Readable: ${humanReadable}`);

    if (
      rawAllowance ===
      BigInt(
        "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    ) {
      console.log("⚠️  Infinite allowance detected (MaxUint256)");
    } else if (rawAllowance === 0n) {
      console.log("No allowance set – approval required.");
    }
  } catch (err) {
    console.error("Error reading allowance:", err);
  }
}

main();
