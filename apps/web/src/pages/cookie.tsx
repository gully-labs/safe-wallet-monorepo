import type { NextPage } from 'next'
import Head from 'next/head'
import { Typography } from '@mui/material'
import ExternalLink from '@/components/common/ExternalLink'
import { GULLY_PRIVACY_URL, GULLY_TERMS_URL } from '@/config/gully'
import { LS_NAMESPACE } from '@/config/constants'
import { lastUpdated } from '@/markdown/terms/version'

/**
 * Gully Multisig: what this build stores in your browser. Facts from the code and the build config (apps/web/.env.gully:
 * Google Analytics, Mixpanel, Beamer, Sentry and Datadog are all empty, so none of them load). Safe's own cookie policy
 * does not apply to this deployment.
 */
const CookiePolicy: NextPage = () => (
  <>
    <Head>
      <title>Gully Multisig – Cookies and local storage</title>
      <meta
        name="description"
        content="What Gully Multisig stores in your browser: no tracking cookies, settings and Safe data in local storage."
      />
      <link rel="canonical" href="https://multisig.gullychain.xyz/cookie" />
    </Head>

    <main style={{ lineHeight: '1.5', maxWidth: '70ch' }} data-testid="gully-cookie-note">
      <Typography variant="h1" mb={1}>
        Cookies and local storage
      </Typography>
      <Typography variant="body2" mb={3}>
        Last updated {lastUpdated}
      </Typography>

      <Typography variant="h3" mb={1}>
        Cookies
      </Typography>
      <Typography mb={2}>
        Gully Multisig sets no advertising or tracking cookies. The only cookie in the app code, <code>hn_auth</code>,
        is set only if you sign in to the optional Hypernative security add-on on a network that offers it; it holds
        that login token until it expires. Cloudflare, which serves this site, may set a strictly necessary security
        cookie (such as <code>__cf_bm</code> or <code>cf_clearance</code>) when its bot protection checks a request.
      </Typography>

      <Typography variant="h3" mb={1}>
        Local storage in your browser
      </Typography>
      <Typography mb={2}>
        To work without an account, Gully Multisig keeps your data in this browser&apos;s local storage (keys that start
        with <code>{LS_NAMESPACE}</code>): the Safe Accounts you added or visited, your address book, your settings,
        pending and batched transactions, Safes you have not deployed yet, and your choice in the terms notice. It stays
        on your device until you clear this site&apos;s data in your browser. The service worker keeps a copy of the app
        files so it loads fast and works offline.
      </Typography>

      <Typography variant="h3" mb={1}>
        Analytics
      </Typography>
      <Typography mb={2}>
        This build loads no Google Analytics, Mixpanel, Beamer, Sentry or Datadog. Cloudflare Web Analytics counts page
        views without cookies and without storing anything in your browser.
      </Typography>

      <Typography variant="h3" mb={1}>
        Sign in with Gully ID
      </Typography>
      <Typography mb={2}>
        If you use Sign in with Gully ID, the Gully ID script from gullyid.xyz may store its sign-in state in this
        browser. The Gully ID Privacy Policy at{' '}
        <ExternalLink href="https://gullyid.xyz/privacy">gullyid.xyz/privacy</ExternalLink> explains it.
      </Typography>

      <Typography mb={2}>
        The <ExternalLink href={GULLY_PRIVACY_URL}>Gully Chain Privacy Policy</ExternalLink> and the{' '}
        <ExternalLink href={GULLY_TERMS_URL}>Gully Chain Terms</ExternalLink> cover Gully Multisig. Questions:{' '}
        <a href="mailto:team@gullylabs.xyz">team@gullylabs.xyz</a>.
      </Typography>
    </main>
  </>
)

export default CookiePolicy
