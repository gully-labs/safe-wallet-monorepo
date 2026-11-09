import { Interface } from 'ethers'
import {
  buildCancelBuilderFee,
  buildPause,
  buildPayout,
  buildSetBuilderFee,
  buildSetLaunchFee,
  buildSetListing,
  gullyChainRecord,
  parsePayoutLines,
  percentToPips,
} from '@/services/gully-actions'
import { describeCall } from '@/services/gully-decode'

const ANUBIS = '6714'
const TESTNET = '485590'
const A = '0x2222222222222222222222222222222222222222'
const B = '0x3333333333333333333333333333333333333333'

describe('gully actions', () => {
  it('has the Core records for both chains, with the V5 controller on Anubis only', () => {
    expect(gullyChainRecord(ANUBIS)?.feeController).toBe('0xC576eBFE93B3e524b2310d283E5eA6A91869cc7F')
    expect(gullyChainRecord(TESTNET)?.feeController).toBeNull()
    expect(gullyChainRecord('1')).toBeUndefined()
  })

  it('reads fee text as pips and refuses anything above the 0.40% cap', () => {
    expect(percentToPips('0.30')).toBe(3000)
    expect(percentToPips('0,3%')).toBe(3000)
    expect(percentToPips('0')).toBe(0)
    expect(percentToPips('0.4')).toBe(4000)
    expect(percentToPips('0.41')).toBeNull()
    expect(percentToPips('abc')).toBeNull()
    expect(percentToPips('')).toBeNull()
  })

  it('builds setBuilderFee for the Anubis controller and the decoder reads it back the same', () => {
    const b = buildSetBuilderFee(ANUBIS, '0.10')
    if (!b.ok) throw new Error(b.error)
    expect(b.calls).toHaveLength(1)
    expect(b.calls[0].to).toBe('0xC576eBFE93B3e524b2310d283E5eA6A91869cc7F')
    expect(b.calls[0].value).toBe('0')
    expect(describeCall(b.calls[0])?.title).toBe('Set the Gully Core builder fee to 0.10%')
    expect(b.summary).toBe('Set the Gully Core builder fee to 0.10%')
  })

  it('says why there is nothing to propose on the testnet fee controller, or for a bad fee', () => {
    const t = buildSetBuilderFee(TESTNET, '0.30')
    expect(t).toEqual({ ok: false, error: expect.stringContaining('older Gully Core fee controller') })
    expect(buildSetBuilderFee(ANUBIS, '0.9')).toEqual({ ok: false, error: expect.stringContaining('0.40%') })
    expect(buildSetBuilderFee('1', '0.3')).toEqual({ ok: false, error: 'Gully Core has no record for this chain.' })
    expect(buildCancelBuilderFee(TESTNET).ok).toBe(false)
  })

  it('builds cancel, listing, launch fee and pause calls the decoder understands', () => {
    const cancel = buildCancelBuilderFee(ANUBIS)
    expect(cancel.ok && describeCall(cancel.calls[0])?.title).toBe(
      'Cancel the scheduled Gully Core builder fee increase',
    )

    const listing = buildSetListing(ANUBIS, A, 'malicious', 'drains users')
    expect(listing.ok && describeCall(listing.calls[0])).toMatchObject({ level: 'careful', group: 'gully-core' })
    expect(buildSetListing(ANUBIS, A, 'malicious', '').ok).toBe(false)
    expect(buildSetListing(ANUBIS, 'nope', 'active', '').ok).toBe(false)
    expect(buildSetListing(ANUBIS, A, 'active', '').ok).toBe(true)

    const fee = buildSetLaunchFee(TESTNET, '0.001')
    expect(fee.ok && describeCall(fee.calls[0], { native: { symbol: 'ETH', decimals: 18 } })?.title).toBe(
      'Set the Gully Core launch fee to 0.001 ETH',
    )
    expect(buildSetLaunchFee(TESTNET, 'one').ok).toBe(false)

    const paused = buildPause(A, true)
    expect(paused.ok && describeCall(paused.calls[0])?.title).toBe('Pause the contract')
    expect(buildPause('x', false).ok).toBe(false)
  })

  it('parses payout lines separated by spaces, commas or tabs', () => {
    expect(parsePayoutLines(`${A} 10\n\n${B},2.5\r\n${A}\t1`)).toEqual([
      { recipient: A, amount: '10' },
      { recipient: B, amount: '2.5' },
      { recipient: A, amount: '1' },
    ])
  })

  it('builds one USDC.e transfer per payout row, checks every line, and refuses bad input with the line number', () => {
    const token = gullyChainRecord(TESTNET)!.payToken!
    const b = buildPayout(token.address, token.decimals, token.symbol, [
      { recipient: A, amount: '500' },
      { recipient: B, amount: '0.25' },
    ])
    if (!b.ok) throw new Error(b.error)
    expect(b.calls).toHaveLength(2)
    const ctx = { token: () => ({ symbol: 'USDC.e', decimals: 6 }) }
    expect(describeCall(b.calls[0], ctx)?.title).toBe('Pay 500 USDC.e to 0x2222…2222')
    expect(describeCall(b.calls[1], ctx)?.title).toBe('Pay 0.25 USDC.e to 0x3333…3333')
    expect(b.summary).toBe('Pay 500.25 USDC.e to 2 recipients')
    const data = new Interface(['function transfer(address to, uint256 amount)']).decodeFunctionData(
      'transfer',
      b.calls[1].data,
    )
    expect(data.amount).toBe(250000n)

    expect(buildPayout(token.address, 6, 'USDC.e', [{ recipient: 'bob', amount: '1' }])).toEqual({
      ok: false,
      error: 'Line 1: "bob" is not an address.',
    })
    expect(
      buildPayout(token.address, 6, 'USDC.e', [
        { recipient: A, amount: '1' },
        { recipient: B, amount: 'ten' },
      ]),
    ).toEqual({
      ok: false,
      error: 'Line 2: "ten" is not an amount.',
    })
    expect(buildPayout(token.address, 6, 'USDC.e', [{ recipient: A, amount: '0' }]).ok).toBe(false)
    expect(buildPayout(token.address, 6, 'USDC.e', []).ok).toBe(false)
    expect(buildPayout('0x1', 6, 'USDC.e', [{ recipient: A, amount: '1' }]).ok).toBe(false)
    expect(buildPayout(token.address, 6, 'USDC.e', [{ recipient: A, amount: '1.0000001' }]).ok).toBe(false)
  })
})
