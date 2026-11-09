import { useEffect, useMemo, useRef, useState } from 'react'
import type { Transaction, TransactionItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { FEATURES } from '@safe-global/utils/utils/chains'
import useSafeInfo from '@/hooks/useSafeInfo'
import useTxQueue from '@/hooks/useTxQueue'
import useWallet from '@/hooks/wallets/useWallet'
import { useHasFeature } from '@/hooks/useChains'
import { useAppSelector } from '@/store'
import { selectSettings } from '@/store/settingsSlice'
import { selectTxHistory } from '@/store/txHistorySlice'
import { getTxHistory } from '@/services/transactions'
import { isTransactionListItem, isTransactionQueuedItem } from '@/utils/transaction-guards'
import { executedPerDay, outcomesInWindow, summarizeQueue, WINDOW_DAYS } from './pulse'

const MAX_PAGES = 5
const DAY = 86_400_000

const txsOf = (page?: TransactionItemPage): Transaction[] =>
  (page?.results ?? []).filter(isTransactionListItem).map((i) => i.transaction)

/**
 * The open multisig's history for the chart window. The latest page is always in the store (the app loads it for the
 * transactions list); older pages are fetched only while they still reach into the window, up to MAX_PAGES, so a
 * busy multisig costs at most five gateway calls and a quiet one none.
 */
const useWindowHistory = (): { txs: Transaction[]; loading: boolean; error: string | null; partial: boolean } => {
  const latest = useAppSelector(selectTxHistory)
  const { hideSuspiciousTransactions } = useAppSelector(selectSettings)
  const hasDefaultTokenlist = useHasFeature(FEATURES.DEFAULT_TOKENLIST)
  const hideUntrusted = (hasDefaultTokenlist && hideSuspiciousTransactions) ?? true
  const hideImitation = hideSuspiciousTransactions ?? true
  const {
    safe: { chainId },
    safeAddress,
  } = useSafeInfo()

  const [older, setOlder] = useState<{ key: string; txs: Transaction[]; error: string | null; partial: boolean }>({
    key: '',
    txs: [],
    error: null,
    partial: false,
  })
  const [loadingOlder, setLoadingOlder] = useState(false)
  const busy = useRef(false)

  const first = latest.data
  const key = `${chainId}:${safeAddress}:${first?.next ?? ''}`

  useEffect(() => {
    if (!first || !safeAddress || busy.current || older.key === key) return
    const since = Date.now() - WINDOW_DAYS * DAY
    const firstTxs = txsOf(first)
    const oldest = firstTxs.length ? firstTxs[firstTxs.length - 1].timestamp : 0
    if (!first.next || oldest < since) {
      setOlder({ key, txs: [], error: null, partial: false })
      return
    }
    let alive = true
    busy.current = true
    setLoadingOlder(true)
    ;(async () => {
      const acc: Transaction[] = []
      let next: string | null | undefined = first.next
      let pages = 0
      let partial = false
      try {
        while (next && pages < MAX_PAGES - 1) {
          const page: TransactionItemPage = (await getTxHistory(
            chainId,
            safeAddress,
            hideUntrusted,
            hideImitation,
            next,
          )) as TransactionItemPage
          pages += 1
          const txs = txsOf(page)
          acc.push(...txs)
          next = page.next
          if (txs.length && txs[txs.length - 1].timestamp < since) break
        }
        partial = Boolean(next) && (acc.length ? acc[acc.length - 1].timestamp >= since : true)
        if (alive) setOlder({ key, txs: acc, error: null, partial })
      } catch (e) {
        if (alive) setOlder({ key, txs: acc, error: (e as Error).message || 'history unavailable', partial: true })
      } finally {
        busy.current = false
        if (alive) setLoadingOlder(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [first, key, chainId, safeAddress, hideUntrusted, hideImitation, older.key])

  const txs = useMemo(() => [...txsOf(first), ...(older.key === key ? older.txs : [])], [first, older, key])
  return {
    txs,
    loading: latest.loading || loadingOlder,
    error: latest.error ?? (older.key === key ? older.error : null),
    partial: older.key === key && older.partial,
  }
}

export type Pulse = {
  ready: boolean
  loading: boolean
  error: string | null
  partial: boolean
  perDay: ReturnType<typeof executedPerDay>
  outcomes: ReturnType<typeof outcomesInWindow>
  queue: ReturnType<typeof summarizeQueue>
  threshold: number
  isSigner: boolean
}

export type QueuePulse = {
  ready: boolean
  loading: boolean
  error: string | null
  queue: ReturnType<typeof summarizeQueue>
  threshold: number
  isSigner: boolean
}

/** The queue from the connected signer's point of view: store data only, no extra gateway call. */
export const useQueuePulse = (): QueuePulse => {
  const { safe, safeLoaded } = useSafeInfo()
  const wallet = useWallet()
  const { page: queuePage, loading: queueLoading, error: queueError } = useTxQueue()
  const queueTxs = useMemo(
    () => (queuePage?.results ?? []).filter(isTransactionQueuedItem).map((i) => i.transaction),
    [queuePage],
  )
  const queue = useMemo(
    () => summarizeQueue(queueTxs, safe.owners ?? [], wallet?.address),
    [queueTxs, safe.owners, wallet],
  )
  const isSigner = Boolean(wallet && safe.owners?.some((o) => o.value.toLowerCase() === wallet.address.toLowerCase()))
  return {
    ready: safeLoaded && !queueLoading,
    loading: queueLoading,
    error: queueError ?? null,
    queue,
    threshold: safe.threshold,
    isSigner,
  }
}

export const usePulse = (): Pulse => {
  const q = useQueuePulse()
  const history = useWindowHistory()
  const perDay = useMemo(() => executedPerDay(history.txs), [history.txs])
  const outcomes = useMemo(() => outcomesInWindow(history.txs), [history.txs])

  return {
    ...q,
    ready: q.ready && !history.loading,
    loading: history.loading || q.loading,
    error: history.error ?? q.error,
    partial: history.partial,
    perDay,
    outcomes,
  }
}
