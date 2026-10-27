import { GA_TRACKING_ID, IS_PRODUCTION, SAFE_APPS_GA_TRACKING_ID } from '@/config/constants'
import { GoogleAnalytics } from '@next/third-parties/google'
import { useEffect } from 'react'

const Analytics = () => {
  useEffect(() => {
    // This needs to be added once in order for events with send_to: SAFE_APPS_GA_TRACKING_ID to work
    window.gtag?.('config', SAFE_APPS_GA_TRACKING_ID, { debug_mode: !IS_PRODUCTION })

    window.gtag?.('consent', 'default', {
      ad_storage: 'denied',
      analytics_storage: 'denied',
      functionality_storage: 'granted',
      personalization_storage: 'denied',
      security_storage: 'granted',
      wait_for_update: 500,
    })
  }, [])

  // Gully Safe: without a tracking ID, do not load gtag.js from Google at all
  if (!GA_TRACKING_ID) return null

  return <GoogleAnalytics gaId={GA_TRACKING_ID} debugMode={!IS_PRODUCTION} />
}

export default Analytics
