import { readFileSync } from 'fs'
import { join } from 'path'
import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { executedPerDay, outcomesInWindow, summarizeQueue } from '../MultisigPulse/pulse'

// Design slice 2: the multisig dashboard. A pulse card (executed per day, queue, who still has to sign) from the
// gateway's own history and queue on every chain, a sign banner for signers, multisig wording in the first steps.
const src = join(__dirname, '..', '..', '..')
const read = (p: string) => readFileSync(join(src, p), 'utf8')

const now = new Date(2026, 10, 8, 12).getTime()
const day = (d: number, h = 10) => new Date(2026, 10, d, h).getTime()
const tx = (timestamp: number, txStatus: Transaction['txStatus'], missing: string[] = []): Transaction =>
  ({
    id: `multisig_${timestamp}_${txStatus}`,
    timestamp,
    txStatus,
    txInfo: { type: 'Custom' } as never,
    executionInfo: {
      type: 'MULTISIG',
      nonce: 1,
      confirmationsRequired: 2,
      confirmationsSubmitted: 2 - missing.length,
      missingSigners: missing.map((value) => ({ value })),
    },
  }) as Transaction

const A = '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
const B = '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'
const C = '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC'
const owners = [
  { value: A, name: 'Ana' },
  { value: B, name: null },
  { value: C, name: 'Cy' },
]

describe('pulse helpers', () => {
  const history = [
    tx(day(8, 1), 'SUCCESS'),
    tx(day(7, 23), 'SUCCESS'),
    tx(day(7, 1), 'FAILED'),
    tx(day(1), 'CANCELLED'),
    tx(new Date(2026, 0, 1).getTime(), 'SUCCESS'),
  ]

  it('executed per day counts only successes, zero-filled, today last', () => {
    const bars = executedPerDay(history, 3, now)
    expect(bars.map((b) => b.v)).toEqual([0, 1, 1])
    expect(bars[2].day).toBe(new Date(2026, 10, 8).getTime())
    expect(executedPerDay([], 14).every((b) => b.v === 0)).toBe(true)
  })

  it('outcomes in the window; January is outside a 30-day window', () => {
    expect(outcomesInWindow(history, 30, now)).toEqual({ success: 2, failed: 1, cancelled: 1 })
  })

  it('the queue from each signer’s point of view', () => {
    const queue = [
      tx(day(8), 'AWAITING_CONFIRMATIONS', [A, B]),
      tx(day(8), 'AWAITING_CONFIRMATIONS', [B]),
      tx(day(8), 'AWAITING_EXECUTION'),
    ]
    const q = summarizeQueue(queue, owners, B.toLowerCase())
    expect(q.queued).toBe(3)
    expect(q.awaitingConfirmations).toBe(2)
    expect(q.awaitingExecution).toBe(1)
    expect(q.forYou).toBe(2)
    expect(q.signers.map((s) => [s.name, s.toSign])).toEqual([
      ['Ana', 1],
      [null, 2],
      ['Cy', 0],
    ])
    expect(summarizeQueue(queue, owners, undefined).forYou).toBe(0)
    expect(summarizeQueue(queue, owners, '0x1234').forYou).toBe(0)
  })
})

describe('the dashboard', () => {
  it('renders the pulse and the sign banner on every chain, not the testnet-only RPC widget', () => {
    const dash = read('components/dashboard/index.tsx')
    expect(dash).toContain('<MultisigPulse />')
    expect(dash).toContain('<SignBanner />')
    expect(dash).not.toContain('<GullySafeActivity />')
  })

  it('first steps say multisig', () => {
    const fs = read('components/dashboard/FirstSteps/index.tsx')
    expect(fs).not.toContain('Safe Account')
    expect(fs).toContain('Add funds to your multisig')
  })

  it('the pulse card holds its height, stops motion when asked, and never estimates', () => {
    expect(read('components/gully/MultisigPulse/styles.module.css')).toContain('min-height: 420px')
    expect(read('components/gully/SignBanner/styles.module.css')).toContain('prefers-reduced-motion')
    const card = read('components/gully/MultisigPulse/index.tsx')
    expect(card).toContain('No executed transactions in the last')
    expect(card).toContain('did not answer')
  })
})
