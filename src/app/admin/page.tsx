"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { markets } from "../../config/markets";
import ConnectButton from "../../components/ConnectButton";
import Navigation from "../../components/Navigation";
import Link from "next/link";

const minterABI = [
  {
    inputs: [{ name: "config_", type: "tuple" }],
    name: "updateConfig",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "feeReceiver_", type: "address" }],
    name: "updateFeeReceiver",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "reservePool_", type: "address" }],
    name: "updateReservePool",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "priceOracle_", type: "address" }],
    name: "updatePriceOracle",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "ZERO_FEE_ROLE",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "collateralIn", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    name: "freeMintPeggedToken",
    outputs: [{ type: "uint256", name: "peggedOut" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "peggedIn", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    name: "freeRedeemPeggedToken",
    outputs: [{ type: "uint256", name: "collateralOut" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "peggedIn", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    name: "freeSwapPeggedForLeveraged",
    outputs: [{ type: "uint256", name: "leveragedOut" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "collateralIn", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    name: "freeMintLeveragedToken",
    outputs: [{ type: "uint256", name: "leveragedOut" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "leveragedIn", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    name: "freeRedeemLeveragedToken",
    outputs: [{ type: "uint256", name: "collateralOut" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const erc20ABI = [
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
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const mockPriceFeedABI = [
  {
    inputs: [],
    name: "updatePrice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// Add a helper function to safely parse numbers
const safeParseEther = (value: string): bigint => {
  try {
    // Remove any non-numeric characters except decimal point
    const cleanValue = value.replace(/[^\d.]/g, "");
    // Ensure the value is a valid number
    if (!cleanValue || isNaN(Number(cleanValue))) {
      return BigInt(0);
    }
    return parseEther(cleanValue);
  } catch (error) {
    return BigInt(0);
  }
};

export default function Admin() {
  const { isConnected, address } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [feeReceiver, setFeeReceiver] = useState("");
  const [reservePool, setReservePool] = useState("");
  const [priceOracle, setPriceOracle] = useState("");
  const [freeMintCollateralAmount, setFreeMintCollateralAmount] = useState("");
  const [freeMintLeveragedAmount, setFreeMintLeveragedAmount] = useState("");
  const [
    freeMintLeveragedCollateralAmount,
    setFreeMintLeveragedCollateralAmount,
  ] = useState("");
  const [freeRedeemAmount, setFreeRedeemAmount] = useState("");
  const [freeSwapAmount, setFreeSwapAmount] = useState("");
  const [freeRedeemLeveragedAmount, setFreeRedeemLeveragedAmount] =
    useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [approvalAmount, setApprovalAmount] = useState("");
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get the minter address from the first market
  const minterAddress = (markets as any)[Object.keys(markets)[0]].addresses
    .minter as `0x${string}`;

  // Contract writes
  const {
    writeContract: updateFeeReceiverWrite,
    data: updateFeeReceiverHash,
    isPending: isUpdatingFeeReceiver,
  } = useWriteContract();
  const {
    writeContract: updateReservePoolWrite,
    data: updateReservePoolHash,
    isPending: isUpdatingReservePool,
  } = useWriteContract();
  const {
    writeContract: updatePriceOracleWrite,
    data: updatePriceOracleHash,
    isPending: isUpdatingPriceOracle,
  } = useWriteContract();
  const {
    writeContract: writeFreeMintPeggedToken,
    data: mintPeggedHash,
    isPending: isMintingPegged,
  } = useWriteContract();
  const {
    writeContract: freeRedeemPeggedToken,
    data: redeemPeggedHash,
    isPending: isRedeemingPegged,
  } = useWriteContract();
  const {
    writeContract: freeSwapPeggedForLeveraged,
    data: swapHash,
    isPending: isSwapping,
  } = useWriteContract();
  const {
    writeContract: writeFreeMintLeveragedToken,
    data: mintLeveragedHash,
    isPending: isMintingLeveraged,
  } = useWriteContract();
  const {
    writeContract: freeRedeemLeveragedToken,
    data: redeemLeveragedHash,
    isPending: isRedeemingLeveraged,
  } = useWriteContract();
  const {
    writeContract: approve,
    data: approveHash,
    isPending: isApprovingWrite,
  } = useWriteContract();
  const {
    writeContract: updatePriceFeed,
    data: updatePriceHash,
    isPending: isUpdatingPrice,
  } = useWriteContract();

  // Check if user has admin role
  const { data: zeroFeeRole } = useReadContract({
    address: minterAddress,
    abi: minterABI,
    functionName: "ZERO_FEE_ROLE",
  });

  // Add contract reads for allowance
  const { data: allowance } = useReadContract({
    address: (markets as any)[Object.keys(markets)[0]].addresses
      .collateralToken as `0x${string}`,
    abi: erc20ABI,
    functionName: "allowance",
    args: [address as `0x${string}`, minterAddress],
  });

  const handleUpdateFeeReceiver = () => {
    if (feeReceiver) {
      updateFeeReceiverWrite({
        address: minterAddress,
        abi: minterABI,
        functionName: "updateFeeReceiver",
        args: [feeReceiver as `0x${string}`],
      });
    }
  };

  const handleUpdateReservePool = () => {
    if (reservePool) {
      updateReservePoolWrite({
        address: minterAddress,
        abi: minterABI,
        functionName: "updateReservePool",
        args: [reservePool as `0x${string}`],
      });
    }
  };

  const handleUpdatePriceOracle = () => {
    if (priceOracle) {
      updatePriceOracleWrite({
        address: minterAddress,
        abi: minterABI,
        functionName: "updatePriceOracle",
        args: [priceOracle as `0x${string}`],
      });
    }
  };

  const handleFreeMintPeggedToken = async () => {
    if (!isConnected || !address) {
      console.error("Wallet not connected");
      return;
    }

    if (!freeMintCollateralAmount || !receiverAddress) {
      console.error("Missing amount or receiver address");
      return;
    }

    try {
      const parsedAmount = safeParseEther(freeMintCollateralAmount);
      if (parsedAmount === BigInt(0)) {
        console.error("Invalid amount");
        return;
      }

      console.log("Minting pegged token with:", {
        amount: freeMintCollateralAmount,
        parsedAmount: parsedAmount.toString(),
        receiver: receiverAddress,
        minter: minterAddress,
        allowance: allowance?.toString(),
      });

      writeFreeMintPeggedToken({
        address: minterAddress,
        abi: minterABI,
        functionName: "freeMintPeggedToken",
        args: [parsedAmount, receiverAddress as `0x${string}`],
      });
    } catch (error) {
      console.error("Error minting pegged token:", error);
    }
  };

  const handleFreeRedeemPeggedToken = () => {
    if (freeRedeemAmount && receiverAddress) {
      freeRedeemPeggedToken({
        address: minterAddress,
        abi: minterABI,
        functionName: "freeRedeemPeggedToken",
        args: [parseEther(freeRedeemAmount), receiverAddress as `0x${string}`],
      });
    }
  };

  const handleFreeSwapPeggedForLeveraged = () => {
    if (freeSwapAmount && receiverAddress) {
      freeSwapPeggedForLeveraged({
        address: minterAddress,
        abi: minterABI,
        functionName: "freeSwapPeggedForLeveraged",
        args: [parseEther(freeSwapAmount), receiverAddress as `0x${string}`],
      });
    }
  };

  const handleFreeMintLeveragedToken = async () => {
    if (!isConnected || !address) {
      console.error("Wallet not connected");
      return;
    }

    if (!freeMintLeveragedCollateralAmount || !receiverAddress) {
      console.error("Missing amount or receiver address");
      return;
    }

    try {
      const parsedAmount = safeParseEther(freeMintLeveragedCollateralAmount);
      if (parsedAmount === BigInt(0)) {
        console.error("Invalid amount");
        return;
      }

      console.log("Minting leveraged token with:", {
        amount: freeMintLeveragedCollateralAmount,
        parsedAmount: parsedAmount.toString(),
        receiver: receiverAddress,
        minter: minterAddress,
        allowance: allowance?.toString(),
      });

      writeFreeMintLeveragedToken({
        address: minterAddress,
        abi: minterABI,
        functionName: "freeMintLeveragedToken",
        args: [parsedAmount, receiverAddress as `0x${string}`],
      });
    } catch (error) {
      console.error("Error minting leveraged token:", error);
    }
  };

  const handleFreeRedeemLeveragedToken = () => {
    if (freeRedeemLeveragedAmount && receiverAddress) {
      freeRedeemLeveragedToken({
        address: minterAddress,
        abi: minterABI,
        functionName: "freeRedeemLeveragedToken",
        args: [
          parseEther(freeRedeemLeveragedAmount),
          receiverAddress as `0x${string}`,
        ],
      });
    }
  };

  // Update the approval handler
  const handleApprove = () => {
    if (approvalAmount) {
      setIsApproving(true);
      approve({
        address: (markets as any)[Object.keys(markets)[0]].addresses
          .collateralToken as `0x${string}`,
        abi: erc20ABI,
        functionName: "approve",
        args: [minterAddress, safeParseEther(approvalAmount)],
      });
      // Reset the state after a short delay
      setTimeout(() => {
        setIsApproving(false);
        setApprovalAmount("");
      }, 5000);
    }
  };

  const handleUpdatePriceFeed = () => {
    updatePriceFeed({
      address: (markets as any)[Object.keys(markets)[0]].addresses
        .priceOracle as `0x${string}`,
      abi: mockPriceFeedABI,
      functionName: "updatePrice",
    });
  };

  // Return a placeholder during server-side rendering
  if (!mounted) {
    return (
      <div className="min-h-screen bg-black text-white max-w-[1500px] mx-auto">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-8 text-[#4A7C59]">
            Admin Panel
          </h1>
          <div className="text-center">
            <p className="mb-4 text-[#F5F5F5]/70">
              Please connect your wallet to access admin functions
            </p>
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white max-w-[1500px] mx-auto">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-[#4A7C59]">Admin Panel</h1>

        {!isConnected ? (
          <div className="text-center">
            <p className="mb-4 text-[#F5F5F5]/70">
              Please connect your wallet to access admin functions
            </p>
            <ConnectButton />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-[#1A1A1A]/95 p-6 shadow-[0_0_15px_rgba(74,124,89,0.1)]">
              <h2 className="text-2xl font-bold mb-4 text-[#4A7C59]">
                System Controls
              </h2>
              <Link href="/admin/genesis">
                <button className="bg-[#4A7C59] px-4 py-2 hover:bg-[#4A7C59]/80 text-white">
                  Genesis Admin
                </button>
              </Link>
            </div>
            <div className="bg-[#1A1A1A]/95 p-6 shadow-[0_0_15px_rgba(74,124,89,0.1)]">
              <h2 className="text-2xl font-bold mb-4 text-[#4A7C59]">
                Update Fee Receiver
              </h2>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={feeReceiver}
                  onChange={(e) => setFeeReceiver(e.target.value)}
                  placeholder="Enter new fee receiver address"
                  className="flex-1 bg-[#202020] px-4 py-2 text-[#F5F5F5]/70 placeholder-[#F5F5F5]/30"
                />
                <button
                  onClick={handleUpdateFeeReceiver}
                  disabled={isUpdatingFeeReceiver}
                  className="bg-[#4A7C59] px-4 py-2 hover:bg-[#4A7C59]/80 text-white disabled:opacity-50"
                >
                  {isUpdatingFeeReceiver ? "Updating..." : "Update"}
                </button>
              </div>
            </div>

            <div className="bg-[#1A1A1A]/95 p-6 shadow-[0_0_15px_rgba(74,124,89,0.1)]">
              <h2 className="text-2xl font-bold mb-4 text-[#4A7C59]">
                Update Reserve Pool
              </h2>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={reservePool}
                  onChange={(e) => setReservePool(e.target.value)}
                  placeholder="Enter new reserve pool address"
                  className="flex-1 bg-[#202020] px-4 py-2 text-[#F5F5F5]/70 placeholder-[#F5F5F5]/30"
                />
                <button
                  onClick={handleUpdateReservePool}
                  disabled={isUpdatingReservePool}
                  className="bg-[#4A7C59] px-4 py-2 hover:bg-[#4A7C59]/80 text-white disabled:opacity-50"
                >
                  {isUpdatingReservePool ? "Updating..." : "Update"}
                </button>
              </div>
            </div>

            <div className="bg-[#1A1A1A]/95 p-6 shadow-[0_0_15px_rgba(74,124,89,0.1)]">
              <h2 className="text-2xl font-bold mb-4 text-[#4A7C59]">
                Update Price Oracle
              </h2>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={priceOracle}
                  onChange={(e) => setPriceOracle(e.target.value)}
                  placeholder="Enter new price oracle address"
                  className="flex-1 bg-[#202020] px-4 py-2 text-[#F5F5F5]/70 placeholder-[#F5F5F5]/30"
                />
                <button
                  onClick={handleUpdatePriceOracle}
                  disabled={isUpdatingPriceOracle}
                  className="bg-[#4A7C59] px-4 py-2 hover:bg-[#4A7C59]/80 text-white disabled:opacity-50"
                >
                  {isUpdatingPriceOracle ? "Updating..." : "Update"}
                </button>
              </div>
            </div>

            <div className="bg-[#1A1A1A]/95 p-6 shadow-[0_0_15px_rgba(74,124,89,0.1)]">
              <h2 className="text-2xl font-bold mb-4 text-[#4A7C59]">
                Free Functions
              </h2>
              <div className="space-y-4">
                <div className="bg-[#202020] p-4">
                  <h4 className="text-lg font-medium mb-3 text-[#F5F5F5]/70">
                    Receiver Address
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-[#F5F5F5]/70">
                        Address
                      </label>
                      <input
                        type="text"
                        value={receiverAddress}
                        onChange={(e) => setReceiverAddress(e.target.value)}
                        placeholder="Enter receiver address"
                        className="w-full bg-[#1A1A1A] px-4 py-2 text-[#F5F5F5]/70 placeholder-[#F5F5F5]/30"
                      />
                    </div>
                  </div>
                </div>

                {/* Minting Operations */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-[#4A7C59]">
                    Minting Operations
                  </h3>

                  {/* Add Approval Section */}
                  <div className="bg-[#202020] p-4">
                    <h4 className="text-lg font-medium mb-3 text-[#F5F5F5]/70">
                      Approve Collateral Token
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-[#F5F5F5]/70">
                          Amount to Approve
                        </label>
                        <input
                          type="number"
                          value={approvalAmount}
                          onChange={(e) => setApprovalAmount(e.target.value)}
                          placeholder="Enter amount to approve"
                          className="w-full bg-[#1A1A1A] px-4 py-2 text-[#F5F5F5]/70 placeholder-[#F5F5F5]/30"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleApprove}
                          disabled={isApprovingWrite || !approvalAmount}
                          className="bg-[#4A7C59] px-4 py-2 hover:bg-[#4A7C59]/80 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isApprovingWrite ? "Approving..." : "Approve"}
                        </button>
                        {allowance && (
                          <span className="text-sm text-[#F5F5F5]/70">
                            Current allowance: {formatEther(allowance)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#202020] p-4">
                      <h4 className="text-lg font-medium mb-3 text-[#F5F5F5]/70">
                        Mint Pegged Token
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-1 text-[#F5F5F5]/70">
                            Required Collateral Amount
                          </label>
                          <input
                            type="number"
                            value={freeMintCollateralAmount}
                            onChange={(e) =>
                              setFreeMintCollateralAmount(e.target.value)
                            }
                            placeholder="Collateral Amount"
                            className="w-full bg-[#1A1A1A] px-4 py-2 text-[#F5F5F5]/70 placeholder-[#F5F5F5]/30"
                          />
                        </div>
                        <button
                          onClick={handleFreeMintPeggedToken}
                          disabled={
                            !allowance ||
                            safeParseEther(freeMintCollateralAmount) >
                              allowance ||
                            isMintingPegged
                          }
                          className="w-full bg-[#4A7C59] px-4 py-2 hover:bg-[#4A7C59]/80 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {!allowance
                            ? "Approve First"
                            : safeParseEther(freeMintCollateralAmount) >
                              allowance
                            ? "Insufficient Allowance"
                            : isMintingPegged
                            ? "Minting..."
                            : "Mint Pegged Token"}
                        </button>
                        <p className="text-sm text-[#F5F5F5]/70">
                          Note: The collateral amount will be converted to
                          pegged tokens based on the current oracle price (e.g.,
                          1 ETH at $2000/ETH = 2000 pegged tokens)
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#202020] p-4">
                      <h4 className="text-lg font-medium mb-3 text-[#F5F5F5]/70">
                        Mint Leveraged Token
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-1 text-[#F5F5F5]/70">
                            Required Collateral Amount
                          </label>
                          <input
                            type="number"
                            value={freeMintLeveragedCollateralAmount}
                            onChange={(e) =>
                              setFreeMintLeveragedCollateralAmount(
                                e.target.value
                              )
                            }
                            placeholder="Collateral Amount"
                            className="w-full bg-[#1A1A1A] px-4 py-2 text-[#F5F5F5]/70 placeholder-[#F5F5F5]/30"
                          />
                        </div>
                        <button
                          onClick={handleFreeMintLeveragedToken}
                          disabled={
                            !allowance ||
                            safeParseEther(freeMintLeveragedCollateralAmount) >
                              allowance ||
                            isMintingLeveraged
                          }
                          className="w-full bg-[#4A7C59] px-4 py-2 hover:bg-[#4A7C59]/80 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {!allowance
                            ? "Approve First"
                            : safeParseEther(
                                freeMintLeveragedCollateralAmount
                              ) > allowance
                            ? "Insufficient Allowance"
                            : isMintingLeveraged
                            ? "Minting..."
                            : "Mint Leveraged Token"}
                        </button>
                        <p className="text-sm text-[#F5F5F5]/70">
                          Note: The value of leveraged tokens is the difference
                          between collateral value and pegged token value. For
                          example, if 1 ETH ($2000) is used to mint $1000 worth
                          of pegged tokens, the leveraged tokens will be worth
                          $1000.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Redeeming Operations */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-[#4A7C59]">
                    Redeeming Operations
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#202020] p-4">
                      <h4 className="text-lg font-medium mb-3 text-[#F5F5F5]/70">
                        Redeem Pegged Token
                      </h4>
                      <div className="space-y-3">
                        <input
                          type="number"
                          value={freeRedeemAmount}
                          onChange={(e) => setFreeRedeemAmount(e.target.value)}
                          placeholder="Amount to redeem"
                          className="w-full bg-[#1A1A1A] px-4 py-2 text-[#F5F5F5]/70 placeholder-[#F5F5F5]/30"
                        />
                        <button
                          onClick={handleFreeRedeemPeggedToken}
                          disabled={isRedeemingPegged}
                          className="w-full bg-[#4A7C59] px-4 py-2 hover:bg-[#4A7C59]/80 text-white disabled:opacity-50"
                        >
                          {isRedeemingPegged
                            ? "Redeeming..."
                            : "Redeem Pegged Token"}
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#202020] p-4">
                      <h4 className="text-lg font-medium mb-3 text-[#F5F5F5]/70">
                        Swap Pegged for Leveraged
                      </h4>
                      <div className="space-y-3">
                        <input
                          type="number"
                          value={freeSwapAmount}
                          onChange={(e) => setFreeSwapAmount(e.target.value)}
                          placeholder="Amount to swap"
                          className="w-full bg-[#1A1A1A] px-4 py-2 text-[#F5F5F5]/70 placeholder-[#F5F5F5]/30"
                        />
                        <button
                          onClick={handleFreeSwapPeggedForLeveraged}
                          disabled={isSwapping}
                          className="w-full bg-[#4A7C59] px-4 py-2 hover:bg-[#4A7C59]/80 text-white disabled:opacity-50"
                        >
                          {isSwapping
                            ? "Swapping..."
                            : "Swap Pegged for Leveraged"}
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#202020] p-4">
                      <h4 className="text-lg font-medium mb-3 text-[#F5F5F5]/70">
                        Redeem Leveraged Token
                      </h4>
                      <div className="space-y-3">
                        <input
                          type="number"
                          value={freeRedeemLeveragedAmount}
                          onChange={(e) =>
                            setFreeRedeemLeveragedAmount(e.target.value)
                          }
                          placeholder="Amount to redeem"
                          className="w-full bg-[#1A1A1A] px-4 py-2 text-[#F5F5F5]/70 placeholder-[#F5F5F5]/30"
                        />
                        <button
                          onClick={handleFreeRedeemLeveragedToken}
                          disabled={isRedeemingLeveraged}
                          className="w-full bg-[#4A7C59] px-4 py-2 hover:bg-[#4A7C59]/80 text-white disabled:opacity-50"
                        >
                          {isRedeemingLeveraged
                            ? "Redeeming..."
                            : "Redeem Leveraged Token"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Add Price Feed Update Button */}
            <div className="bg-[#1A1A1A]/95 p-6 shadow-[0_0_15px_rgba(74,124,89,0.1)]">
              <h2 className="text-xl font-semibold mb-4 text-[#4A7C59]">
                Price Feed Management
              </h2>
              <button
                onClick={handleUpdatePriceFeed}
                disabled={!isConnected || isUpdatingPrice}
                className="bg-[#4A7C59] hover:bg-[#4A7C59]/80 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                {isUpdatingPrice ? "Updating..." : "Update Price Feed"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
