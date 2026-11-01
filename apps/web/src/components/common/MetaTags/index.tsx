import { BRAND_NAME, IS_PRODUCTION, IS_BEHIND_IAP } from '@/config/constants'
import { ContentSecurityPolicy, StrictTransportSecurity } from '@/config/securityHeaders'
import { lightPalette, darkPalette } from '@safe-global/theme'

// Gully Safe: multisig smart accounts on Gully Chain. Absolute URLs are required for OG/Twitter images.
const descriptionText = `${BRAND_NAME}: create and run multisig Safe smart accounts on Gully Chain (chain 485590). Shared custody, owner thresholds and batched transactions, built on Safe{Wallet}.`
const OG_IMAGE_URL = 'https://safe.gullychain.xyz/og-image.png'
const titleText = BRAND_NAME
const landingTitle = `${BRAND_NAME} – Multisig smart accounts on Gully Chain`
const SITE_URL = 'https://safe.gullychain.xyz'

// Only the public landing pages are indexable; every other route is wallet/app state and gets noindex.
// '/' only redirects to /welcome, so both share the /welcome canonical. Keep in sync with public/robots.txt + sitemap.xml.
const INDEXABLE_ROUTES: Record<string, string> = {
  '/': '/welcome',
  '/welcome': '/welcome',
  '/gully-services': '/gully-services',
}

const MetaTags = ({ prefetchUrl, pathname }: { prefetchUrl: string; pathname: string }) => {
  const canonicalPath = INDEXABLE_ROUTES[pathname]
  const indexable = IS_PRODUCTION && canonicalPath !== undefined
  const canonicalUrl = canonicalPath ? `${SITE_URL}${canonicalPath}` : undefined

  return (
    <>
      <meta name="description" content={descriptionText} />
      <meta name="robots" content={indexable ? 'index, follow' : 'noindex, nofollow'} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      {/* Social sharing */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={titleText} />
      <meta property="og:image" content={OG_IMAGE_URL} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Gully Safe on GullyChain: the GullyChain icon and the GullyChain mascot" />
      <meta property="og:description" content={descriptionText} />
      <meta property="og:title" content={canonicalUrl ? landingTitle : titleText} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={canonicalUrl ? landingTitle : titleText} />
      <meta name="twitter:description" content={descriptionText} />
      <meta name="twitter:image" content={OG_IMAGE_URL} />

      {/* CSP */}
      <meta httpEquiv="Content-Security-Policy" content={ContentSecurityPolicy} />
      {IS_PRODUCTION && <meta httpEquiv="Strict-Transport-Security" content={StrictTransportSecurity} />}

      {/* Prefetch the backend domain */}
      <link rel="dns-prefetch" href={prefetchUrl} />
      <link rel="preconnect" href={prefetchUrl} crossOrigin="" />

      {/* Mobile tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

      {/* PWA primary color and manifest */}
      <meta name="theme-color" content={lightPalette.background.main} media="(prefers-color-scheme: light)" />
      <meta name="theme-color" content={darkPalette.background.main} media="(prefers-color-scheme: dark)" />
      <link rel="manifest" href="/site.webmanifest" {...(IS_BEHIND_IAP && { crossOrigin: 'use-credentials' })} />

      {/* Favicons */}
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    </>
  )
}

export default MetaTags
