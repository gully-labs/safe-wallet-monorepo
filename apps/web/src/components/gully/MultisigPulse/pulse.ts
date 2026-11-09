import type { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { isMultisigExecutionInfo } from '@/utils/transaction-guards'

/**
 * Gully Multisig dashboard pulse: pure helpers over the transactions the gateway already serves for the open multisig
 * (history pages and the queue). Nothing is estimated; a day with no executed transaction is a zero.
 */

export const WINDOW_DAYS = 30
const DAY = 86_400_000

export type DayPoint = { day: number; v: number }

const startOfDay = (t: number): number => {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Executed (SUCCESS) transactions per local day, oldest first, today last. FAILED/CANCELLED are not executions. */
export const executedPerDay = (txs: Transaction[], days = WINDOW_DAYS, now = Date.now()): DayPoint[] => {
  const today = startOfDay(now)
  const out: DayPoint[] = Array.from({ length: days }, (_, i) => ({ day: today - (days - 1 - i) * DAY, v: 0 }))
  for (const tx of txs) {
    if (tx.txStatus !== 'SUCCESS') continue
    const i = days - 1 - Math.round((today - startOfDay(tx.timestamp)) / DAY)
    if (i >= 0 && i < days) out[i].v += 1
  }
  return out
}

export type Outcomes = { success: number; failed: number; cancelled: number }

/** Outcomes of the history transactions in the window (timestamp within the last `days`). */
export const outcomesInWindow = (txs: Transaction[], days = WINDOW_DAYS, now = Date.now()): Outcomes => {
  const since = startOfDay(now) - (days - 1) * DAY
  const o: Outcomes = { success: 0, failed: 0, cancelled: 0 }
  for (const tx of txs) {
    if (tx.timestamp < since) continue
    if (tx.txStatus === 'SUCCESS') o.success += 1
    else if (tx.txStatus === 'FAILED') o.failed += 1
    else if (tx.txStatus === 'CANCELLED') o.cancelled += 1
  }
  return o
}

export type SignerLoad = { address: string; name: string | null; toSign: number }

export type QueueSummary = {
  queued: number
  awaitingConfirmations: number
  awaitingExecution: number
  /** queued transactions the connected wallet still has to sign (0 when it is not a signer) */
  forYou: number
  /** per signer: how many queued transactions still miss its signature */
  signers: SignerLoad[]
}

/** The queue from each signer's point of view. Owners come from the Safe; missing signers from each queued tx. */
export const summarizeQueue = (queue: Transaction[], owners: AddressInfo[], wallet?: string | null): QueueSummary => {
  const me = wallet?.toLowerCase() ?? null
  const miss = new Map<string, number>()
  for (const o of owners) miss.set(o.value.toLowerCase(), 0)
  let awaitingConfirmations = 0
  let awaitingExecution = 0
  let forYou = 0
  for (const tx of queue) {
    if (tx.txStatus === 'AWAITING_CONFIRMATIONS') awaitingConfirmations += 1
    else if (tx.txStatus === 'AWAITING_EXECUTION') awaitingExecution += 1
    if (!isMultisigExecutionInfo(tx.executionInfo)) continue
    for (const s of tx.executionInfo.missingSigners ?? []) {
      const k = s.value.toLowerCase()
      if (miss.has(k)) miss.set(k, (miss.get(k) ?? 0) + 1)
      if (me && k === me) forYou += 1
    }
  }
  return {
    queued: queue.length,
    awaitingConfirmations,
    awaitingExecution,
    forYou,
    signers: owners.map((o) => ({
      address: o.value,
      name: o.name ?? null,
      toSign: miss.get(o.value.toLowerCase()) ?? 0,
    })),
  }
}
