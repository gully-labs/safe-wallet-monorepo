import type { OnboardAPI } from '@web3-onboard/core'
import { join } from 'path'
import { onboardLabelFor, pickWallet, GULLY_WALLET_LABEL, type GullyConnectApi } from '@/services/gully-connect'
import { connectWithGullyDialog } from '@/components/common/ConnectWallet/useConnectWallet'
import * as useOnboard from '@/hooks/wallets/useOnboard'

describe('gully-connect: dialog pick -> web3-onboard label', () => {
  it('maps every kind of pick', () => {
    expect(onboardLabelFor({ kind: 'gully', name: 'Gully Wallet', rdns: 'xyz.gullyid.wallet' })).toBe(GULLY_WALLET_LABEL)
    expect(onboardLabelFor({ kind: 'injected', name: 'Gully Wallet', rdns: 'xyz.gullyid.wallet' })).toBe(GULLY_WALLET_LABEL)
    expect(onboardLabelFor({ kind: 'walletconnect', name: 'WalletConnect', rdns: null })).toBe('WalletConnect')
    expect(onboardLabelFor({ kind: 'injected', name: 'Rabby Wallet', rdns: 'io.rabby' })).toBe('Rabby Wallet')
    expect(onboardLabelFor({ kind: 'injected', name: 'Browser wallet (MetaMask)', rdns: '' })).toBe('MetaMask')
    expect(onboardLabelFor({ kind: 'injected', name: 'Browser wallet', rdns: '' })).toBe('Detected Wallet')
  })

  it('asks the wallet inside the click (request: true) and hides WalletConnect without a project id', async () => {
    const open = jest.fn().mockResolvedValue({ kind: 'gully', id: 'gully', name: 'Gully Wallet', rdns: 'xyz.gullyid.wallet', provider: {}, accounts: [] })
    const pick = await pickWallet(async () => ({ VERSION: '1.0.0', open }) as GullyConnectApi)
    expect(pick).toEqual({ label: GULLY_WALLET_LABEL, kind: 'gully' })
    expect(open.mock.calls[0][0]).toMatchObject({ request: true, walletConnect: undefined })
  })

  it('null when the user closes the dialog, undefined when the dialog is unavailable', async () => {
    const closed = { VERSION: '1.0.0', open: jest.fn().mockRejectedValue(Object.assign(new Error('closed'), { code: 4001 })) }
    expect(await pickWallet(async () => closed as GullyConnectApi)).toBeNull()
    expect(await pickWallet(async () => null)).toBeUndefined()
  })
})

describe('connectWithGullyDialog', () => {
  const onboard = {} as OnboardAPI
  afterEach(() => jest.restoreAllMocks())

  it('connects the pick with autoSelect and no onboard modal', async () => {
    const spy = jest.spyOn(useOnboard, 'connectWallet').mockResolvedValue([{ label: 'Rabby Wallet' } as never])
    const refresh = jest.fn()
    await connectWithGullyDialog(onboard, refresh, async () => ({ label: 'Rabby Wallet', kind: 'injected' }))
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(onboard, { autoSelect: { label: 'Rabby Wallet', disableModals: true } })
    expect(refresh).not.toHaveBeenCalled()
  })

  it('re-reads the wallet modules before connecting the Gully Wallet', async () => {
    const order: string[] = []
    jest.spyOn(useOnboard, 'connectWallet').mockImplementation(async () => {
      order.push('connect')
      return [{ label: GULLY_WALLET_LABEL } as never]
    })
    await connectWithGullyDialog(onboard, async () => void order.push('refresh'), async () => ({ label: GULLY_WALLET_LABEL, kind: 'gully' }))
    expect(order).toEqual(['refresh', 'connect'])
  })

  it('falls back to the onboard modal when onboard does not know the wallet or the dialog is missing', async () => {
    const spy = jest.spyOn(useOnboard, 'connectWallet').mockResolvedValueOnce([]).mockResolvedValue(undefined)
    await connectWithGullyDialog(onboard, undefined, async () => ({ label: 'Unknown', kind: 'injected' }))
    expect(spy).toHaveBeenLastCalledWith(onboard)
    spy.mockClear()
    await connectWithGullyDialog(onboard, undefined, async () => undefined)
    expect(spy).toHaveBeenCalledWith(onboard)
    spy.mockClear()
    await connectWithGullyDialog(onboard, undefined, async () => null)
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('public/assets/gc-connect.js (the shared dialog)', () => {
  it('lists Gully Wallet, then WalletConnect, then detected wallets, then install links', async () => {
    // a detected EIP-6963 wallet announces itself
    window.addEventListener('eip6963:requestProvider', () => {
      window.dispatchEvent(
        new CustomEvent('eip6963:announceProvider', {
          detail: { info: { uuid: 'u-1', name: 'Rabby Wallet', rdns: 'io.rabby', icon: 'data:image/svg+xml;base64,AA==' }, provider: { request: jest.fn() } },
        }),
      )
    })
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const api = require(join(__dirname, '..', '..', '..', 'public', 'assets', 'gc-connect.js')) as GullyConnectApi
    expect(api.VERSION).toBe('1.0.0')
    void api.open({ appName: 'Gully Safe' }).catch(() => undefined)
    const host = document.querySelector('gc-connect-dialog') as HTMLElement
    const root = (host.shadowRoot ?? host) as ParentNode
    const titles = Array.from(root.querySelectorAll('.row .t b')).map((b) => b.textContent)
    expect(titles[0]).toBe('Gully Wallet')
    expect(titles[1]).toBe('WalletConnect')
    expect(titles[2]).toBe('Rabby Wallet')
    expect(titles.slice(3)).toEqual(['MetaMask', 'Coinbase Wallet'])
    expect(root.querySelector('h2')?.textContent).toBe('Connect a wallet to Gully Safe')
    const links = Array.from(root.querySelectorAll('a.row')).map((a) => a.getAttribute('href'))
    expect(links).toEqual(['https://metamask.io/download/', 'https://www.coinbase.com/wallet/downloads'])
  })
})
