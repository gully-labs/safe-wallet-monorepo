import { chainLinksFor, ELYSIUM_CHAIN_ID, ELYSIUM_EXPLORER_URL } from '@/config/gully'
import gullyChains from '@/config/gully-chains.json'
import gullyContracts from '@/config/gully-contracts.json'

const TESTNET_ONLY = /faucet|test ETH|testnet-bridge|testnet-explorer|free testnet/i

describe('Gully Multisig on Kinetiq Elysium (99901): HYPE is sendable, the Gully-route Safe contracts are registered', () => {
  it('is chain 99901', () => {
    expect(ELYSIUM_CHAIN_ID).toBe('99901')
  })

  it('lists the Elysium explorer first in the links panel, and no testnet service', () => {
    const links = chainLinksFor(ELYSIUM_CHAIN_ID)
    expect(links?.title).toBe('Kinetiq Elysium')
    expect(links?.subtitle).toContain('HYPE is the gas coin on Kinetiq Elysium and can be sent')
    expect(links?.services[0]?.href).toBe(ELYSIUM_EXPLORER_URL)
    expect(ELYSIUM_EXPLORER_URL).toBe('https://elysium.kinetiq.xyz/explorer')
    expect(JSON.stringify(links)).not.toMatch(TESTNET_ONLY)
    expect((links?.services ?? []).every((s) => s.href.startsWith('https://'))).toBe(true)
  })

  it('registers Safe 1.4.1 at the Gully-route addresses (Arachnid deployer, same as Gully Chain): gully-ops l3/safe/chains/99901.json', () => {
    const chain = gullyChains.chains.find((c) => c.chainId === ELYSIUM_CHAIN_ID)
    expect(chain).toBeDefined()
    expect(chain?.route).toBe('gully')
    expect(chain?.safeVersion).toBe('1.4.1')
    // the Gully route reuses Gully Chain's creation code and salts through the Arachnid deployer: identical addresses
    expect(chain?.contracts).toEqual(gullyContracts.contracts)
    expect(chain?.contracts.safeL2).toBe('0x76667330c237Fb40f28d74563cdAAae4b06C23Ec')
    expect(chain?.contracts.proxyFactory).toBe('0xd9d2Ba03a7754250FDD71333F444636471CACBC4')
  })
})
