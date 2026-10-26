/** Gully Safe: Gully Labs links and the Gully services shown in the app. All open in a new tab. */

export const GULLY_LABS_URL = 'https://gullylabs.xyz'
export const GULLY_TERMS_URL = 'https://gullylabs.xyz/terms'
export const GULLY_PRIVACY_URL = 'https://gullylabs.xyz/privacy'
// GPL-3.0: the corresponding source of this build
export const GULLY_SOURCE_URL = 'https://github.com/gully-labs/safe-wallet-monorepo/tree/gully/testnet'
export const UPSTREAM_SOURCE_URL = 'https://github.com/safe-global/safe-wallet-monorepo'

export type GullyService = {
  name: string
  description: string
  href: string
}

export const GULLY_SERVICES: GullyService[] = [
  { name: 'Gully Swap', description: 'Swap tokens on Gully Chain', href: 'https://app.gullychain.xyz/swap' },
  { name: 'Gully Launchpad', description: 'Launch a token', href: 'https://app.gullychain.xyz/launch' },
  { name: 'Gully Bridge', description: 'Bridge to Gully Chain Testnet', href: 'https://testnet-bridge.gullychain.xyz' },
  { name: 'Gully Pay', description: 'Payments and checkout', href: 'https://gullypay.xyz' },
  { name: 'Gully Quests', description: 'On-chain quests', href: 'https://app.gullychain.xyz/quests' },
  { name: '.gully names', description: 'Register a .gully name', href: 'https://app.gullychain.xyz/names' },
  { name: 'HolderMaps', description: 'Token holder bubble maps', href: 'https://holdermaps.xyz' },
  { name: 'Gully Security', description: 'Contract scans and monitoring', href: 'https://gullysecurity.xyz' },
  { name: 'Explorer', description: 'Gully Chain Testnet explorer', href: 'https://testnet-explorer.gullychain.xyz' },
  { name: 'Faucet', description: 'Get testnet ETH', href: 'https://faucet.gullychain.xyz' },
]
