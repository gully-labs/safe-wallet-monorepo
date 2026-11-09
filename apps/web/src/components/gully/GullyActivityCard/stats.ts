/**
 * Gully Multisig activity feed: the file the product landing already reads (/landing/stats.json), written every five
 * minutes on the box from each chain's own Safe transaction service (gully-ops l3/bin/msig-stats.sh). Pure helpers, so
 * the card and its tests share one definition of "a day" and "a total". Nothing here invents a number: a chain with no
 * rows is a chain with zero activity, and a missing file is a missing file (the card shows dashes and says why).
 */

export type DailyCount = { day: string; n: number }

export type ChainStats = {
  id: number
  name: string
  safes: number
  txs: number
  safes_daily?: DailyCount[]
  txs_daily?: DailyCount[]
}

export type StatsFile = { updated: string; chains: ChainStats[] }

export type DayPoint = { day: number; v: number }

export type ChainSummary = {
  id: number
  name: string
  kind: 'testnet' | 'mainnet'
  multisigs: number
  transactions: number
  created: DayPoint[]
  executed: DayPoint[]
  last7: number
}

export type Summary = {
  multisigs: number
  transactions: number
  chains: number
  updated: number | null
  perChain: ChainSummary[]
}

export const STATS_URL = '/landing/stats.json'
export const STATS_CACHE_KEY = 'gully-multisig-activity-v1'
export const WINDOW_DAYS = 30

const DAY = 86_400_000

const startOfDay = (t: number): number => {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** "YYYY-MM-DD" from the service (UTC day) to the local midnight of that calendar day. */
const dayToLocal = (day: string): number => {
  const [y, m, d] = day.split('-').map(Number)
  if (!y || !m || !d) return NaN
  return new Date(y, m - 1, d).getTime()
}

/** Zero-filled counts per local day for the last `days` days, oldest first, today last. Rows outside the window drop. */
export const dailySeries = (daily: DailyCount[] | undefined, days = WINDOW_DAYS, now = Date.now()): DayPoint[] => {
  const today = startOfDay(now)
  const out: DayPoint[] = Array.from({ length: days }, (_, i) => ({ day: today - (days - 1 - i) * DAY, v: 0 }))
  for (const row of daily ?? []) {
    const t = dayToLocal(row.day)
    if (Number.isNaN(t)) continue
    const i = days - 1 - Math.round((today - t) / DAY)
    if (i >= 0 && i < days) out[i].v += Number(row.n) || 0
  }
  return out
}

export const chainKind = (name: string): 'testnet' | 'mainnet' => (/testnet/i.test(name) ? 'testnet' : 'mainnet')

/** Totals across chains plus the per-chain series the card draws. Chains come back in the file's order. */
export const summarize = (stats: StatsFile | null | undefined, now = Date.now()): Summary | null => {
  if (!stats || !Array.isArray(stats.chains)) return null
  const perChain: ChainSummary[] = stats.chains.map((c) => {
    const executed = dailySeries(c.txs_daily, WINDOW_DAYS, now)
    return {
      id: Number(c.id),
      name: String(c.name),
      kind: chainKind(String(c.name)),
      multisigs: Number(c.safes) || 0,
      transactions: Number(c.txs) || 0,
      created: dailySeries(c.safes_daily, WINDOW_DAYS, now),
      executed,
      last7: executed.slice(-7).reduce((s, p) => s + p.v, 0),
    }
  })
  const updated = Date.parse(stats.updated)
  return {
    multisigs: perChain.reduce((s, c) => s + c.multisigs, 0),
    transactions: perChain.reduce((s, c) => s + c.transactions, 0),
    chains: perChain.length,
    updated: Number.isNaN(updated) ? null : updated,
    perChain,
  }
}

/** "updated 3 min ago" style text; never a made-up time. */
export const agoText = (updated: number | null, now = Date.now()): string => {
  if (updated === null) return 'update time unknown'
  const s = Math.max(0, Math.round((now - updated) / 1000))
  if (s < 90) return 'updated just now'
  const m = Math.round(s / 60)
  if (m < 90) return `updated ${m} min ago`
  const h = Math.round(m / 60)
  if (h < 36) return `updated ${h} h ago`
  return `updated ${Math.round(h / 24)} d ago`
}

export const readCache = (storage: Pick<Storage, 'getItem'> | undefined): StatsFile | null => {
  try {
    const raw = storage?.getItem(STATS_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StatsFile
    return Array.isArray(parsed?.chains) ? parsed : null
  } catch {
    return null
  }
}

export const writeCache = (storage: Pick<Storage, 'setItem'> | undefined, stats: StatsFile): void => {
  try {
    storage?.setItem(STATS_CACHE_KEY, JSON.stringify(stats))
  } catch {
    // storage full or blocked: the card still works from memory
  }
}
