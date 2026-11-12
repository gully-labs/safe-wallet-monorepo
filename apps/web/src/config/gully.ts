/** Gully Multisig: Gully Labs links and the links "Around <chain>" on the services page (they open in a new tab; the
 * Gully services that run inside the multisig are Safe Apps, config/gullyApps.ts). */

export const GULLY_LABS_URL = 'https://gullylabs.xyz'
// The Gully Multisig guide: the sidebar's help button
export const GULLY_DOCS_URL = 'https://docs.gullychain.xyz/safe/'
// Gully Chain has one Terms and one Privacy Policy, and they cover Gully Multisig: /terms and /privacy here redirect to them.
export const GULLY_TERMS_URL = 'https://gullychain.xyz/terms'
export const GULLY_PRIVACY_URL = 'https://gullychain.xyz/privacy'
// Gully Labs LLC company details and the index of every product's legal pages (/imprint redirects here)
export const GULLY_LEGAL_URL = 'https://gullylabs.xyz/legal'
// GPL-3.0: the corresponding source of this build
export const GULLY_SOURCE_URL = 'https://github.com/gully-labs/safe-wallet-monorepo/tree/gully/testnet'
export const UPSTREAM_SOURCE_URL = 'https://github.com/safe-global/safe-wallet-monorepo'

export type GullyService = {
  name: string
  description: string
  href: string
}

// Around Gully Chain Testnet (owner rule 2026-10-29/30: Gully Chain products only; other Gully products are on the
// Ecosystem page). Gully Core is not here: it runs inside the multisig (config/gullyApps.ts). The bridge has no Safe App
// yet, so it stays a link.
export const GULLY_SERVICES: GullyService[] = [
  { name: 'Explorer', description: 'Blocks, transactions and tokens', href: 'https://testnet.gullyscan.xyz/' },
  { name: 'Bridge', description: 'Move ETH in and out of Gully Chain', href: 'https://testnet-bridge.gullychain.xyz/' },
  { name: 'Faucet', description: 'Free test ETH for this testnet', href: 'https://faucet.gullychain.xyz/' },
  { name: 'Verify', description: 'Contract source, Sourcify', href: 'https://verify.gullychain.xyz/' },
  { name: 'Docs', description: 'The Gully Multisig guide', href: 'https://docs.gullychain.xyz/multisig/' },
  { name: 'Ecosystem', description: 'Projects on Gully Chain', href: 'https://gullychain.xyz/ecosystem/' },
  { name: 'Status', description: 'Uptime of every service', href: 'https://status.gullylabs.xyz/' },
]

/**
 * Chain-aware copy. Gully Multisig serves more than one chain (Gully Chain Testnet 485590 and Anubis Network 6714,
 * a mainnet), so nothing that is only true on the testnet (the faucet, test ETH, the testnet bridge and explorer)
 * may show while a Safe on another chain is open.
 */
export const GULLY_TESTNET_CHAIN_ID = '485590'
export const ANUBIS_CHAIN_ID = '6714'
// Kinetiq Elysium (99901, a mainnet; owner 2026-11-08): HYPE is a real native coin, so it can be sent like ETH.
export const ELYSIUM_CHAIN_ID = '99901'
// Robinhood Chain (4663, a mainnet; Gully-run transaction service since 2026-11-10): ETH, Safe's canonical addresses.
export const ROBINHOOD_CHAIN_ID = '4663'
export const ROBINHOOD_EXPLORER_URL = 'https://robinhoodchain.blockscout.com'

export type ChainLinks = {
  title: string
  subtitle: string
  services: GullyService[]
}

const TESTNET_LINKS: ChainLinks = {
  title: 'Gully Chain Testnet',
  subtitle: 'Test funds only: the faucet gives free test ETH, nothing here has real value.',
  services: GULLY_SERVICES,
}

// Anubis Network (6714): the chain's own bridge and explorer; of the Gully services only the ones that serve Anubis.
export const ANUBIS_BRIDGE_URL = 'https://app.anubisbridge.com'
export const ANUBIS_EXPLORER_URL = 'https://browser.anubispace.org'

const ANUBIS_LINKS: ChainLinks = {
  title: 'Anubis Network',
  subtitle:
    'gasDAI pays gas only on Anubis Network and cannot be sent. Tokens are ERC-20: a multisig here holds and moves tokens.',
  services: [
    { name: 'Anubis bridge', description: 'Move tokens to and from Anubis Network', href: ANUBIS_BRIDGE_URL },
    { name: 'Anubis explorer', description: 'Blocks, transactions and tokens', href: ANUBIS_EXPLORER_URL },
    { name: 'Verify', description: 'Safe contract sources, Sourcify', href: 'https://verify.gullychain.xyz/' },
    { name: 'Docs', description: 'The Gully Multisig guide', href: 'https://docs.gullychain.xyz/multisig/' },
    { name: 'Status', description: 'Uptime of every service', href: 'https://status.gullylabs.xyz/' },
  ],
}

