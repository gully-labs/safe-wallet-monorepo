/**
 * Gully Safe: the Gully chains this app knows, keyed by chain id (gully-contracts.json), and the one this build serves.
 *
 *   NEXT_PUBLIC_GULLY_CHAIN_ID=485590  (default; also anything unknown)  Gully Chain Testnet
 *   NEXT_PUBLIC_GULLY_CHAIN_ID=48559                                     Gully Chain (mainnet; no Safe contracts yet)
 *
 * Every Gully-specific chain id, RPC, explorer and contract address reads from here, so a mainnet build is a config
 * switch: no testnet value is hard-coded in the components. A chain whose `contracts` is null has no Safe deployment
 * yet: it is not registered, its spending-limit overlay is empty and the Gully activity card stays hidden.
 */
import doc from './gully-contracts.json'
import type { CustomContractAddresses } from '@safe-global/utils/services/contracts/customDeployments'

export type GullyChain = {
  chainId: string
  name: string
  testnet: boolean
  rpc: string
  explorer: string
  bridge: string
  /** null = no faucet on this chain (mainnet) */
  faucet: string | null
  safeVersion: string
  /** null = no Safe contracts on this chain yet */
  contracts: (CustomContractAddresses & Record<string, string>) | null
  /** AllowanceModule (spending limits) by version, null = none */
  modules: { allowanceModule: Record<string, string> } | null
  /** other SafeProxyFactory addresses whose Safes count as Gully Safes in the live stats */
  extraFactories: string[]
}

type ChainEntry = Omit<GullyChain, 'chainId'>

export const GULLY_CHAINS: Record<string, GullyChain> = Object.fromEntries(
  Object.entries(doc.chains as unknown as Record<string, ChainEntry>).map(([chainId, c]) => [
    chainId,
    { chainId, ...c },
  ]),
)

export const GULLY_DEFAULT_CHAIN_ID: string = doc.defaultChainId

/** The build's Gully chain id: a known chain id from the env, else the default (testnet). Pure. */
export function gullyChainIdFrom(v: unknown): string {
  const id = typeof v === 'string' ? v.trim() : ''
  return id && GULLY_CHAINS[id] ? id : GULLY_DEFAULT_CHAIN_ID
}

// read literally so Next inlines it at build time
export const GULLY_CHAIN_ID: string = gullyChainIdFrom(process.env.NEXT_PUBLIC_GULLY_CHAIN_ID)
export const GULLY_CHAIN: GullyChain = GULLY_CHAINS[GULLY_CHAIN_ID]

/** The Gully chain for a chain id, or undefined for every other chain (they stay exactly as upstream). */
export const gullyChain = (chainId: string | undefined): GullyChain | undefined =>
  chainId ? GULLY_CHAINS[chainId] : undefined

/** A Gully chain that has Safe contracts deployed. */
export const hasGullySafe = (chainId: string | undefined): boolean => !!gullyChain(chainId)?.contracts
