import { Interface, MaxUint256, ZeroAddress } from 'ethers'
import { describeCall, pipsToPercent, queueLabel, unpackPoolFee } from '@/services/gully-decode'

const USDC = '0x1111111111111111111111111111111111111111'
const ALICE = '0x2222222222222222222222222222222222222222'
const HOOK = '0x3333333333333333333333333333333333333333'
const CTRL = '0x4444444444444444444444444444444444444444'
const PM = '0x5555555555555555555555555555555555555555'
const WETH = '0x6666666666666666666666666666666666666666'

const enc = (sig: string, args: unknown[]) => {
  const i = new Interface([`function ${sig}`])
  return i.encodeFunctionData(i.fragments[0].format('sighash').split('(')[0], args)
}

const ctx = {
  token: (a: string) =>
    a === USDC ? { symbol: 'USDC.e', decimals: 6 } : a === WETH ? { symbol: 'WETH', decimals: 18 } : undefined,
  name: (a: string) => (a === ALICE ? 'Alice' : undefined),
  native: { symbol: 'ETH', decimals: 18 },
}

describe('describeCall', () => {
  it('says "Pay 500 USDC.e to Alice" for an ERC-20 transfer, with the raw recipient in the lines', () => {
    const d = describeCall({ to: USDC, data: enc('transfer(address to, uint256 amount)', [ALICE, 500_000_000n]) }, ctx)
    expect(d?.title).toBe('Pay 500 USDC.e to Alice')
    expect(d?.lines).toContain(`Recipient: ${ALICE}`)
    expect(d?.group).toBe('erc20')
    expect(d?.level).toBe('normal')
  })

  it('shortens an unnamed recipient and groups thousands', () => {
    const d = describeCall(
      { to: USDC, data: enc('transfer(address to, uint256 amount)', [HOOK, 1_234_567_890_000n]) },
      ctx,
    )
    expect(d?.title).toBe('Pay 1,234,567.89 USDC.e to 0x3333…3333')
  })

  it('flags an unlimited approval as careful and plain approvals as normal', () => {
    const unlimited = describeCall(
      { to: USDC, data: enc('approve(address spender, uint256 amount)', [ALICE, MaxUint256]) },
      ctx,
    )
    expect(unlimited?.title).toBe('Let Alice spend unlimited USDC.e')
    expect(unlimited?.level).toBe('careful')
    const some = describeCall(
      { to: USDC, data: enc('approve(address spender, uint256 amount)', [ALICE, 25_000_000n]) },
      ctx,
    )
    expect(some?.title).toBe('Let Alice spend up to 25 USDC.e')
    expect(some?.level).toBe('normal')
    const zero = describeCall({ to: USDC, data: enc('approve(address spender, uint256 amount)', [ALICE, 0n]) }, ctx)
    expect(zero?.title).toBe('Remove the spending allowance of Alice on USDC.e')
  })

  it('asks for the token when it does not know its symbol, instead of guessing', () => {
    const d = describeCall({ to: HOOK, data: enc('transfer(address to, uint256 amount)', [ALICE, 5n]) }, ctx)
    expect(d?.title).toBe('Pay 5 units of token 0x3333…3333 to Alice')
    expect(d?.needsToken).toEqual([HOOK])
  })

  it('decodes the Gully Core builder fee in pips (3000 = 0.30%) and tells the 7 day rule', () => {
    const d = describeCall({ to: CTRL, data: enc('setBuilderFee(uint16 newFee)', [3000]) }, ctx)
    expect(d?.title).toBe('Set the Gully Core builder fee to 0.30%')
    expect(d?.group).toBe('gully-core')
    expect(d?.lines.join(' ')).toContain('7 days')
    expect(describeCall({ to: CTRL, data: enc('setBuilderFee(uint16 newFee)', [0]) }, ctx)?.title).toBe(
      'Set the Gully Core builder fee to 0.00%',
    )
  })

  it('decodes a pool fee: "Set the protocol fee of pool WETH/USDC.e to 0.10%"', () => {
    const packed = 1000 | (1000 << 12)
    const key = [WETH, USDC, ZeroAddress, PM, 3000, `0x${'00'.repeat(32)}`]
    const sig =
      'setPoolProtocolFee(address poolManager, tuple(address currency0, address currency1, address hooks, address poolManager, uint24 fee, bytes32 parameters) key, uint24 newProtocolFee)'
    const d = describeCall({ to: CTRL, data: enc(sig, [PM, key, packed]) }, ctx)
    expect(d?.title).toBe('Set the protocol fee of pool WETH/USDC.e to 0.10%')
    const lopsided = describeCall({ to: CTRL, data: enc(sig, [PM, key, 1000 | (3000 << 12)]) }, ctx)
    expect(lopsided?.title).toContain('0.10% one way and 0.30% the other')
  })

  it('decodes registry, launch fee, escrow and vault calls', () => {
    expect(
      describeCall(
        { to: CTRL, data: enc('setListing(address hook, uint8 status, string reason)', [HOOK, 2, 'stolen funds']) },
        ctx,
      ),
    ).toMatchObject({ title: 'Mark hook 0x3333…3333 as Malicious in the Gully Core registry', level: 'careful' })
    expect(describeCall({ to: CTRL, data: enc('setLaunchFee(uint256 newFeeWei)', [10n ** 15n]) }, ctx)?.title).toBe(
      'Set the Gully Core launch fee to 0.001 ETH',
    )
    expect(describeCall({ to: CTRL, data: enc('release(uint256 id)', [42]) }, ctx)?.title).toBe(
      'Release Gully Pay escrow #42 to the seller',
    )
    expect(describeCall({ to: CTRL, data: enc('pauseDeposits(bool paused)', [true]) }, ctx)?.title).toBe(
      'Pause deposits into the Gully Pay treasury vault',
    )
  })

  it('marks ownership and role changes as careful', () => {
    expect(describeCall({ to: CTRL, data: enc('renounceOwnership()', []) }, ctx)).toMatchObject({ level: 'careful' })
    expect(describeCall({ to: CTRL, data: enc('transferOwnership(address newOwner)', [ALICE]) }, ctx)).toMatchObject({
      title: 'Hand ownership of the contract to Alice',
      level: 'careful',
    })
    expect(describeCall({ to: CTRL, data: enc('pause()', []) }, ctx)?.title).toBe('Pause the contract')
  })

  it('returns null for empty data, an unknown selector and truncated arguments', () => {
    expect(describeCall({ to: USDC, data: '0x' }, ctx)).toBeNull()
    expect(describeCall({ to: USDC, data: null }, ctx)).toBeNull()
    expect(describeCall({ to: USDC, data: '0x895a74850000' }, ctx)).toBeNull()
    expect(
      describeCall({ to: USDC, data: enc('transfer(address to, uint256 amount)', [ALICE, 1n]).slice(0, 40) }, ctx),
    ).toBeNull()
  })
})

describe('helpers', () => {
  it('formats pips as percent', () => {
    expect(pipsToPercent(3000)).toBe('0.30%')
    expect(pipsToPercent(1000)).toBe('0.10%')
    expect(pipsToPercent(4000)).toBe('0.40%')
    expect(pipsToPercent(1250)).toBe('0.125%')
  })
  it('unpacks a pool fee into its two directions', () => {
    expect(unpackPoolFee(1000 | (3000 << 12))).toEqual({ zeroForOne: 1000, oneForZero: 3000 })
  })
  it('labels queue rows by method name, and leaves unknown names alone', () => {
    expect(queueLabel('setBuilderFee')).toBe('Set Gully Core builder fee')
    expect(queueLabel('somethingElse')).toBeNull()
    expect(queueLabel(undefined)).toBeNull()
  })
})
