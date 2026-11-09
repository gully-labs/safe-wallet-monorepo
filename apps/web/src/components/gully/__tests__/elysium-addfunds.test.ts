import { addFundsCopyFor, ELYSIUM_CHAIN_ID } from '@/config/gully'

// Regression guard, not new behaviour: any chain whose native coin is sendable gets the plain add-funds copy, and
// Elysium (HYPE) must keep getting it. Kept apart from elysium-chain.test.ts, which only asserts what the Elysium change adds.
const TESTNET_ONLY = /faucet|test ETH|testnet-bridge|testnet-explorer|free testnet/i
const elysium = { chainId: ELYSIUM_CHAIN_ID, chainName: 'Kinetiq Elysium', nativeCurrency: { symbol: 'HYPE' } }

describe('Kinetiq Elysium add funds copy', () => {
  it('treats HYPE like any native coin in the add funds banner (no gas-only wording, no testnet copy)', () => {
    const copy = addFundsCopyFor(elysium, false)
    expect(copy).toEqual({
      title: 'Add funds to get started',
      text: 'Send HYPE or tokens to your address from another wallet.',
      links: [],
    })
    expect(JSON.stringify(copy)).not.toMatch(TESTNET_ONLY)
  })
})
