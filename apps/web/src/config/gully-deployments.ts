/**
 * Gully Safe: registers the Safe v1.4.1 contracts of every Gully chain that has them (gully-contracts.json, keyed by
 * chain id; today Gully Chain Testnet 485590) before anything resolves contract addresses. Imported first in
 * `pages/_app.tsx`. The chain the build serves is NEXT_PUBLIC_GULLY_CHAIN_ID (gully-chains.ts).
 *
 * Only the contracts the web app resolves through `@safe-global/safe-deployments` are registered:
 * singleton, safeL2, proxyFactory, fallbackHandler, multiSend, multiSendCallOnly, signMessageLib,
 * createCall, simulateTxAccessor, safeToL2Setup, safeToL2Migration. The other entries (tokenCallbackHandler,
 * WebAuthn, 4337, Daimo verifier) are kept for reference only: the web app does not use passkeys or 4337.
 * Not deployed on 485590: SafeMigration (in-place upgrades). The allowance module (spending limits, 0.1.1) is in
 * `gully-contracts.json` under `modules` and resolved by features/spending-limits/services/spendingLimitDeployments.ts.
 */
import { registerCustomDeployments } from '@safe-global/utils/services/contracts/customDeployments'
import { GULLY_CHAIN_ID, GULLY_CHAINS } from './gully-chains'

export { GULLY_CHAIN_ID }

/** Registers every Gully chain that has Safe contracts (a chain with `contracts: null` is skipped). Returns chain id -> ok. */
export const registerGullyDeployments = (): Record<string, boolean> =>
  Object.fromEntries(
    Object.values(GULLY_CHAINS).flatMap((c) =>
      c.contracts ? [[c.chainId, registerCustomDeployments(c.chainId, c.safeVersion, c.contracts)]] : [],
    ),
  )

const REGISTERED = registerGullyDeployments()

/** true when the build's own Gully chain has its Safe contracts registered */
export const GULLY_DEPLOYMENTS_REGISTERED = !!REGISTERED[GULLY_CHAIN_ID]

if (!GULLY_DEPLOYMENTS_REGISTERED && typeof window !== 'undefined') {
  console.warn(`[Gully Safe] the Gully chain config has no complete Safe contracts for chain ${GULLY_CHAIN_ID}`)
}
