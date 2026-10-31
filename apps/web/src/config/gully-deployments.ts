/**
 * Gully Safe: registers the Safe v1.4.1 contracts of Gully Chain Testnet (485590) before anything resolves
 * contract addresses. Imported first in `pages/_app.tsx`. Addresses live in `gully-contracts.json`.
 *
 * Only the contracts the web app resolves through `@safe-global/safe-deployments` are registered:
 * singleton, safeL2, proxyFactory, fallbackHandler, multiSend, multiSendCallOnly, signMessageLib,
 * createCall, simulateTxAccessor, safeToL2Setup, safeToL2Migration. The other entries (tokenCallbackHandler,
 * WebAuthn, 4337, Daimo verifier) are kept for reference only: the web app does not use passkeys or 4337.
 * Not deployed on 485590: SafeMigration (in-place upgrades). The allowance module (spending limits, 0.1.1) is in
 * `gully-contracts.json` under `modules` and resolved by features/spending-limits/services/spendingLimitDeployments.ts.
 */
import { registerCustomDeployments } from '@safe-global/utils/services/contracts/customDeployments'
import gullyContracts from './gully-contracts.json'

export const GULLY_CHAIN_ID = gullyContracts.chainId

export const GULLY_DEPLOYMENTS_REGISTERED = registerCustomDeployments(
  gullyContracts.chainId,
  gullyContracts.safeVersion,
  gullyContracts.contracts,
)

if (!GULLY_DEPLOYMENTS_REGISTERED && typeof window !== 'undefined') {
  console.warn(`[Gully Safe] gully-contracts.json is incomplete, chain ${GULLY_CHAIN_ID} has no Safe contracts`)
}
