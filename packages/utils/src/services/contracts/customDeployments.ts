/**
 * Gully Safe: runtime registration of Safe contracts deployed at NON-canonical addresses.
 *
 * The app and protocol-kit resolve every Safe contract address through the bundled
 * `@safe-global/safe-deployments` tables (`get*Deployment({ network: chainId })`). A chain that is not
 * in those tables has no Safe contracts as far as the app is concerned.
 *
 * `registerCustomDeployments` adds a chain to those tables in place: each contract gets an extra
 * deployment type `CUSTOM_DEPLOYMENT_TYPE` and `networkAddresses[chainId]` points to it. After that every
 * lookup for that chain returns the custom address. `getCustomContractNetworks` returns the same
 * addresses in protocol-kit's `contractNetworks` format, for callers that pass them explicitly.
 */
import type { ContractNetworksConfig } from '@safe-global/protocol-kit'
import {
  _ACCESSOR_DEPLOYMENTS,
  _COMPAT_FALLBACK_HANDLER_DEPLOYMENTS,
  _CREATE_CALL_DEPLOYMENTS,
  _FACTORY_DEPLOYMENTS,
  _MULTI_SEND_CALL_ONLY_DEPLOYMENTS,
  _MULTI_SEND_DEPLOYMENTS,
  _SAFE_DEPLOYMENTS,
  _SAFE_L2_DEPLOYMENTS,
  _SAFE_TO_L2_MIGRATION_DEPLOYMENTS,
  _SAFE_TO_L2_SETUP_DEPLOYMENTS,
  _SIGN_MESSAGE_LIB_DEPLOYMENTS,
} from '@safe-global/safe-deployments/dist/deployments'
import type { SingletonDeploymentJSON } from '@safe-global/safe-deployments/dist/types'

export const CUSTOM_DEPLOYMENT_TYPE = 'custom'

export type CustomContractAddresses = {
  singleton?: string
  safeL2?: string
  proxyFactory?: string
  fallbackHandler?: string
  multiSend?: string
  multiSendCallOnly?: string
  signMessageLib?: string
  createCall?: string
  simulateTxAccessor?: string
  safeToL2Setup?: string
  safeToL2Migration?: string
}

const TABLES: Record<keyof CustomContractAddresses, SingletonDeploymentJSON[]> = {
  singleton: _SAFE_DEPLOYMENTS,
  safeL2: _SAFE_L2_DEPLOYMENTS,
  proxyFactory: _FACTORY_DEPLOYMENTS,
  fallbackHandler: _COMPAT_FALLBACK_HANDLER_DEPLOYMENTS,
  multiSend: _MULTI_SEND_DEPLOYMENTS,
  multiSendCallOnly: _MULTI_SEND_CALL_ONLY_DEPLOYMENTS,
  signMessageLib: _SIGN_MESSAGE_LIB_DEPLOYMENTS,
  createCall: _CREATE_CALL_DEPLOYMENTS,
  simulateTxAccessor: _ACCESSOR_DEPLOYMENTS,
  safeToL2Setup: _SAFE_TO_L2_SETUP_DEPLOYMENTS,
  safeToL2Migration: _SAFE_TO_L2_MIGRATION_DEPLOYMENTS,
}

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const registered = new Map<string, CustomContractAddresses>()

const isValidCustomAddress = (address: string | undefined): address is string =>
  !!address && ADDRESS_RE.test(address) && address !== ZERO_ADDRESS

/** True when the chain's Safe contracts come from `registerCustomDeployments` instead of the canonical set. */
export const hasCustomDeployments = (chainId: string): boolean => registered.has(chainId)

/**
 * Registers `addresses` as the Safe `version` deployments of `chainId`. Entries that are empty, the zero
 * address or not an address are skipped. Nothing is registered unless both singletons and the proxy
 * factory are valid. Idempotent.
 */
export const registerCustomDeployments = (
  chainId: string,
  version: string,
  addresses: CustomContractAddresses,
): boolean => {
  if (registered.has(chainId)) return true
  if (![addresses.singleton, addresses.safeL2, addresses.proxyFactory].every(isValidCustomAddress)) return false

  for (const [key, table] of Object.entries(TABLES) as [keyof CustomContractAddresses, SingletonDeploymentJSON[]][]) {
    const address = addresses[key]
    if (!isValidCustomAddress(address)) continue

    const deployment = table.find((entry) => entry.version === version)
    if (!deployment) continue

    const deploymentsByType = deployment.deployments as unknown as Record<string, { address: string; codeHash: string }>
    deploymentsByType[CUSTOM_DEPLOYMENT_TYPE] = {
      address,
      // Same source as the canonical build, only the deployment address differs.
      codeHash: deploymentsByType.canonical?.codeHash ?? '',
    }
    ;(deployment.networkAddresses as unknown as Record<string, string>)[chainId] = CUSTOM_DEPLOYMENT_TYPE
  }

  registered.set(chainId, addresses)
  return true
}

/** protocol-kit `contractNetworks` for a registered chain, undefined otherwise. */
export const getCustomContractNetworks = (
  chainId: string,
  isL1SafeSingleton: boolean,
): ContractNetworksConfig | undefined => {
  const addresses = registered.get(chainId)
  if (!addresses) return undefined

  const config = {
    safeSingletonAddress: isL1SafeSingleton ? addresses.singleton : addresses.safeL2,
    safeProxyFactoryAddress: addresses.proxyFactory,
    multiSendAddress: addresses.multiSend,
    multiSendCallOnlyAddress: addresses.multiSendCallOnly,
    fallbackHandlerAddress: addresses.fallbackHandler,
    signMessageLibAddress: addresses.signMessageLib,
    createCallAddress: addresses.createCall,
    simulateTxAccessorAddress: addresses.simulateTxAccessor,
  }

  // Leave out contracts that were not provided so protocol-kit reports them instead of using a bad address.
  const entries = Object.entries(config).filter(([, address]) => isValidCustomAddress(address))
  return { [chainId]: Object.fromEntries(entries) }
}
