import { http, createConfig } from '@wagmi/core'
import { base, mainnet, arbitrum } from 'wagmi/chains'
import { injected, metaMask, safe, walletConnect } from 'wagmi/connectors'
import { anvil } from '@/config/anvil'

const projectId = '513620ae374ee96b895eb92231eecb7f'

// Set up wagmi config
export const wagmi = createConfig({
    chains: [mainnet, base, anvil, arbitrum],
    connectors: [
        injected(),
        metaMask(),
        safe()
    ],
    transports: {
        [anvil.id]: http(),
        [mainnet.id]: http(),
        [base.id]: http(),
        [arbitrum.id]: http()
    }
});