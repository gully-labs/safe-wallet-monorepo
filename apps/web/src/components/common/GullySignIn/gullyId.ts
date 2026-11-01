// Sign in with Gully ID for Gully Safe (contract: gully-id docs/gully-id-current-spec.md). On by default: the flag
// NEXT_PUBLIC_GULLY_ID_SIGNIN=off hides the button (the code path stays). Client id gully-safe, issuer gullyid.xyz,
// both overridable at build time. Identity only: wallet connection and Safe signing are unchanged (the browser wallet
// stays the signer), and the Gully ID token is never treated as permission for anything. The SDK is fetched lazily
// (/sdk/v1.js, falling back to /sdk.js); any failure resolves to null so the header shows no button.

export const DEFAULT_GULLY_ID_ISSUER = 'https://gullyid.xyz'
export const DEFAULT_GULLY_ID_CLIENT_ID = 'gully-safe'

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
      size?: 's' | 'm' | 'l'
    },
  ): () => void
}

type GullyIDGlobal = { init(opts: { clientId: string; issuer?: string }): GullyClient }

export type GullyIdConfig = { clientId: string; issuer: string }

/** The flag: on unless `signin` is "off" (also false/0/no). Blank client id or issuer = the Gully Safe defaults. */
export const getGullyIdConfig = (signin?: string, clientId?: string, issuer?: string): GullyIdConfig | null => {
  if (/^(off|false|0|no)$/i.test(signin?.trim() ?? '')) return null
  return {
    clientId: clientId?.trim() || DEFAULT_GULLY_ID_CLIENT_ID,
    issuer: (issuer?.trim() || DEFAULT_GULLY_ID_ISSUER).replace(/\/+$/, ''),
  }
}

// Literal process.env reads so Next inlines them at build time.
export const GULLY_ID_CONFIG = getGullyIdConfig(
  process.env.NEXT_PUBLIC_GULLY_ID_SIGNIN,
  process.env.NEXT_PUBLIC_GULLY_ID_CLIENT_ID,
  process.env.NEXT_PUBLIC_GULLY_ID_ISSUER,
)

/** The SDK URLs, tried in order: the 1.x channel, then the legacy all-majors URL (live before the v1 channel). */
export const sdkUrls = (issuer: string): string[] => [`${issuer}/sdk/v1.js`, `${issuer}/sdk.js`]

/** Publishes the flag on <html data-gully-id="on|off" data-gully-id-client="..."> so a live audit can read it. */
export const markGullyIdFlag = (cfg: GullyIdConfig | null): void => {
  if (typeof document === 'undefined') return
  const el = document.documentElement
  el.dataset.gullyId = cfg ? 'on' : 'off'
  if (cfg) el.dataset.gullyIdClient = cfg.clientId
  else delete el.dataset.gullyIdClient
}

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
    const timer = setTimeout(() => resolve(null), timeoutMs)
    const urls = sdkUrls(cfg.issuer)
    const tryNext = (i: number) => {
      if (i >= urls.length) {
        clearTimeout(timer)
        return resolve(null)
      }
      const script = document.createElement('script')
      script.src = urls[i]
      script.async = true
      script.onload = () => {
        if (!w.GullyID) return tryNext(i + 1)
        clearTimeout(timer)
        init()
      }
      script.onerror = () => {
        script.remove()
        tryNext(i + 1)
      }
      document.head.appendChild(script)
    }
    tryNext(0)
  })
  return loading
}

/** Test helper: forget the cached loader. */
export const __resetGullyIdForTests = () => {
  loading = null
}
