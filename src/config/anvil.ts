import { Chain } from "wagmi/chains";

// Define local Anvil chain
export const anvil: Chain = {
    id: 31337,
    name: "Anvil",
    nativeCurrency: {
        decimals: 18,
        name: "Ethereum",
        symbol: "ETH",
    },
    rpcUrls: {
        default: {
            http: ["http://127.0.0.1:8545"],
        },
        public: {
            http: ["http://127.0.0.1:8545"],
        },
    },
};