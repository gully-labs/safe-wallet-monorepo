/**
 * Gully Multisig: the Gully products wired to the open Safe and its chain. Pure functions, no React, so each rule can be
 * tested: a product shows only on a chain it serves, with the Safe or token address already in the link.
 *
 * What each product serves (read 2026-11-06): HolderMaps `gully` (holdermaps.xyz/api/holders/sources), the Gully Score
 * `gully` (gully-security server/chains.mjs) and Gully Core (gullychain.xyz/core is the testnet build) are on Gully
 * Chain Testnet, none is on Anubis Network. The Gully Bridge reads `destinationAddress` from its URL. The faucet and the
 * Anubis bridge have no address parameter: those two copy the address and say so.
 */
import { ANUBIS_BRIDGE_URL, ANUBIS_CHAIN_ID, GULLY_TESTNET_CHAIN_ID } from './gully'

export const GULLY_BRIDGE_URL = 'https://testnet-bridge.gullychain.xyz/'
export const GULLY_FAUCET_URL = 'https://faucet.gullychain.xyz/'

export type GullyToolId = 'explorer' | 'bridge' | 'faucet'

export type GullyTool = {
  id: GullyToolId
  label: string
  href: string
  /** The product cannot take the address from its URL: copy it when the link is opened, and tell the user */
  copiesAddress: boolean
}

type ToolsInput = {
  chainId: string | undefined
  safeAddress: string | undefined
  /** The Safe's page on the chain's own explorer (chain config), undefined when the chain has none */
  explorerUrl: string | undefined
}

/** The sidebar's tools for the open Safe. Empty without a Safe: every one of them acts on its address. */
export const gullyToolsFor = ({ chainId, safeAddress, explorerUrl }: ToolsInput): GullyTool[] => {
  if (!chainId || !safeAddress) return []

  const tools: GullyTool[] = []
  if (explorerUrl) tools.push({ id: 'explorer', label: 'Explorer', href: explorerUrl, copiesAddress: false })

  if (chainId === GULLY_TESTNET_CHAIN_ID) {
    const query = new URLSearchParams({
      sourceChain: 'arbitrum-sepolia',
      destinationChain: 'gully-chain-testnet',
      destinationAddress: safeAddress,
    })
    tools.push({ id: 'bridge', label: 'Bridge', href: `${GULLY_BRIDGE_URL}?${query}`, copiesAddress: false })
    // Testnet only, never on Anubis Network or a mainnet
    tools.push({ id: 'faucet', label: 'Faucet', href: GULLY_FAUCET_URL, copiesAddress: true })
  }

  if (chainId === ANUBIS_CHAIN_ID) {
    tools.push({ id: 'bridge', label: 'Anubis bridge', href: ANUBIS_BRIDGE_URL, copiesAddress: true })
  }

  return tools
}

export type GullyTokenActionId = 'holders' | 'score' | 'core'

export type GullyTokenAction = {
  id: GullyTokenActionId
  label: string
  href: string
}

const ADDRESS = /^0x[0-9a-fA-F]{40}$/

/**
 * The Gully views of a token the Safe holds: inside the asset screen, not in a menu (owner rule: Gully Chain menus show
 * Gully Chain products only). All read-only. Empty for the native coin (no contract) and on any other chain.
 */
export const gullyTokenActionsFor = (
  chainId: string | undefined,
  tokenAddress: string | undefined,
): GullyTokenAction[] => {
  if (chainId !== GULLY_TESTNET_CHAIN_ID || !tokenAddress || !ADDRESS.test(tokenAddress)) return []
  if (BigInt(tokenAddress) === BigInt(0)) return []

  const token = tokenAddress.toLowerCase()
  return [
    { id: 'holders', label: 'Holder map', href: `https://holdermaps.xyz/gully/${token}` },
    { id: 'score', label: 'Security score', href: `https://gullysecurity.xyz/score/gully/${token}` },
    { id: 'core', label: 'Token on Gully Core', href: `https://gullychain.xyz/core/tokens/${token}` },
  ]
}

/** The toast after a link copied the Safe's address. */
export const addressCopiedMessage = (label: string): string => `Safe address copied. Paste it in the ${label}.`
