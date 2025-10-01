// Debug script to identify the unknown error 0x82b42900
const crypto = require("crypto");

// Function to calculate keccak256 hash
function keccak256(input) {
  return crypto.createHash("sha3-256").update(input).digest("hex");
}

// Function to calculate error selector
function getErrorSelector(errorSignature) {
  const hash = keccak256(errorSignature);
  return "0x" + hash.substring(0, 8);
}

// List of potential custom errors
const potentialErrors = [
  "Unauthorized()",
  "NotOwner()",
  "InvalidState()",
  "InvalidOperation()",
  "ContractPaused()",
  "ZeroAmount()",
  "InvalidAmount()",
  "TransferFailed()",
  "InsufficientCollateral()",
  "AlreadyInitialized()",
  "GenesisAlreadyEnded()",
  "OnlyOwner()",
  "NoCollateralDeposited()",
  "GenesisNotActive()",
  "InsufficientBalance()",
  "AccessDenied()",
  "NotAuthorized()",
  "InvalidCaller()",
  "OperationNotAllowed()",
  "ContractNotActive()",
  "InsufficientFunds()",
  "InvalidRecipient()",
  "TokenTransferFailed()",
  "AmountTooLow()",
  "AmountTooHigh()",
  "ExceedsBalance()",
  "ExceedsAllowance()",
  "InvalidAddress()",
  "AddressZero()",
  "ArrayLengthMismatch()",
  "IndexOutOfBounds()",
  "DivisionByZero()",
  "Overflow()",
  "Underflow()",
];

console.log("Searching for error signature that matches 0x82b42900:\n");

for (const error of potentialErrors) {
  const selector = getErrorSelector(error);
  console.log(`${error.padEnd(25)} -> ${selector}`);

  if (selector === "0x82b42900") {
    console.log(`\n🎯 FOUND MATCH: ${error}`);
    break;
  }
}

console.log(
  "\nNote: This uses Node.js crypto which may differ from Ethereum keccak256."
);
console.log("If no match found, the error might be from a different source or");
console.log("use parameters: SomeError(uint256) instead of SomeError()");
