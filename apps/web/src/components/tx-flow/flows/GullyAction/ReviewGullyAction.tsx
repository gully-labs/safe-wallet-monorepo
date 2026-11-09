import { useCallback, useContext, useEffect, type PropsWithChildren } from 'react'
import { Stack, Typography } from '@mui/material'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import ReviewTransaction from '@/components/tx/ReviewTransactionV2'
import GullyDecoded from '@/components/gully/GullyDecoded'
import { createMultiSendCallOnlyTx, createTx } from '@/services/tx/tx-sender'
import type { GullyActionFlowProps } from '.'

/** Builds the Safe transaction from the panel's calls and shows each call decoded before the signers confirm. */
const ReviewGullyAction = ({
  params,
  onSubmit,
  children,
}: PropsWithChildren<{ params: GullyActionFlowProps; onSubmit: () => void }>) => {
  const { setSafeTx, setSafeTxError } = useContext(SafeTxContext)

  useEffect(() => {
    const build =
      params.calls.length === 1
        ? createTx({ to: params.calls[0].to, value: params.calls[0].value, data: params.calls[0].data })
        : createMultiSendCallOnlyTx(params.calls)
    build.then(setSafeTx).catch(setSafeTxError)
  }, [params.calls, setSafeTx, setSafeTxError])

  const onFormSubmit = useCallback(() => onSubmit(), [onSubmit])

  return (
    <ReviewTransaction onSubmit={onFormSubmit}>
      <Typography variant="h5" sx={{ mb: 1 }} data-testid="gully-action-summary">
        {params.summary}
      </Typography>
      <Stack spacing={1} data-testid="gully-action-preview">
        {params.calls.map((c, i) => (
          <GullyDecoded key={`${c.to}-${i}`} to={c.to} data={c.data} value={c.value} />
        ))}
      </Stack>
      <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1 }}>
        Nothing is sent yet. Your signers see this transaction in the queue and confirm it there.
      </Typography>
      {children}
    </ReviewTransaction>
  )
}

export default ReviewGullyAction
