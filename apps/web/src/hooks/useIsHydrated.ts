import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/**
 * false in the server render and in the hydration pass, true after it (and at once for anything mounted later).
 *
 * Gully Multisig: use it to gate render output on a client-only value. Next's static export prerenders every page with
 * router.isReady === false, but the browser hydrates a page without a query string with router.isReady === true, so
 * output that branches on router.isReady differs between the two and React throws #418 (hydration mismatch).
 */
export const useIsHydrated = (): boolean =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
