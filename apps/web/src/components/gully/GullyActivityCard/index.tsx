import { useEffect, useMemo, useState, type ReactElement } from 'react'
import { CountUp } from '@/components/gully/landing/charts'
import Sparkline from './Sparkline'
import { agoText, readCache, STATS_URL, summarize, writeCache, type StatsFile } from './stats'
import css from './styles.module.css'

const POLL_MS = 60_000
const LOGO = (id: number) => `/cfg/media/chains/${id}/chain_logo.png`

type Feed = { stats: StatsFile | null; error: string | null; loading: boolean }

/** The feed: last-known numbers from this browser first, then the live file, refreshed each minute while visible. */
export const useActivityFeed = (): Feed => {
  const [state, setState] = useState<Feed>(() => ({
    stats: typeof window === 'undefined' ? null : readCache(window.sessionStorage),
    error: null,
    loading: true,
  }))

  useEffect(() => {
    let alive = true
    let timer: ReturnType<typeof setTimeout> | undefined
    const tick = async () => {
      if (document.visibilityState === 'visible') {
        try {
          const r = await fetch(STATS_URL, { cache: 'no-cache' })
          if (!r.ok) throw new Error(`HTTP ${r.status}`)
          const d = (await r.json()) as StatsFile
          if (!Array.isArray(d?.chains)) throw new Error('unexpected file')
          if (!alive) return
          writeCache(window.sessionStorage, d)
          setState({ stats: d, error: null, loading: false })
        } catch (e) {
          if (!alive) return
          setState((prev) => ({ stats: prev.stats, error: (e as Error).message || 'no response', loading: false }))
        }
      }
      if (alive) timer = setTimeout(tick, POLL_MS)
    }
    tick()
    return () => {
      alive = false
      if (timer) clearTimeout(timer)
    }
  }, [])

  return state
}

/**
 * Gully Multisig, "My multisigs": what is happening on the chains this app serves, live. Multisigs created, transactions
 * executed and chains served, counted up, then one row per chain with two 30-day sparklines. Real numbers only: the
 * feed is each chain's Safe transaction service; while it loads the numbers read an en dash, and if it cannot be read
 * the card says so and keeps the last numbers this browser saw.
 */
const GullyActivityCard = (): ReactElement => {
  const { stats, error, loading } = useActivityFeed()
  const summary = useMemo(() => summarize(stats), [stats])

  return (
    <section
      className={css.card}
      aria-label="Activity on the chains Gully Multisig serves"
      data-testid="gully-activity"
    >
      <div className={css.head}>
        <img src="/brand/logo/gc-icon.svg" width={22} height={22} alt="" />
        <h2 className={css.title}>On-chain now</h2>
        <span className={`${css.live} ${error ? css.liveStale : ''}`} aria-live="polite">
          <i aria-hidden="true" />
          {error ? 'feed stale' : loading && !summary ? 'reading' : 'live'}
        </span>
        <span className={css.upd}>{summary ? agoText(summary.updated) : ''}</span>
      </div>

      <div className={css.kpis}>
        <div className={css.kpi}>
          <b>{summary ? <CountUp value={summary.multisigs} /> : '–'}</b>
          <span>multisigs created</span>
        </div>
        <div className={css.kpi}>
          <b>{summary ? <CountUp value={summary.transactions} /> : '–'}</b>
          <span>transactions executed</span>
        </div>
        <div className={css.kpi}>
          <b>{summary ? <CountUp value={summary.chains} /> : '–'}</b>
          <span>chains served</span>
        </div>
      </div>

      {summary ? (
        <ul className={css.chains}>
          {summary.perChain.map((c) => (
            <li key={c.id} className={css.chain}>
              <div className={css.chainHead}>
                <img src={LOGO(c.id)} width={24} height={24} alt="" />
                <b>{c.name}</b>
                <span className={`${css.tag} ${c.kind === 'testnet' ? css.tagTest : css.tagMain}`}>{c.kind}</span>
                <span className={css.chainNums}>
                  <b>{c.multisigs}</b> multisigs · <b>{c.transactions}</b> transactions
                </span>
              </div>
              {c.multisigs === 0 && c.transactions === 0 ? (
                <p className={css.note}>No activity yet on {c.name}.</p>
              ) : (
                <div className={css.sparks}>
                  <figure className={css.fig}>
                    <figcaption>Multisigs created, 30 days</figcaption>
                    <Sparkline points={c.created} label={`Multisigs created per day on ${c.name}`} unit="multisigs" />
                  </figure>
                  <figure className={css.fig}>
                    <figcaption>
                      Transactions executed, 30 days <small>({c.last7} in the last 7)</small>
                    </figcaption>
                    <Sparkline
                      points={c.executed}
                      label={`Transactions executed per day on ${c.name}`}
                      unit="transactions"
                    />
                  </figure>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className={css.note} role="status">
          {loading && !error
            ? 'Reading the chains…'
            : `The activity feed did not answer (${error ?? 'no response'}). Retrying every minute.`}
        </p>
      )}
      {summary && error && (
        <p className={css.note} role="status">
          These numbers may be behind: the last refresh failed ({error}). Retrying every minute.
        </p>
      )}
    </section>
  )
}

export default GullyActivityCard
