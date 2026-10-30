/**
 * Lightweight spending limit deployment utilities.
 *
 * This file only imports from @safe-global/safe-modules-deployments (lightweight).
 * Use this for address checking in utility files that are loaded everywhere.
 * Use spendingLimitContracts.ts for actual contract interactions (lazy-loaded features).
 */
import {
  getAllowanceModuleDeployment as getCanonicalAllowanceModuleDeployment,
  type Deployment,
  type DeploymentFilter,
} from '@safe-global/safe-modules-deployments'
import gullyContracts from '@/config/gully-contracts.json'
import { type SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { sameAddress } from '@safe-global/utils/utils/addresses'

/**
 * Gully Safe: the AllowanceModule on Gully Chain (485590). The code is the canonical 0.1.1 creation code with salt 0,
 * replayed through the Arachnid deterministic deployer instead of the Safe singleton factory, so it has the canonical
 * runtime and ABI but its own address (gully-ops l3/generated/safe-allowance.json). `@safe-global/safe-modules-deployments`
 * has no 485590 entry, so the address is overlaid on the canonical deployment of the same version. Every other chain
 * resolves exactly as upstream.
 */
const GULLY_ALLOWANCE_MODULES: Record<string, Record<string, string>> = {
  [gullyContracts.chainId]: gullyContracts.modules.allowanceModule,
}

export const getAllowanceModuleDeployment = (filter?: DeploymentFilter): Deployment | undefined => {
  const gully = filter?.network ? GULLY_ALLOWANCE_MODULES[filter.network] : undefined
  if (!gully || !filter?.network) return getCanonicalAllowanceModuleDeployment(filter)
  // latest Gully version first when no version is asked for (the upstream default is the latest released one)
  const versions = Object.keys(gully).sort().reverse()
  const version = filter.version ?? versions[0]
  const address = gully[version]
  if (!address) return undefined
  const canonical = getCanonicalAllowanceModuleDeployment({ version, released: filter.released })
  if (!canonical) return undefined
  return { ...canonical, networkAddresses: { ...canonical.networkAddresses, [filter.network]: address } }
}

enum ALLOWANCE_MODULE_VERSIONS {
  '0.1.0' = '0.1.0',
  '0.1.1' = '0.1.1',
}

const ALL_VERSIONS = [ALLOWANCE_MODULE_VERSIONS['0.1.0'], ALLOWANCE_MODULE_VERSIONS['0.1.1']]

export const getDeployment = (chainId: string, modules: SafeState['modules']) => {
  if (!modules?.length) return
  for (const version of ALL_VERSIONS) {
    const deployment = getAllowanceModuleDeployment({ network: chainId, version })
    if (!deployment) continue
    const deploymentAddress = deployment?.networkAddresses[chainId]
    const isMatch = modules?.some((address) => sameAddress(address.value, deploymentAddress))
    if (isMatch) return deployment
  }
}

export const getLatestSpendingLimitAddress = (chainId: string): string | undefined => {
  const deployment = getAllowanceModuleDeployment({ network: chainId })
  return deployment?.networkAddresses[chainId]
}

export const getDeployedSpendingLimitModuleAddress = (
  chainId: string,
  modules: SafeState['modules'],
): string | undefined => {
  const deployment = getDeployment(chainId, modules)
  return deployment?.networkAddresses[chainId]
}