// Kinetiq Elysium (99901): the chain's own explorer and site; of the Gully services only the ones that serve Elysium.
export const ELYSIUM_EXPLORER_URL = 'https://elysium.kinetiq.xyz/explorer'
export const ELYSIUM_SITE_URL = 'https://kinetiq.xyz'

const ELYSIUM_LINKS: ChainLinks = {
  title: 'Kinetiq Elysium',
  subtitle: 'HYPE is the gas coin on Kinetiq Elysium and can be sent like any native coin; tokens are ERC-20.',
  services: [
    { name: 'Elysium explorer', description: 'Blocks, transactions and tokens', href: ELYSIUM_EXPLORER_URL },
    { name: 'Kinetiq', description: 'The chain and its bridge', href: ELYSIUM_SITE_URL },
    { name: 'Verify', description: 'Safe contract sources, Sourcify', href: 'https://verify.gullychain.xyz/' },
    { name: 'Docs', description: 'The Gully Multisig guide', href: 'https://docs.gullychain.xyz/multisig/' },
    { name: 'Status', description: 'Uptime of every service', href: 'https://status.gullylabs.xyz/' },
  ],
}

// Robinhood Chain (4663): the chain's explorer; of the Gully services only the ones that serve Robinhood.
const ROBINHOOD_LINKS: ChainLinks = {
  title: 'Robinhood Chain',
  subtitle: 'ETH is the gas coin on Robinhood Chain and can be sent; tokens are ERC-20.',
  services: [
    { name: 'Robinhood explorer', description: 'Blocks, transactions and tokens', href: ROBINHOOD_EXPLORER_URL },
    { name: 'Verify', description: 'Safe contract sources, Sourcify', href: 'https://verify.gullychain.xyz/' },
    { name: 'Docs', description: 'The Gully Multisig guide', href: 'https://docs.gullychain.xyz/multisig/' },
    { name: 'Status', description: 'Uptime of every service', href: 'https://status.gullylabs.xyz/' },
  ],
}

const CHAIN_LINKS: Record<string, ChainLinks> = {
  [GULLY_TESTNET_CHAIN_ID]: TESTNET_LINKS,
  [ANUBIS_CHAIN_ID]: ANUBIS_LINKS,
  [ELYSIUM_CHAIN_ID]: ELYSIUM_LINKS,
  [ROBINHOOD_CHAIN_ID]: ROBINHOOD_LINKS,
}

/** The links panel of a chain; undefined for a chain we have no checked links for (the panel is then left out). */
export const chainLinksFor = (chainId: string | undefined): ChainLinks | undefined =>
  chainId ? CHAIN_LINKS[chainId] : undefined

export type AddFundsCopy = {
  title: string
  text: string
  links: { label: string; href: string }[]
}

type FundsChain = { chainId?: string; chainName?: string; nativeCurrency?: { symbol?: string } }

/**
 * The "add funds" banner of an empty Safe. Testnet: test ETH and the faucet. A chain whose native coin pays gas only
 * (Anubis gasDAI): the coin cannot be sent to a Safe at all, so the banner says tokens, with the chain's own bridge
 * and explorer. Any other chain: the plain sentence, no faucet.
 */
export const addFundsCopyFor = (chain: FundsChain | undefined, noNativeValue: boolean): AddFundsCopy => {
  const symbol = chain?.nativeCurrency?.symbol || 'The native coin'
  const where = chain?.chainName || 'this chain'
  if (noNativeValue) {
    const links =
      chain?.chainId === ANUBIS_CHAIN_ID
        ? [
            { label: 'Anubis bridge', href: ANUBIS_BRIDGE_URL },
            { label: 'Anubis explorer', href: ANUBIS_EXPLORER_URL },
          ]
        : []
    const bridge = links.length ? ', or bring them in over the bridge' : ''
    return {
      title: 'Add tokens to get started',
      text: `${symbol} pays gas only on ${where} and cannot be sent to a multisig. Tokens are ERC-20: send tokens to your address from another wallet${bridge}.`,
      links,
    }
  }
  if (chain?.chainId === GULLY_TESTNET_CHAIN_ID) {
    return {
      title: 'Add funds to get started',
      text: 'Send ETH to your address from another wallet, or get free test ETH from the faucet.',
      links: [{ label: 'Faucet', href: 'https://faucet.gullychain.xyz/' }],
    }
  }
  return {
    title: 'Add funds to get started',
    text: `Send ${chain?.nativeCurrency?.symbol || 'the native coin'} or tokens to your address from another wallet.`,
    links: [],
  }
}
