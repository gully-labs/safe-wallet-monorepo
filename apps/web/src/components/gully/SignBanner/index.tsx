import type { ReactElement } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Button } from '@mui/material'
import { AppRoutes } from '@/config/routes'
import { useQueuePulse } from '@/components/gully/MultisigPulse/usePulse'
import css from './styles.module.css'

/**
 * Gully Multisig: the one line a signer needs when opening a multisig. "N transactions await your signature" with the
 * way forward, or "N ready to execute" when the threshold is met. Nothing when there is nothing to do or the connected
 * wallet is not a signer (the pulse card still shows the queue).
 */
const SignBanner = (): ReactElement | null => {
  const p = useQueuePulse()
  const router = useRouter()
  if (!p.ready || !p.isSigner) return null
  const toSign = p.queue.forYou
  const toExecute = p.queue.awaitingExecution
  if (toSign === 0 && toExecute === 0) return null
  const queueUrl = { pathname: AppRoutes.transactions.queue, query: { safe: router.query.safe } }

  return (
    <div className={css.banner} role="status" data-testid="sign-banner">
      <span className={css.dot} aria-hidden="true" />
      <p className={css.text}>
        {toSign > 0 ? (
          <>
            <b>
              {toSign} {toSign === 1 ? 'transaction awaits' : 'transactions await'} your signature.
            </b>
            {toExecute > 0 && ` ${toExecute} ${toExecute === 1 ? 'is' : 'are'} ready to execute.`}
          </>
        ) : (
          <b>
            {toExecute} {toExecute === 1 ? 'transaction is' : 'transactions are'} ready to execute.
          </b>
        )}
      </p>
      <Button component={Link} href={queueUrl} variant="contained" size="small" disableElevation className={css.btn}>
        {toSign > 0 ? 'Review and sign' : 'Execute'}
      </Button>
    </div>
  )
}

export default SignBanner
