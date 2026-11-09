import { liveCss, loadModule } from './index'

/**
 * Gully Live UI toast (gl-actions.js `<gl-toast>`) for the transaction successes: proposed, signed, executed.
 * Returns true when the kit toast was shown; false while the module is not loaded yet (and always in jsdom), so the
 * caller keeps the app's own notification. Never both: the caller shows its snackbar only when this returns false.
 */
type Href = string | { pathname?: string | null; query?: Record<string, unknown> | string | null } | undefined | null

/** Internal app paths only (the toast link opens in the same tab; outside links stay in the snackbar). */
export const toastHref = (href: Href): string => {
  if (!href) return ''
  if (typeof href === 'string') return href.startsWith('/') ? href : ''
  const path = href.pathname ?? ''
  if (!path.startsWith('/')) return ''
  const q = href.query
  if (!q || typeof q === 'string') return q ? `${path}?${q}` : path
  const qs = new URLSearchParams(
    Object.entries(q)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)]),
  ).toString()
  return qs ? `${path}?${qs}` : path
}

type ToastEl = HTMLElement & { show: (msg: string, opts: { kind?: string; href?: string; ms?: number }) => unknown }

export const showGlToast = (message: string, { href }: { href?: Href } = {}): boolean => {
  if (typeof document === 'undefined' || typeof customElements === 'undefined') return false
  if (!customElements.get('gl-toast')) {
    loadModule('gl-actions.js')
    return false
  }
  let el = document.querySelector('gl-toast') as ToastEl | null
  if (!el) {
    el = document.createElement('gl-toast') as ToastEl
    // the kit tokens (toast reads --gl-ink / --gl-surface / --gl-up / --gl-font) on the toast itself
    el.className = liveCss.glKit
    document.body.append(el)
  }
  if (typeof el.show !== 'function') return false
  el.show(message, { kind: 'good', href: toastHref(href), ms: 6000 })
  return true
}

/** Start loading gl-actions.js early so the first success already gets the kit toast. */
export const preloadGlToast = (): void => loadModule('gl-actions.js')
