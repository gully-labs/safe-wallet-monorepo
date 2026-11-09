import type { ReactElement } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Skeleton } from '@mui/material'
import { CountUp, DailyColumns } from '@/components/gully/landing/charts'
import EthHashInfo from '@/components/common/EthHashInfo'
import { AppRoutes } from '@/config/routes'
import { usePulse } from './usePulse'
import { WINDOW_DAYS } from './pulse'
import css from './styles.module.css'

/**
 * Gully Multisig dashboard: this multisig's pulse on its chain, from the gateway's own history and queue (every chain
 * the app serves, no RPC). Executed transactions per day for 30 days, what sits in the queue and who still has to sign.
 * Holds its height from the first paint so the widgets below do not jump; dashes while the gateway answers.
 */
const MultisigPulse = (): ReactElement => {
  const p = usePulse()
  const router = useRouter()
  const queueUrl = { pathname: AppRoutes.transactions.queue, query: { safe: router.query.safe } }
  const historyUrl = { pathname: AppRoutes.transactions.history, query: { safe: router.query.safe } }
  const executed = p.outcomes.success
  const dash = !p.ready && executed === 0 && p.queue.queued === 0

  return (
    <section className={css.card} aria-label={`This multisig, last ${WINDOW_DAYS} days`} data-testid="multisig-pulse">
      <div className={css.head}>
        <h2 className={css.title}>This multisig</h2>
        <span className={css.sub}>last {WINDOW_DAYS} days</span>
        <Link href={historyUrl} className={css.link}>
          History
        </Link>
      </div>

      <div className={css.kpis}>
        <div className={css.kpi}>
          <b>{dash ? '–' : <CountUp value={executed} />}</b>
          <span>executed</span>
        </div>
        <div className={css.kpi}>
          <b>{dash ? '–' : <CountUp value={p.queue.queued} />}</b>
          <span>in the queue</span>
        </div>
        <div className={`${css.kpi} ${p.queue.forYou > 0 ? css.kpiHot : ''}`}>
          <b>{dash ? '–' : p.isSigner ? <CountUp value={p.queue.forYou} /> : '–'}</b>
          <span>{p.isSigner ? 'await your signature' : 'not a signer here'}</span>
        </div>
      </div>

      <div className={css.plot}>
        {p.ready || executed > 0 ? (
          <DailyColumns bars={p.perDay} label="Executed transactions per day" unit="transactions" />
        ) : (
          <Skeleton variant="rounded" height={200} />
        )}
      </div>
      {p.ready && executed === 0 && !p.error && (
        <p className={css.note} role="status">
          No executed transactions in the last {WINDOW_DAYS} days.
        </p>
      )}
      {(p.outcomes.failed > 0 || p.outcomes.cancelled > 0) && (
        <p className={css.note}>
          Also in this window: {p.outcomes.failed} failed, {p.outcomes.cancelled} cancelled.
        </p>
      )}
      {p.partial && !p.error && (
        <p className={css.note}>Older pages of the history were not all read; the chart may miss early days.</p>
      )}
      {p.error && (
        <p className={css.note} role="status">
          The gateway did not answer fully ({p.error}). Numbers may be behind.
        </p>
      )}

      <div className={css.signers}>
        <div className={css.signersHead}>
          <h3>Signers</h3>
          <span>
            {p.threshold} of {p.queue.signers.length} required
          </span>
          {p.queue.queued > 0 && (
            <Link href={queueUrl} className={css.link}>
              Open the queue
            </Link>
          )}
        </div>
        <ul className={css.signerList}>
          {p.queue.signers.map((s) => (
            <li key={s.address} className={css.signer}>
              <EthHashInfo
                address={s.address}
                name={s.name}
                showAvatar
                avatarSize={24}
                shortAddress
                showCopyButton={false}
              />
              <span className={`${css.toSign} ${s.toSign > 0 ? css.toSignHot : ''}`}>
                {s.toSign > 0 ? `${s.toSign} to sign` : 'up to date'}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default MultisigPulse
