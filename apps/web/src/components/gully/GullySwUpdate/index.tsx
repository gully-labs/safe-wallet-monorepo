import { useEffect } from 'react'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'

const CHECK_MS = 30 * 60_000

/**
 * Gully Safe: updates after a deploy take effect promptly.
 * The generated service worker already calls skipWaiting + clientsClaim, but a tab that is already open keeps running the
 * old code, and a worker update was only looked for on a page load. So: look for one when the tab comes back and every
 * 30 minutes, and when a NEW worker takes over a page that already had one, offer a reload. It never reloads by itself,
 * because a transaction may be half signed. Offline keeps working: this only reads the registration, and a failed check is ignored.
 */
export const watchForUpdates = (
  sw: Pick<ServiceWorkerContainer, 'controller' | 'addEventListener' | 'removeEventListener' | 'getRegistration'>,
  onNewVersion: () => void,
  doc: Pick<Document, 'visibilityState' | 'addEventListener' | 'removeEventListener'> = document,
): (() => void) => {
  let hadController = !!sw.controller
  const check = () => {
    sw.getRegistration()
      .then((reg) => reg?.update())
      .catch(() => {})
  }
  const onChange = () => {
    if (hadController) onNewVersion()
    hadController = true // the first worker of a first visit is not an update
  }
  const onVisible = () => {
    if (doc.visibilityState === 'visible') check()
  }
  sw.addEventListener('controllerchange', onChange)
  doc.addEventListener('visibilitychange', onVisible)
  const timer = setInterval(check, CHECK_MS)
  return () => {
    sw.removeEventListener('controllerchange', onChange)
    doc.removeEventListener('visibilitychange', onVisible)
    clearInterval(timer)
  }
}

const GullySwUpdate = (): null => {
  const dispatch = useAppDispatch()
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    return watchForUpdates(navigator.serviceWorker, () => {
      dispatch(
        showNotification({
          groupKey: 'gully-new-version',
          variant: 'info',
          message: 'A new version of Gully Safe is ready.',
          link: { title: 'Reload', onClick: () => window.location.reload() },
        }),
      )
    })
  }, [dispatch])
  return null
}

export default GullySwUpdate
