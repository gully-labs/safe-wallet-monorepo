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

// Gully Chain products only (owner rule 2026-10-29/30, same list as gc-switcher 1.8.2 minus Safe itself). kre8.fun and
// the other Gully products (Pay, HolderMaps, Security, ...) are listed once, on the Ecosystem page.
export const GULLY_SERVICES: GullyService[] = [
  { name: 'Bridge', description: 'Move ETH in and out of Gully Chain', href: 'https://testnet-bridge.gullychain.xyz/' },
  { name: 'Explorer', description: 'Blocks, transactions and tokens', href: 'https://testnet-explorer.gullychain.xyz/' },
  { name: 'Faucet', description: 'Free testnet ETH', href: 'https://faucet.gullychain.xyz/' },
  { name: 'Verify', description: 'Contract source, Sourcify', href: 'https://verify.gullychain.xyz/' },
  { name: 'Sentry', description: 'Free keys, run a watcher', href: 'https://sentry.gullychain.xyz/' },
  { name: 'Docs', description: 'Guides and reference', href: 'https://docs.gullychain.xyz/' },
  { name: 'Developers', description: 'Starters and grants', href: 'https://dev.gullychain.xyz/' },
  { name: 'Ecosystem', description: 'Projects on Gully Chain', href: 'https://gullychain.xyz/ecosystem/' },
  { name: 'Status', description: 'Uptime of every service', href: 'https://status.gullylabs.xyz/' },
]
