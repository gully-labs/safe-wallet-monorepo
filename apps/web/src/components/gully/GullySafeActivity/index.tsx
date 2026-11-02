import { useMemo, type ReactElement } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useGullySafeStats } from '@/components/gully/landing/useGullySafeStats'
import { CountUp, DailyColumns } from '@/components/gully/landing/charts'
import css from './styles.module.css'

const GULLY_TESTNET = '485590'
const DAYS = 14
const DAY = 86_400_000

const startOfDay = (t: number): number => {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Executed transactions per day, oldest first, today last. */
export const dailyExecutions = (timestamps: number[], days = DAYS, now = Date.now()): { day: number; v: number }[] => {
  const today = startOfDay(now)
  const bars = Array.from({ length: days }, (_, i) => ({ day: today - (days - 1 - i) * DAY, v: 0 }))
  for (const t of timestamps) {
    const i = days - 1 - Math.round((today - startOfDay(t)) / DAY)
    if (i >= 0 && i < days) bars[i].v += 1
  }
  return bars
}

/**
 * Gully Safe: this Safe's activity on Gully Chain Testnet, live from the chain (read-only, no signing or tx code here).
 * Renders nothing on any other chain, so the upstream screens stay as they are.
 */
const GullySafeActivity = (): ReactElement | null => {
  const { safe, safeAddress } = useSafeInfo()
  if (safe.chainId !== GULLY_TESTNET || !safeAddress) return null
  return <Activity safeAddress={safeAddress} />
}

const Activity = ({ safeAddress }: { safeAddress: string }): ReactElement => {
  const { data, error, loading } = useGullySafeStats()
  const me = safeAddress.toLowerCase()

  const mine = useMemo(() => (data?.executions ?? []).filter((e) => e.safe === me), [data, me])
  const bars = useMemo(() => dailyExecutions(mine.map((e) => e.timestamp)), [mine])
  const inWindow = bars.reduce((sum, b) => sum + b.v, 0)

  const dash = !data
  return (
    <section className={css.card} aria-label="This Safe on Gully Chain Testnet" data-testid="gully-safe-activity">
      <div className={css.head}>
        <h2 className={css.title}>This Safe on Gully Chain</h2>
        <span className={css.tag}>Testnet</span>
      </div>
      <div className={css.kpis}>
        <div className={css.kpi}>
          <b>{dash ? '–' : <CountUp value={mine.length} />}</b>
          <span>transactions executed</span>
        </div>
        <div className={css.kpi}>
          <b>{dash ? '–' : <CountUp value={inWindow} />}</b>
          <span>in the last {DAYS} days</span>
        </div>
        <div className={css.kpi}>
          <b>{dash ? '–' : <CountUp value={data.safes.length} />}</b>
          <span>Safes on Gully Chain</span>
        </div>
      </div>
      <div className={css.plot}>
        {data ? (
          <DailyColumns bars={bars} label="This Safe's executed transactions per day" unit="transactions" />
        ) : (
          <p className={css.note} role="status">
            {loading ? 'Reading the chain…' : `The chain did not answer (${error ?? 'no response'}). Retrying every 20 seconds.`}
          </p>
        )}
      </div>
      {data && error && (
        <p className={css.note} role="status">
          These numbers may be behind: the last refresh failed. Retrying every 20 seconds.
        </p>
      )}
    </section>
  )
}

export default GullySafeActivity
