import { useMemo, type ReactElement } from 'react'
import useChainId from '@/hooks/useChainId'
import useSafeAddress from '@/hooks/useSafeAddress'
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
 * Gully Multisig: this Safe's activity on Gully Chain Testnet, live from the chain (read-only, no signing or tx code here).
 * Renders nothing on any other chain, so the upstream screens stay as they are. It reads the chain and address from the
 * URL, not the loaded Safe info, so its place is held from the first paint and nothing below it jumps.
 */
const GullySafeActivity = (): ReactElement | null => {
  const chainId = useChainId()
  const safeAddress = useSafeAddress()
  if (chainId !== GULLY_TESTNET) return null
  return <Activity safeAddress={safeAddress} />
}

const Activity = ({ safeAddress }: { safeAddress: string }): ReactElement => {
  const { data, error, loading } = useGullySafeStats()
  const me = safeAddress.toLowerCase()

  const mine = useMemo(() => (data?.executions ?? []).filter((e) => e.safe === me), [data, me])
  const bars = useMemo(() => dailyExecutions(mine.map((e) => e.timestamp)), [mine])
  const inWindow = bars.reduce((sum, b) => sum + b.v, 0)

  const dash = !data || !safeAddress
  return (
    <section className={css.card} aria-label="This multisig on Gully Chain Testnet" data-testid="gully-safe-activity">
      <div className={css.head}>
        <h2 className={css.title}>This multisig on Gully Chain</h2>
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
          <b>{!data ? '–' : <CountUp value={data.safes.length} />}</b>
          <span>Safes on Gully Chain</span>
        </div>
      </div>
      <div className={css.plot}>
        {data && safeAddress ? (
          <DailyColumns bars={bars} label="This multisig's executed transactions per day" unit="transactions" />
        ) : (
          <p className={css.note} role="status">
            {loading || data
              ? 'Reading the chain…'
              : `The chain did not answer (${error ?? 'no response'}). Retrying every 20 seconds.`}
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
