import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import GullyIdSigner, { GULLY_ID_SIGNER_TEXT } from '../index'
import { pickGullyIdAddress } from '../gullyIdWallet'
import * as gullyIdWallet from '../gullyIdWallet'
import useWallet from '@/hooks/wallets/useWallet'
import type { GullySession } from '@/components/common/GullySignIn/gullyId'

jest.mock('@/hooks/wallets/useWallet')

const A = '0x1111111111111111111111111111111111111111'
const B = '0x2222222222222222222222222222222222222222'
const session = (wallets: GullySession['user']['wallets']): GullySession => ({
  via: 'passkey',
  accessToken: 't',
  idToken: null,
  expiresAt: 0,
  user: { sub: 's', name: 'n', gullyName: null, avatar: null, wallet: null, wallets, amr: [] },
})

describe('pickGullyIdAddress', () => {
  it('prefers the wallet of the chain, then a chain-less smart account, and never an EOA or a bad address', () => {
    const s = session([
      { chainId: 6714, address: B, kind: 'kernel-v3.3' },
      { chainId: 485590, address: A, kind: 'kernel-v3.3' },
      { chainId: 485590, address: '0x3333333333333333333333333333333333333333', kind: 'eoa' },
    ])
    expect(pickGullyIdAddress(s, '485590')).toBe(A)
    expect(pickGullyIdAddress(s, 6714)).toBe(B)
    expect(pickGullyIdAddress(session([{ chainId: null, address: A, kind: 'kernel-v3.3' }]), '1')).toBe(A)
    expect(pickGullyIdAddress(session([{ chainId: 1, address: A, kind: 'kernel-v3.3' }]), '5')).toBeNull()
    expect(pickGullyIdAddress(session([{ chainId: 1, address: 'nope', kind: 'kernel-v3.3' }]), '1')).toBeNull()
    expect(pickGullyIdAddress(null, '1')).toBeNull()
  })
})

describe('GullyIdSigner', () => {
  afterEach(() => jest.restoreAllMocks())

  it('explains the signer when the Gully Wallet is connected', () => {
    ;(useWallet as jest.Mock).mockReturnValue({ label: 'Gully Wallet', address: A })
    jest.spyOn(gullyIdWallet, 'readGullyIdSession').mockResolvedValue(null)
    render(<GullyIdSigner chainId="485590" existing={[A]} onAdd={jest.fn()} />)
    expect(screen.getByTestId('gully-id-signer-note')).toHaveTextContent(GULLY_ID_SIGNER_TEXT)
  })

  it('offers the Gully ID wallet to a user with another wallet, once, and adds it on click', async () => {
    ;(useWallet as jest.Mock).mockReturnValue({ label: 'MetaMask', address: B })
    jest
      .spyOn(gullyIdWallet, 'readGullyIdSession')
      .mockResolvedValue(session([{ chainId: 485590, address: A, kind: 'kernel-v3.3' }]))
    const onAdd = jest.fn()
    render(<GullyIdSigner chainId="485590" existing={[B]} onAdd={onAdd} />)
    fireEvent.click(await screen.findByTestId('gully-id-signer-add'))
    expect(onAdd).toHaveBeenCalledWith(A)
  })

  it('shows nothing when not signed in, or when the address is already a signer', async () => {
    ;(useWallet as jest.Mock).mockReturnValue({ label: 'MetaMask', address: B })
    const spy = jest.spyOn(gullyIdWallet, 'readGullyIdSession').mockResolvedValue(null)
    const { container, rerender } = render(<GullyIdSigner chainId="485590" existing={[B]} onAdd={jest.fn()} />)
    await waitFor(() => expect(spy).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
    spy.mockResolvedValue(session([{ chainId: 485590, address: A, kind: 'kernel-v3.3' }]))
    rerender(<GullyIdSigner chainId="485590" existing={[A]} onAdd={jest.fn()} />)
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(2))
    expect(container).toBeEmptyDOMElement()
  })
})
