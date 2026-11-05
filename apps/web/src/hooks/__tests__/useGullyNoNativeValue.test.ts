import { chainHasNoNativeValue, noNativeValueNote, GULLY_NO_NATIVE_VALUE } from '@/hooks/useGullyNoNativeValue'
import gullyChains from '@/config/gully-chains.json'
import gullyContracts from '@/config/gully-contracts.json'
import { getSafeL2SingletonDeployment, getProxyFactoryDeployment } from '@safe-global/safe-deployments'
import { registerCustomDeployments, getCustomContractNetworks } from '@safe-global/utils/services/contracts/customDeployments'

describe('Gully Multisig: chains whose native coin pays gas only', () => {
  it('reads the feature key from the chain config', () => {
    expect(chainHasNoNativeValue(undefined)).toBe(false)
    expect(chainHasNoNativeValue({ features: ['ERC721', 'EIP1559'] })).toBe(false)
    expect(chainHasNoNativeValue({ features: ['ERC721', GULLY_NO_NATIVE_VALUE] })).toBe(true)
  })

  it('says in one line why the native coin cannot be sent', () => {
    expect(noNativeValueNote({ chainName: 'Anubis Network', nativeCurrency: { symbol: 'gasDAI' } })).toBe(
      'gasDAI pays gas only on Anubis Network and cannot be sent. Tokens (ERC-20) can.',
    )
    expect(noNativeValueNote(undefined)).toBe('The native coin pays gas only and cannot be sent. Tokens (ERC-20) can.')
  })
})

describe('Gully Multisig: Safe contracts per served chain', () => {
  it('registers Gully Chain Testnet and Anubis side by side without one overwriting the other', () => {
    expect(registerCustomDeployments(gullyContracts.chainId, gullyContracts.safeVersion, gullyContracts.contracts)).toBe(
      true,
    )
    for (const chain of gullyChains.chains) {
      expect(registerCustomDeployments(chain.chainId, chain.safeVersion, chain.contracts)).toBe(true)
    }

    const anubis = gullyChains.chains.find((chain) => chain.chainId === '6714')!
    expect(getSafeL2SingletonDeployment({ network: '6714', version: '1.4.1' })?.networkAddresses['6714']).toBe(
      anubis.contracts.safeL2,
    )
    expect(getProxyFactoryDeployment({ network: '6714', version: '1.4.1' })?.networkAddresses['6714']).toBe(
      anubis.contracts.proxyFactory,
    )
    // Anubis uses Safe's canonical 1.4.1 addresses (Safe singleton factory route)
    expect(anubis.contracts.safeL2).toBe('0x29fcB43b46531BcA003ddC8FCB67FFE91900C762')
    expect(anubis.contracts.proxyFactory).toBe('0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67')

    // Gully Chain Testnet keeps its own addresses
    expect(getSafeL2SingletonDeployment({ network: '485590', version: '1.4.1' })?.networkAddresses['485590']).toBe(
      gullyContracts.contracts.safeL2,
    )
    expect(getProxyFactoryDeployment({ network: '485590', version: '1.4.1' })?.networkAddresses['485590']).toBe(
      gullyContracts.contracts.proxyFactory,
    )
    expect(getCustomContractNetworks('6714', false)?.['6714']?.safeSingletonAddress).toBe(anubis.contracts.safeL2)
    expect(getCustomContractNetworks('485590', false)?.['485590']?.safeSingletonAddress).toBe(
      gullyContracts.contracts.safeL2,
    )
  })
})
