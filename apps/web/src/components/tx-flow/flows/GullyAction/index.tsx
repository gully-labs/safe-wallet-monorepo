import { useContext } from 'react'
import { TxFlow } from '../../TxFlow'
import { TxFlowContext } from '../../TxFlowProvider'
import { TxFlowType } from '@/services/analytics'
import ReviewGullyAction from './ReviewGullyAction'
import type { GullyCall } from '@/services/gully-actions'
import type { ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'

export type GullyActionFlowProps = {
  title: string
  summary: string
  calls: GullyCall[]
}

const ReviewStep = (props: ReviewTransactionProps) => {
  const { data } = useContext(TxFlowContext)
  return <ReviewGullyAction params={data as GullyActionFlowProps} {...props} />
}

/** A Safe transaction proposed from the Gully panel: one call, or several in one MultiSend. */
const GullyActionFlow = (props: GullyActionFlowProps) => (
  <TxFlow
    initialData={props}
    subtitle={props.title}
    eventCategory={TxFlowType.GULLY_ACTION}
    ReviewTransactionComponent={ReviewStep}
  />
)

export default GullyActionFlow
