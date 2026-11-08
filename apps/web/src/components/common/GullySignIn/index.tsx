import { useEffect, useRef, useState, type ReactElement } from 'react'
import { useDarkMode } from '@/hooks/useDarkMode'
import useWallet from '@/hooks/wallets/useWallet'
import { GULLY_WALLET_LABEL } from '@/services/gully-connect'
import { GULLY_ID_CONFIG, loadGullyId, markGullyIdFlag, type GullyClient, type GullyIdConfig } from './gullyId'
import { GULLY_LEGAL_CONSENT_TEXT } from '@/components/common/GullyLegal'

/**
 * "Sign in with Gully ID" in the header: the official button drawn by the Gully ID SDK (renderButton), next to the
 * existing Connect wallet button. On by default (NEXT_PUBLIC_GULLY_ID_SIGNIN=off hides it). Identity only: it does
 * not connect or replace the signing wallet. Renders nothing if the SDK cannot load.
 *
 * A wallet connected through the Gully ID wallet (the "Gully Wallet" onboard module) IS a Gully ID account: the user
 * already signed in there. The button is then never drawn; an account chip takes its place (the Gully name from the SDK
 * session when there is one, else the short wallet address), and the SDK is asked once for a silent session so the
 * session and the wallet agree (silentSignIn is the Gully ID SDK's silent pickup, a no-op on SDK versions without it).
 */
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`

type SilentClient = GullyClient & { silentSignIn?: () => Promise<unknown> }

const GullySignIn = ({ config = GULLY_ID_CONFIG }: { config?: GullyIdConfig | null }): ReactElement | null => {
  const slot = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [name, setName] = useState<string | null>(null)
  const isDark = useDarkMode()
  const wallet = useWallet()
  const viaGullyWallet = wallet?.label === GULLY_WALLET_LABEL

  useEffect(() => {
    markGullyIdFlag(config)
  }, [config])

  useEffect(() => {
    if (!config) return
    let cancelled = false
    let unmountButton: (() => void) | undefined
    let offChange: (() => void) | undefined
    loadGullyId(config).then(async (gully) => {
      if (!gully || cancelled) return
      try {
        await gully.handleRedirect()
      } catch {
        // A stale or foreign ?code= is not fatal: the button still works.
      }
      if (cancelled) return
      if (viaGullyWallet) {
        const pick = (s: ReturnType<GullyClient['session']>) => setName(s?.user.gullyName || s?.user.name || null)
        pick(gully.session?.() ?? null)
        offChange = gully.onChange?.(pick)
        try {
          await (gully as SilentClient).silentSignIn?.()
        } catch {
          // no silent session: the chip still shows the wallet's account
        }
        return
      }
      if (!slot.current) return
      unmountButton = gully.renderButton(slot.current, { passkey: false, theme: isDark ? 'dark' : 'light', size: 's' })
      setReady(true)
    })
    return () => {
      cancelled = true
      unmountButton?.()
      offChange?.()
      setReady(false)
    }
  }, [config, isDark, viaGullyWallet])

  if (!config) return null

  if (viaGullyWallet && wallet) {
    return (
      <div
        data-testid="gully-id-chip"
        title="Signed in with Gully ID"
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}
      >
        <img src="/brand/logo/gc-icon.svg" alt="" width={18} height={18} />
        <span>{name ?? short(wallet.address)}</span>
      </div>
    )
  }

  // The header has no room for a text line: the consent line is the sign-in button's tooltip
  return (
    <div
      ref={slot}
      data-testid="gully-sign-in"
      title={GULLY_LEGAL_CONSENT_TEXT}
      style={ready ? { display: 'flex', alignItems: 'center' } : { display: 'none' }}
    />
  )
}

export default GullySignIn
