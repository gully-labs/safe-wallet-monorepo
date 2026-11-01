import { useEffect, useRef, useState, type ReactElement } from 'react'
import { useDarkMode } from '@/hooks/useDarkMode'
import { GULLY_ID_CONFIG, loadGullyId, markGullyIdFlag, type GullyIdConfig } from './gullyId'

/**
 * "Sign in with Gully ID" in the header: the official button drawn by the Gully ID SDK (renderButton), next to the
 * existing Connect wallet button. On by default (NEXT_PUBLIC_GULLY_ID_SIGNIN=off hides it). Identity only: it does
 * not connect or replace the signing wallet. Renders nothing if the SDK cannot load.
 */
const GullySignIn = ({ config = GULLY_ID_CONFIG }: { config?: GullyIdConfig | null }): ReactElement | null => {
  const slot = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const isDark = useDarkMode()

  useEffect(() => {
    markGullyIdFlag(config)
  }, [config])

  useEffect(() => {
    if (!config) return
    let cancelled = false
    let unmountButton: (() => void) | undefined
    loadGullyId(config).then(async (gully) => {
      if (!gully || cancelled || !slot.current) return
      try {
        await gully.handleRedirect()
      } catch {
        // A stale or foreign ?code= is not fatal: the button still works.
      }
      if (cancelled || !slot.current) return
      unmountButton = gully.renderButton(slot.current, { passkey: false, theme: isDark ? 'dark' : 'light', size: 's' })
      setReady(true)
    })
    return () => {
      cancelled = true
      unmountButton?.()
    }
  }, [config, isDark])

  if (!config) return null
  return (
    <div
      ref={slot}
      data-testid="gully-sign-in"
      style={ready ? { display: 'flex', alignItems: 'center' } : { display: 'none' }}
    />
  )
}

export default GullySignIn
