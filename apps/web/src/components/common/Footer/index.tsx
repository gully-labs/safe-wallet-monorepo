import type { ReactElement, ReactNode } from 'react'
import { SvgIcon, Typography } from '@mui/material'
import GitHubIcon from '@mui/icons-material/GitHub'
import Link from 'next/link'
import { useRouter } from 'next/router'
import css from './styles.module.css'
import { AppRoutes } from '@/config/routes'
import { APP_VERSION, APP_HOMEPAGE } from '@/config/version'
import ExternalLink from '../ExternalLink'
import MUILink from '@mui/material/Link'
import { useIsOfficialHost } from '@/hooks/useIsOfficialHost'
import { HELP_CENTER_URL } from '@safe-global/utils/config/constants'
import { IS_PRODUCTION, COMMIT_HASH } from '@/config/constants'
import type { FooterProps } from './footer.type'
import {
  GULLY_LABS_URL,
  GULLY_PRIVACY_URL,
  GULLY_SOURCE_URL,
  GULLY_TERMS_URL,
  UPSTREAM_SOURCE_URL,
} from '@/config/gully'

const footerPages = [
  AppRoutes.settings.index,
  AppRoutes.imprint,
  AppRoutes.privacy,
  AppRoutes.cookie,
  AppRoutes.terms,
  AppRoutes.licenses,
  // Gully Safe: also show the footer (Powered by Gully Labs, source code) on the main pages
  AppRoutes.home,
  AppRoutes.welcome.index,
  AppRoutes.gullyServices,
]

const FooterLink = ({ children, href }: { children: ReactNode; href: string }): ReactElement => {
  return href ? (
    <Link href={href} passHref legacyBehavior>
      <MUILink>{children}</MUILink>
    </Link>
  ) : (
    <MUILink>{children}</MUILink>
  )
}

const Footer: React.FC<FooterProps> = ({
  forceShow,
  preferences = true,
  versionIcon = true,
  helpCenter = true,
  className = css.container,
}): ReactElement | null => {
  const router = useRouter()
  const isOfficialHost = useIsOfficialHost()
  const initialYear = 2025
  const currentYear = new Date().getFullYear()
  const copyrightYear = initialYear === currentYear ? initialYear : `${initialYear}–${currentYear}`

  if (!footerPages.some((path) => router.pathname.startsWith(path)) && !forceShow) {
    return null
  }

  const getHref = (path: string): string => {
    return router.pathname === path ? '' : path
  }

  return (
    <footer className={className}>
      <ul>
        {isOfficialHost ? (
          <>
            <li>
              <Typography variant="caption">&copy;{copyrightYear} Safe Labs GmbH</Typography>
            </li>
            <li>
              <FooterLink href={getHref(AppRoutes.terms)}>Terms</FooterLink>
            </li>
            <li>
              <FooterLink href={getHref(AppRoutes.privacy)}>Privacy</FooterLink>
            </li>
            <li>
              <FooterLink href={getHref(AppRoutes.licenses)}>Licenses</FooterLink>
            </li>
            <li>
              <FooterLink href={getHref(AppRoutes.imprint)}>Imprint</FooterLink>
            </li>
            <li>
              <FooterLink href={getHref(AppRoutes.cookie)}>Cookie policy</FooterLink>
            </li>
            {preferences && (
              <li>
                <FooterLink href={getHref(AppRoutes.settings.index)}>Preferences</FooterLink>
              </li>
            )}
            {helpCenter && (
              <li>
                <ExternalLink href={HELP_CENTER_URL} noIcon sx={{ span: { textDecoration: 'underline' } }}>
                  Help
                </ExternalLink>
              </li>
            )}
          </>
        ) : (
          <>
            <li>
              <a href={GULLY_LABS_URL} target="_blank" rel="noopener noreferrer" className={css.badge}>
                <img
                  src="/brand/badges/powered-by-gully-labs-dark.svg"
                  srcSet="/brand/badges/powered-by-gully-labs-dark.png 1x, /brand/badges/powered-by-gully-labs-dark-2x.png 2x, /brand/badges/powered-by-gully-labs-dark-3x.png 3x"
                  width={189}
                  height={56}
                  alt="Powered by Gully Labs"
                />
              </a>
            </li>
            <li>
              <ExternalLink href={GULLY_TERMS_URL} noIcon>
                Terms
              </ExternalLink>
            </li>
            <li>
              <ExternalLink href={GULLY_PRIVACY_URL} noIcon>
                Privacy
              </ExternalLink>
            </li>
            <li>
              <FooterLink href={getHref(AppRoutes.licenses)}>Licenses</FooterLink>
            </li>
            <li>
              <ExternalLink href={GULLY_SOURCE_URL} noIcon>
                Source code
              </ExternalLink>
            </li>
            <li>
              <Typography variant="caption">
                Gully Safe is a fork of{' '}
                <ExternalLink href={UPSTREAM_SOURCE_URL} noIcon>
                  Safe&#123;Wallet&#125;
                </ExternalLink>{' '}
                (GPL-3.0)
              </Typography>
            </li>
          </>
        )}

        <li>
          <ExternalLink href={`${APP_HOMEPAGE}/releases/tag/v${APP_VERSION}`} noIcon>
            {versionIcon && <SvgIcon component={GitHubIcon} inheritViewBox fontSize="inherit" sx={{ mr: 0.5 }} />}v
            {APP_VERSION}
          </ExternalLink>
        </li>

        {!IS_PRODUCTION && COMMIT_HASH && (
          <li>
            <ExternalLink href={`${APP_HOMEPAGE}/commit/${COMMIT_HASH}`} noIcon>
              {COMMIT_HASH.slice(0, 7)}
            </ExternalLink>
          </li>
        )}
      </ul>
    </footer>
  )
}

export default Footer
