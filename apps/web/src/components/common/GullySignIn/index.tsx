import { useEffect, useRef, useState, type ReactElement } from 'react'
import { GULLY_ID_CONFIG, loadGullyId, type GullyIdConfig } from './gullyId'

/**
 * Optional "Sign in with Gully" button for the header. Renders nothing unless NEXT_PUBLIC_GULLY_ID_CLIENT_ID is set
 * at build time and the Gully ID SDK loads. Identity only: it does not connect or replace the signing wallet.
 */
const GullySignIn = ({ config = GULLY_ID_CONFIG }: { config?: GullyIdConfig | null }): ReactElement | null => {
  const slot = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

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
      unmountButton = gully.renderButton(slot.current, { passkey: true, theme: 'dark' })
      setReady(true)
    })
    return () => {
      cancelled = true
      unmountButton?.()
    }
  }, [config])

  if (!config) return null
  return <div ref={slot} data-testid="gully-sign-in" style={ready ? { display: 'flex', alignItems: 'center' } : { display: 'none' }} />
}

export default GullySignIn
