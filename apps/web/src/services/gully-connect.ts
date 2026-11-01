/**
 * Gully Safe: the shared Gully Chain "Connect a wallet" dialog (gully-ops sites/_shared/gc-connect/gc-connect.js 1.0.0,
 * byte-identical copy in public/assets/gc-connect.js). Order: Gully Wallet (Gully ID passkey), WalletConnect (QR),
 * detected EIP-6963 wallets, then MetaMask / Rabby / Coinbase Wallet install links.
 *
 * The dialog only picks the wallet (and asks it for accounts inside the user's click, so the Gully Wallet pop-up is
 * not blocked); web3-onboard still owns the connection: the pick is mapped to an onboard wallet label and connected
 * with `autoSelect` + `disableModals`, so every Safe code path (wallet state, chain switching, signing) is unchanged.
 */
import { BRAND_NAME, WC_PROJECT_ID } from '@/config/constants'

export const GC_CONNECT_SRC = '/assets/gc-connect.js'
export const GC_CONNECT_VERSION = '1.0.0'
export const GULLY_WALLET_LABEL = 'Gully Wallet'
export const GULLY_WALLET_RDNS = 'xyz.gullyid.wallet'
export const WALLETCONNECT_LABEL = 'WalletConnect'

export type GullyConnectKind = 'gully' | 'walletconnect' | 'injected'

export type GullyConnectResult = {
  kind: GullyConnectKind
  id: string
  name: string
  rdns: string | null
  provider: unknown
  accounts: string[]
}

export type GullyConnectOpenOptions = {
  appName?: string
  request?: boolean
  walletConnect?: () => Promise<unknown>
}

export type GullyConnectApi = {
  VERSION: string
  open: (opts: GullyConnectOpenOptions) => Promise<GullyConnectResult>
}

declare global {
  interface Window {
    GullyConnect?: GullyConnectApi
  }
}

let loading: Promise<GullyConnectApi | null> | null = null

/** Loads public/assets/gc-connect.js once. Resolves null when it cannot load (the caller falls back to onboard). */
export const loadGullyConnect = (src = GC_CONNECT_SRC, timeoutMs = 8000): Promise<GullyConnectApi | null> => {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (window.GullyConnect) return Promise.resolve(window.GullyConnect)
  if (loading) return loading

  loading = new Promise((resolve) => {
    const s = document.createElement('script')
    const timer = setTimeout(() => done(null), timeoutMs)
    function done(api: GullyConnectApi | null) {
      clearTimeout(timer)
      s.onload = s.onerror = null
      if (!api) loading = null
      resolve(api)
    }
    s.src = src
    s.async = true
    s.onload = () => done(window.GullyConnect ?? null)
    s.onerror = () => done(null)
    document.head.appendChild(s)
  })
  return loading
}

/** Tests only. */
export const resetGullyConnectLoader = () => {
  loading = null
}

/**
 * Stand-in "provider" for the WalletConnect row: the dialog hands control back at once and web3-onboard's own
 * WalletConnect module (with NEXT_PUBLIC_WC_PROJECT_ID) shows the QR code. Without a project id the row reads "Soon".
 */
const onboardWalletConnect = async () => ({ isOnboardWalletConnect: true, request: async () => [] })

/** The web3-onboard wallet label for a dialog pick. */
export const onboardLabelFor = (r: Pick<GullyConnectResult, 'kind' | 'name' | 'rdns'>): string => {
  if (r.kind === 'gully' || r.rdns === GULLY_WALLET_RDNS) return GULLY_WALLET_LABEL
  if (r.kind === 'walletconnect') return WALLETCONNECT_LABEL
  // gc-connect names a non-EIP-6963 window.ethereum "Browser wallet"; web3-onboard calls it MetaMask / Detected Wallet
  if (/^Browser wallet \(MetaMask\)$/.test(r.name)) return 'MetaMask'
  if (/^Browser wallet$/.test(r.name)) return 'Detected Wallet'
  return r.name
}

export type GullyPick = { label: string; kind: GullyConnectKind }

/**
 * Opens the dialog. Resolves:
 *   { label, kind }  the wallet to connect with web3-onboard autoSelect
 *   null             the user closed the dialog (do nothing)
 *   undefined        the dialog is not available (fall back to the web3-onboard modal)
 */
export const pickWallet = async (load: () => Promise<GullyConnectApi | null> = loadGullyConnect): Promise<GullyPick | null | undefined> => {
  const api = await load()
  if (!api) return undefined
  try {
    const r = await api.open({
      appName: BRAND_NAME,
      request: true,
      walletConnect: WC_PROJECT_ID ? onboardWalletConnect : undefined,
    })
    return { label: onboardLabelFor(r), kind: r.kind }
  } catch (e) {
    if ((e as { code?: number })?.code === 4001) return null
    return undefined
  }
}
