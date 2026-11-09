import { useEffect, useMemo, useState, type ReactElement } from 'react'
import { CountUp, DailyColumns, type DailyBar } from './charts'
import css from './styles.module.css'

/**
 * The welcome hero's live card: every chain the stats file lists (written every 5 minutes from each chain's own Safe
 * transaction service), mainnets first, with count-up numbers and a 30-day chart of multisigs created or transactions
 * executed per day. A chain added to the stats job shows up here with no code change. Nothing is made up: while the
 * file loads, or if it cannot, the numbers read an en dash and the chart is a placeholder bar row.
 */
type Daily = { day: string; n: number }
type ChainStat = {
  id: number
  name: string
  testnet?: boolean
  safes: number
  txs: number
  safes_daily?: Daily[]
  txs_daily?: Daily[]
}
const LOGO = (id: number) => `/cfg/media/chains/${id}/chain_logo.png`
const DAY = 86_400_000
const DAYS = 30
const REFRESH_MS = 60_000
type Metric = 'txs' | 'safes'

const last30 = (chains: ChainStat[], metric: Metric): DailyBar[] => {
  const today = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate())
  const bars = Array.from({ length: DAYS }, (_, i) => ({ day: today - (DAYS - 1 - i) * DAY, v: 0 }))
  for (const c of chains) {
    for (const d of (metric === 'txs' ? c.txs_daily : c.safes_daily) ?? []) {
      const idx = Math.round((Date.parse(`${d.day}T00:00:00Z`) - bars[0].day) / DAY)
      if (idx >= 0 && idx < DAYS) bars[idx].v += d.n
    }
  }
  return bars
}

const HeroLive = (): ReactElement => {
  const [chains, setChains] = useState<ChainStat[] | null>(null)
  const [metric, setMetric] = useState<Metric>('txs')

  useEffect(() => {
    let alive = true
    const load = () =>
      fetch('/landing/stats.json', { cache: 'no-cache' })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((d: { chains: ChainStat[] }) => alive && setChains(d.chains))
        .catch(() => alive && setChains((c) => c))
    load()
    const t = setInterval(load, REFRESH_MS)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [])

  const rows = useMemo(
    () => (chains ?? []).slice().sort((a, b) => Number(Boolean(a.testnet)) - Number(Boolean(b.testnet))),
    [chains],
  )
  const bars = useMemo(() => last30(rows, metric), [rows, metric])

  return (
    <aside className={css.heroLive} aria-label="Live numbers from the chains" data-testid="hero-live">
      <div className={css.heroLiveHead}>
        <img src="/brand/logo/gc-icon.svg" width={32} height={32} alt="" />
        <span>On-chain now</span>
      </div>
      {chains === null && <div className={css.heroLiveRow}>–</div>}
      {rows.map((c) => (
        <div key={c.id} className={css.heroLiveRow}>
          <img src={LOGO(c.id)} width={28} height={28} alt="" />
          <span className={css.heroLiveName}>
            <b>{c.name}</b>
            <small>{c.testnet ? 'test funds' : 'mainnet'}</small>
          </span>
          <span className={css.heroLiveNum}>
            <b>
              <CountUp value={c.safes} />
            </b>
            <small>multisigs</small>
          </span>
          <span className={css.heroLiveNum}>
            <b>
              <CountUp value={c.txs} />
            </b>
            <small>transactions</small>
          </span>
        </div>
      ))}
      <div className={css.heroChart}>
        <div className={css.heroChartTabs} role="group" aria-label="Chart">
          <button type="button" aria-pressed={metric === 'txs'} onClick={() => setMetric('txs')}>
            Transactions per day
          </button>
          <button type="button" aria-pressed={metric === 'safes'} onClick={() => setMetric('safes')}>
            Multisigs created per day
          </button>
        </div>
        <DailyColumns
          bars={bars}
          label={
            metric === 'txs'
              ? 'Multisig transactions executed per day, last 30 days, all chains'
              : 'Multisigs created per day, last 30 days, all chains'
          }
          unit={metric === 'txs' ? 'transactions' : 'multisigs'}
        />
      </div>
    </aside>
  )
}

export default HeroLive
