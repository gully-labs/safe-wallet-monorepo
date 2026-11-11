import gullyChains from '@/config/gully-chains.json'

// Robinhood Chain 4663 is not in @safe-global/safe-deployments: without its entry the Safe SDK found no MultiSend
// ("Code 105: Error connecting to the blockchain (Invalid multiSend contract address)") on every 4663 Safe page.
describe('Gully Multisig on Robinhood Chain (4663): Safe canonical v1.4.1 contracts are registered', () => {
  it('registers the canonical addresses: gully-ops l3/safe/chains/4663.json', () => {
    const chain = gullyChains.chains.find((c) => c.chainId === '4663')
    expect(chain).toBeDefined()
    expect(chain?.route).toBe('canonical')
    expect(chain?.safeVersion).toBe('1.4.1')
    expect(chain?.contracts.safeL2).toBe('0x29fcB43b46531BcA003ddC8FCB67FFE91900C762')
    expect(chain?.contracts.proxyFactory).toBe('0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67')
    expect(chain?.contracts.multiSend).toBe('0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526')
    expect(chain?.contracts.multiSendCallOnly).toBe('0x9641d764fc13c8B624c04430C7356C1C7C8102e2')
    expect(chain?.contracts.fallbackHandler).toBe('0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99')
  })

  it('every served chain in the config service has its Safe contracts registered here or in gully-contracts.json', () => {
    const ids = gullyChains.chains.map((c) => c.chainId)
    for (const id of ['6714', '4663', '99901']) expect(ids).toContain(id)
  })
})
