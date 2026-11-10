import { createElement, useEffect, useMemo, useRef, type ReactElement } from 'react'
import { useRouter } from 'next/router'
import useChains, { useCurrentChain } from '@/hooks/useChains'
import useChainId from '@/hooks/useChainId'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useSafeApps } from '@/hooks/safe-apps/useSafeApps'
import { getNetworkLink } from '@/components/common/NetworkSelector'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'

/** The shared Gully chain switcher, served from this host as a byte-identical copy of gully-ops sites/_shared/gc-chain-switcher. */
export const SWITCHER_SRC = '/assets/gc-chain-switcher.js'
/** Version of that copy (gully-ops sites/_shared/gc-chain-switcher; 1.0.4 adds property setters, which React 19 needs). */
export const SWITCHER_VERSION = '1.0.4'
export const SWITCHER_SURFACE = 'multisig'

/** Where the browser can ask this chain's transaction service whether it is up (same host for Gully's own stacks). */
export const healthUrl = (transactionService: string | undefined, origin: string): string | undefined => {
  if (!transactionService) return undefined
  const m = transactionService.match(/^https?:\/\/nginx(?::\d+)?(\/[^?#]*)$/)
  if (m) return `${origin}${m[1].replace(/\/$/, '')}/api/v1/about/`
  if (/^https:\/\//.test(transactionService)) return `${transactionService.replace(/\/$/, '')}/api/v1/about/`
  return undefined
}

let loading: Promise<void> | null = null
/** Loads the module once per page (it defines the custom element). */
export const loadSwitcher = (doc: Document = document): Promise<void> => {
  if (loading) return loading
  loading = new Promise<void>((resolve) => {
    if (customElements.get('gc-chain-switcher')) return resolve()
    const s = doc.createElement('script')
    s.type = 'module'
    s.src = SWITCHER_SRC
    s.onload = () => resolve()
    s.onerror = () => resolve() // the header still has the fallback text below
    doc.head.appendChild(s)
  })
  return loading
}

type ChainChange = CustomEvent<{ chainId: string | number }>

/**
 * Gully Multisig header: the ONE Gully chain switcher (<gc-chain-switcher>, owner spec of 2026-11-09, identical on every
 * Gully surface), mounted with surface="multisig" so the Gully Core manifest decides which chains show (Anubis, Gully
 * Chain testnet, Elysium as Coming until its record flips) and in mode="event": the component only tells us the pick,
 * the Safe app's own chain config stays the source for routing (the same links as before, deep links keep working).
 * The health dot reads the chain's RPC plus this chain's transaction service (`health`), and the toast is ours.
 */
const GullyChainSwitcher = (): ReactElement => {
  const host = useRef<HTMLElement | null>(null)
  const { configs } = useChains()
  const chainId = useChainId()
  const current = useCurrentChain()
  const router = useRouter()
  const safeAddress = useSafeAddress()
  const { currentSafeApp } = useSafeApps()
  const isDark = useDarkMode()
  const dispatch = useAppDispatch()

  const health = useMemo(
    () => healthUrl(current?.transactionService, typeof location === 'undefined' ? '' : location.origin),
    [current?.transactionService],
  )

  useEffect(() => {
    loadSwitcher()
  }, [])

  useEffect(() => {
    const el = host.current
    if (!el) return
    const onChange = (e: Event) => {
      const id = String((e as ChainChange).detail?.chainId ?? '')
      const chain = configs.find((c) => c.chainId === id)
      if (!chain) return
      trackEvent({ ...OVERVIEW_EVENTS.SWITCH_NETWORK, label: id })
      if (id !== chainId) {
        router.push(getNetworkLink(router, safeAddress, chain, currentSafeApp))
        dispatch(
          showNotification({ variant: 'info', groupKey: 'chain-switch', message: `Switched to ${chain.chainName}.` }),
        )
      }
    }
    el.addEventListener('gc-chain-change', onChange)
    return () => el.removeEventListener('gc-chain-change', onChange)
  }, [configs, chainId, router, safeAddress, currentSafeApp, dispatch])

  // a custom element: attributes are strings; React sets them as attributes on unknown tags
  return createElement('gc-chain-switcher', {
    ref: host,
    surface: SWITCHER_SURFACE,
    mode: 'event',
    current: chainId,
    theme: isDark ? 'dark' : 'light',
    'compact-below': '480',
    ...(health ? { health } : {}),
    'data-testid': 'gully-chain-trigger',
    'aria-label': `Network: ${current?.chainName ?? 'loading'}`,
  })
}

export default GullyChainSwitcher
