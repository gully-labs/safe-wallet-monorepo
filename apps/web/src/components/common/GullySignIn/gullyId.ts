// Sign in with Gully (Gully ID) for Gully Safe. Optional and flagged: nothing loads or renders unless the build sets
// NEXT_PUBLIC_GULLY_ID_CLIENT_ID (production: gully-safe). Identity only: wallet connection and Safe signing are
// unchanged, and the Gully ID token is never treated as permission for anything. The SDK is fetched lazily from the
// Gully ID server; any failure resolves to null so the header shows no button.

export const DEFAULT_GULLY_ID_ISSUER = 'https://gullyid.xyz'

export type GullyWallet = { chainId: number | null; address: string; kind: 'kernel-v3.3' | 'eoa' }

export type GullySession = {
  via: 'oidc' | 'passkey'
  accessToken: string
  idToken: string | null
  expiresAt: number
  user: {
    sub: string
    name: string
    gullyName: string | null
    avatar: string | null
    wallet: (GullyWallet & { chainId: number }) | null
    wallets: GullyWallet[]
    amr: string[]
  }
}

export type GullyClient = {
  handleRedirect(): Promise<GullySession | null>
  session(): GullySession | null
  signOut(): Promise<void>
  onChange(cb: (s: GullySession | null) => void): () => void
  renderButton(
    el: HTMLElement,
    o?: {
      onSignIn?: (s: GullySession) => void
      onError?: (e: unknown) => void
      label?: string
      passkey?: boolean
      theme?: 'dark' | 'light'
    },
  ): () => void
}

type GullyIDGlobal = { init(opts: { clientId: string; issuer?: string }): GullyClient }

export type GullyIdConfig = { clientId: string; issuer: string }

/** The flag. An unset or blank client id turns the feature off (null). */
export const getGullyIdConfig = (clientId?: string, issuer?: string): GullyIdConfig | null => {
  const id = clientId?.trim()
  if (!id) return null
  return { clientId: id, issuer: (issuer?.trim() || DEFAULT_GULLY_ID_ISSUER).replace(/\/+$/, '') }
}

// Literal process.env reads so Next inlines them at build time.
export const GULLY_ID_CONFIG = getGullyIdConfig(
  process.env.NEXT_PUBLIC_GULLY_ID_CLIENT_ID,
  process.env.NEXT_PUBLIC_GULLY_ID_ISSUER,
)

let loading: Promise<GullyClient | null> | null = null

/** Loads sdk.js once and inits the client. Resolves null when off, server-side, blocked, offline or timed out. */
export const loadGullyId = (cfg: GullyIdConfig | null, timeoutMs = 8000): Promise<GullyClient | null> => {
  if (!cfg || typeof window === 'undefined' || typeof document === 'undefined') return Promise.resolve(null)
  if (loading) return loading
  loading = new Promise<GullyClient | null>((resolve) => {
    const w = window as Window & { GullyID?: GullyIDGlobal }
    const init = () => {
      try {
        resolve(w.GullyID ? w.GullyID.init({ clientId: cfg.clientId, issuer: cfg.issuer }) : null)
      } catch {
        resolve(null)
      }
    }
    if (w.GullyID) return init()
    const script = document.createElement('script')
    script.src = `${cfg.issuer}/sdk.js`
    script.async = true
    const timer = setTimeout(() => resolve(null), timeoutMs)
    script.onload = () => {
      clearTimeout(timer)
      init()
    }
    script.onerror = () => {
      clearTimeout(timer)
      resolve(null)
    }
    document.head.appendChild(script)
  })
  return loading
}

/** Test helper: forget the cached loader. */
export const __resetGullyIdForTests = () => {
  loading = null
}
