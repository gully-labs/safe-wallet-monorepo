import { useEffect, type ReactElement } from 'react'
import Head from 'next/head'
import { Typography } from '@mui/material'
import ExternalLink from '@/components/common/ExternalLink'
import { GULLY_PRIVACY_URL, GULLY_TERMS_URL } from '@/config/gully'

const replaceLocation = (url: string) => window.location.replace(url)

/**
 * Gully Multisig legal pages. Gully Chain has one Terms and one Privacy Policy (gullychain.xyz/terms, /privacy), and they
 * cover Gully Multisig. The static export cannot answer with an HTTP redirect, so /terms, /privacy, /imprint and
 * /safe-labs-terms render this short page: a meta refresh (works without JavaScript), a client-side replace, and a
 * visible link for anyone whose browser blocks both.
 */
export const GullyLegalRedirect = ({
  title,
  href,
  navigate = replaceLocation,
}: {
  title: string
  href: string
  navigate?: (url: string) => void
}): ReactElement => {
  useEffect(() => {
    navigate(href)
  }, [href, navigate])

  return (
    <>
      <Head>
        <title>{`Gully Multisig – ${title}`}</title>
        <meta httpEquiv="refresh" content={`0; url=${href}`} />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href={href} />
      </Head>
      <Typography variant="h1" mb={2}>
        {title}
      </Typography>
      <Typography mb={1} data-testid="gully-legal-redirect">
        Gully Multisig is run by Gully Labs LLC. The {title} for Gully Multisig is published at{' '}
        <ExternalLink href={href}>{href}</ExternalLink>. Taking you there now.
      </Typography>
    </>
  )
}

/** The consent line on the sign-in and create / add Safe screens. Display only: it does not gate any action. */
export const GullyLegalConsent = ({ className }: { className?: string }): ReactElement => (
  <Typography variant="body2" component="p" className={className} data-testid="gully-legal-consent">
    By continuing you agree to the{' '}
    <ExternalLink href={GULLY_TERMS_URL} noIcon>
      Gully Chain Terms
    </ExternalLink>{' '}
    and{' '}
    <ExternalLink href={GULLY_PRIVACY_URL} noIcon>
      Privacy Policy
    </ExternalLink>
    .
  </Typography>
)

export const GULLY_LEGAL_CONSENT_TEXT = 'By continuing you agree to the Gully Chain Terms and Privacy Policy.'
