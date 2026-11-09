import { render } from '@/tests/test-utils'
import { Interface } from 'ethers'
import GullyDecoded, { GullyDecodedView } from '../index'

const ALICE = '0x2222222222222222222222222222222222222222'
const TOKEN = '0x1111111111111111111111111111111111111111'

describe('GullyDecoded', () => {
  it('shows the sentence and keeps a careful call as a warning', () => {
    const { getByTestId, getByText } = render(
      <GullyDecodedView
        described={{
          title: 'Give up ownership of the contract for good',
          lines: ['Nobody can use the owner powers afterwards.'],
          level: 'careful',
          group: 'access',
          needsToken: [],
        }}
      />,
    )
    expect(getByTestId('gully-decoded-title')).toHaveTextContent('Give up ownership of the contract for good')
    expect(getByText('Nobody can use the owner powers afterwards.')).toBeInTheDocument()
    expect(getByText(/The raw data is below/)).toBeInTheDocument()
  })

  it('renders nothing for a selector it does not know', () => {
    const { container } = render(<GullyDecoded to={TOKEN} data="0x895a74850000" value="0" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('decodes a Gully Core call found in the data of a multisig transaction', () => {
    const data = new Interface(['function setBuilderFee(uint16 newFee)']).encodeFunctionData('setBuilderFee', [3000])
    const { getByTestId } = render(<GullyDecoded to={ALICE} data={data} value="0" />)
    expect(getByTestId('gully-decoded-title')).toHaveTextContent('Set the Gully Core builder fee to 0.30%')
  })
})
