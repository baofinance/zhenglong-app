// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockPriceFeed {
    struct RoundData {
        uint80 roundId;
        int256 answer;
        uint256 startedAt;
        uint256 updatedAt;
        uint80 answeredInRound;
    }

    uint80 private constant INITIAL_ROUND_ID = 1;
    uint256 private constant INITIAL_PRICE = 3450 * 1e8; // $3450 with 8 decimals
    uint256 private constant PRICE_VOLATILITY = 50 * 1e8; // $50 volatility with 8 decimals
    uint256 private constant UPDATE_INTERVAL = 1 hours;

    uint80 private latestRoundId;
    mapping(uint80 => RoundData) private rounds;

    constructor() {
        // Initialize with a starting price
        RoundData memory round = RoundData({
            roundId: INITIAL_ROUND_ID,
            answer: int256(INITIAL_PRICE),
            startedAt: block.timestamp - UPDATE_INTERVAL,
            updatedAt: block.timestamp,
            answeredInRound: INITIAL_ROUND_ID
        });
        rounds[INITIAL_ROUND_ID] = round;
        latestRoundId = INITIAL_ROUND_ID;
    }

    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        RoundData memory round = rounds[latestRoundId];
        return (
            round.roundId,
            round.answer,
            round.startedAt,
            round.updatedAt,
            round.answeredInRound
        );
    }

    function getRoundData(uint80 _roundId) external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        RoundData memory round = rounds[_roundId];
        require(round.roundId != 0, "Round not found");
        return (
            round.roundId,
            round.answer,
            round.startedAt,
            round.updatedAt,
            round.answeredInRound
        );
    }

    // Function to update the price (can be called by anyone for testing)
    function updatePrice() external {
        latestRoundId++;
        
        // Generate a random price movement
        int256 lastPrice = rounds[latestRoundId - 1].answer;
        int256 priceChange = int256(uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao))) % PRICE_VOLATILITY);
        if (uint256(keccak256(abi.encodePacked(block.timestamp))) % 2 == 0) {
            priceChange = -priceChange;
        }
        int256 newPrice = lastPrice + priceChange;

        // Ensure price stays within reasonable bounds ($3300-$3600)
        if (newPrice < 3300 * 1e8) newPrice = 3300 * 1e8;
        if (newPrice > 3600 * 1e8) newPrice = 3600 * 1e8;

        RoundData memory round = RoundData({
            roundId: latestRoundId,
            answer: newPrice,
            startedAt: block.timestamp - UPDATE_INTERVAL,
            updatedAt: block.timestamp,
            answeredInRound: latestRoundId
        });
        rounds[latestRoundId] = round;
    }
} 