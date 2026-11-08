import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import GullyActions from '../index'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import useChainId from '@/hooks/useChainId'

jest.mock('@/hooks/useChainId')
jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default: ({ children }: { children: (ok: boolean) => ReactNode }) => <>{children(true)}</>,
}))
jest.mock('@/components/tx-flow/flows', () => ({
  GullyActionFlow: () => null,
}))

const setTxFlow = jest.fn()
const renderPanel = () =>
  render(
    <TxModalContext.Provider value={{ setTxFlow } as unknown as TxModalContextType}>
      <GullyActions />
    </TxModalContext.Provider>,
  )

describe('GullyActions', () => {
  beforeEach(() => {
    setTxFlow.mockClear()
  })

  it('says so on a chain without Gully records', () => {
    ;(useChainId as jest.Mock).mockReturnValue('1')
    renderPanel()
    expect(screen.getByTestId('gully-actions-unsupported')).toBeInTheDocument()
  })

  it('opens the Safe flow with the builder fee call on Anubis', () => {
    ;(useChainId as jest.Mock).mockReturnValue('6714')
    renderPanel()
    fireEvent.change(screen.getByLabelText('Builder fee (%)'), { target: { value: '0.10' } })
    fireEvent.click(screen.getByText('Set builder fee'))
    expect(setTxFlow).toHaveBeenCalledTimes(1)
    const element = setTxFlow.mock.calls[0][0]
    expect(element.props.summary).toBe('Set the Gully Core builder fee to 0.10%')
    expect(element.props.calls[0].to).toBe('0xC576eBFE93B3e524b2310d283E5eA6A91869cc7F')
  })

  it('shows the reason instead of opening a flow when the input is wrong', () => {
    ;(useChainId as jest.Mock).mockReturnValue('6714')
    renderPanel()
    fireEvent.change(screen.getByLabelText('Builder fee (%)'), { target: { value: '5' } })
    fireEvent.click(screen.getByText('Set builder fee'))
    expect(setTxFlow).not.toHaveBeenCalled()
    expect(screen.getByTestId('gully-actions-error')).toHaveTextContent('between 0% and 0.40%')
  })

  it('explains that the testnet fee controller has no builder fee', () => {
    ;(useChainId as jest.Mock).mockReturnValue('485590')
    renderPanel()
    fireEvent.click(screen.getByText('Set builder fee'))
    expect(setTxFlow).not.toHaveBeenCalled()
    expect(screen.getByTestId('gully-actions-error')).toHaveTextContent('older Gully Core fee controller')
  })

  it('proposes a payout with the chain default token', () => {
    ;(useChainId as jest.Mock).mockReturnValue('485590')
    renderPanel()
    fireEvent.change(screen.getByLabelText('Payouts (address amount)'), {
      target: { value: '0x2222222222222222222222222222222222222222 500\n0x3333333333333333333333333333333333333333 12.5' },
    })
    fireEvent.click(screen.getByText('Propose payouts'))
    const element = setTxFlow.mock.calls[0][0]
    expect(element.props.calls).toHaveLength(2)
    expect(element.props.summary).toBe('Pay 512.5 USDC.e to 2 recipients')
  })
})
