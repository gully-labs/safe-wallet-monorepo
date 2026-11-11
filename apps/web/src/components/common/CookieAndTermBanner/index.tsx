import { useEffect, type ReactElement, useRef } from 'react'
import classnames from 'classnames'
import type { CheckboxProps } from '@mui/material'
import { Grid, Button, Checkbox, FormControlLabel, Typography, Paper, SvgIcon, Box } from '@mui/material'
import WarningIcon from '@/public/images/notifications/warning.svg'
import { useForm } from 'react-hook-form'
import * as metadata from '@/markdown/terms/version'

import { useAppDispatch, useAppSelector } from '@/store'
import {
  selectCookies,
  CookieAndTermType,
  saveCookieAndTermConsent,
  hasAcceptedTerms,
} from '@/store/cookiesAndTermsSlice'
import { selectCookieBanner, openCookieBanner, closeCookieBanner } from '@/store/popupSlice'

import css from './styles.module.css'
import { AppRoutes } from '@/config/routes'
import ExternalLink from '../ExternalLink'
import { useRouter } from 'next/router'
import { useIsOfficialHost } from '@/hooks/useIsOfficialHost'
import { GULLY_PRIVACY_URL, GULLY_TERMS_URL } from '@/config/gully'

const COOKIE_AND_TERM_WARNING: Record<CookieAndTermType, string> = {
  [CookieAndTermType.TERMS]: '',
  [CookieAndTermType.NECESSARY]: '',
  [CookieAndTermType.UPDATES]: `You attempted to open the "What's new" section but need to accept the "Beamer" cookies first.`,
  [CookieAndTermType.ANALYTICS]: '',
}

const CookieCheckbox = ({
  checkboxProps,
  label,
  checked,
}: {
  label: string
  checked: boolean
  checkboxProps: CheckboxProps
}) => <FormControlLabel label={label} checked={checked} control={<Checkbox {...checkboxProps} />} sx={{ mt: '-9px' }} />

export const CookieAndTermBanner = ({
  warningKey,
  inverted,
}: {
  warningKey?: CookieAndTermType
  inverted?: boolean
}): ReactElement => {
  const isOfficialHost = useIsOfficialHost()
  // Gully Multisig: Beamer and analytics are not part of this build, so there is nothing to opt in to and no warning
  const warning = warningKey && isOfficialHost ? COOKIE_AND_TERM_WARNING[warningKey] : undefined
  const dispatch = useAppDispatch()
  const cookies = useAppSelector(selectCookies)

  const { register, watch, getValues, setValue } = useForm({
    defaultValues: {
      [CookieAndTermType.TERMS]: true,
      [CookieAndTermType.NECESSARY]: true,
      [CookieAndTermType.UPDATES]: cookies[CookieAndTermType.UPDATES] ?? false,
      [CookieAndTermType.ANALYTICS]: cookies[CookieAndTermType.ANALYTICS] ?? false,
      ...(warningKey ? { [warningKey]: true } : {}),
    },
  })

  const handleAccept = () => {
    const values = getValues()
    dispatch(
      saveCookieAndTermConsent({
        ...values,
        termsVersion: metadata.version,
      }),
    )
    dispatch(closeCookieBanner())
  }

  const handleAcceptAll = () => {
    setValue(CookieAndTermType.UPDATES, true)
    setValue(CookieAndTermType.ANALYTICS, true)
    setTimeout(handleAccept, 300)
  }

  return (
    <Paper data-testid="cookies-popup" className={classnames(css.container, { [css.inverted]: inverted })}>
      {warning && (
        <Typography
          align="center"
          variant="body2"
          sx={{
            mb: 2,
            color: 'warning.background',
          }}
        >
          <SvgIcon component={WarningIcon} inheritViewBox fontSize="small" color="error" sx={{ mb: -0.4 }} /> {warning}
        </Typography>
      )}
      <form>
        <Grid
          container
          sx={{
            alignItems: 'center',
          }}
        >
          <Grid item xs>
            {isOfficialHost ? (
              <Typography
                variant="body2"
                sx={{
                  mb: 2,
                }}
              >
                By browsing this page, you accept our{' '}
                <ExternalLink href={AppRoutes.terms}>Terms & Conditions</ExternalLink> (last updated{' '}
                {metadata.lastUpdated}) and the use of necessary cookies. By clicking &quot;Accept all&quot; you
                additionally agree to the use of Beamer and Analytics cookies as listed below.{' '}
                <ExternalLink href={AppRoutes.cookie}>Cookie policy</ExternalLink>
              </Typography>
            ) : (
              <Typography variant="body2" sx={{ mb: 2 }} data-testid="gully-terms-notice">
                By using Gully Multisig you agree to the{' '}
                <ExternalLink href={GULLY_TERMS_URL}>Gully Chain Terms</ExternalLink> (last updated{' '}
                {metadata.lastUpdated}) and the <ExternalLink href={GULLY_PRIVACY_URL}>Privacy Policy</ExternalLink>.
                Gully Multisig sets no tracking cookies: it keeps your settings and Safe data in this browser&apos;s
                local storage. <ExternalLink href={AppRoutes.cookie}>Cookies and local storage</ExternalLink>
              </Typography>
            )}

            <Grid
              container
              sx={{
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Grid item xs={12} sm>
                <Box
                  sx={{
                    mb: 2,
                  }}
                >
                  <CookieCheckbox checkboxProps={{ id: 'necessary', disabled: true }} label="Necessary" checked />
                  <br />
                  <Typography variant="body2">Locally stored data for core functionality</Typography>
                </Box>

                {isOfficialHost && (
                  <Box
                    sx={{
                      mb: 2,
                    }}
                  >
                    <CookieCheckbox
                      checkboxProps={{ ...register(CookieAndTermType.UPDATES), id: 'beamer' }}
                      label="Beamer"
                      checked={watch(CookieAndTermType.UPDATES)}
                    />
                    <br />
                    <Typography variant="body2">New features and product announcements</Typography>
                  </Box>
                )}
                {isOfficialHost && (
                  <Box>
                    <CookieCheckbox
                      checkboxProps={{ ...register(CookieAndTermType.ANALYTICS), id: 'ga' }}
                      label="Analytics"
                      checked={watch(CookieAndTermType.ANALYTICS)}
                    />
                    <br />
                    <Typography variant="body2">Analytics tools to understand usage patterns.</Typography>
                  </Box>
                )}
              </Grid>
            </Grid>

            <Grid
              container
              sx={{
                alignItems: 'center',
                justifyContent: 'center',
                mt: 4,
                gap: 2,
              }}
            >
              {isOfficialHost ? (
                <>
                  <Grid item>
                    <Typography>
                      <Button onClick={handleAccept} variant="text" size="small" color="inherit" disableElevation>
                        Save settings
                      </Button>
                    </Typography>
                  </Grid>

                  <Grid item>
                    <Button
                      onClick={handleAcceptAll}
                      variant="contained"
                      color="secondary"
                      size="small"
                      disableElevation
                    >
                      Accept all
                    </Button>
                  </Grid>
                </>
              ) : (
                <Grid item>
                  <Button onClick={handleAccept} variant="contained" color="secondary" size="small" disableElevation>
                    Accept
                  </Button>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </form>
    </Paper>
  )
}

const CookieBannerPopup = (): ReactElement | null => {
  const cookiePopup = useAppSelector(selectCookieBanner)
  const dispatch = useAppDispatch()
  const router = useRouter()
  const exceptionPages = [AppRoutes.safeLabsTerms]

  const hasAccepted = useAppSelector(hasAcceptedTerms)
  const shouldOpen = !hasAccepted && !exceptionPages.includes(router.pathname)

  useEffect(() => {
    if (shouldOpen) {
      dispatch(openCookieBanner({}))
    } else {
      dispatch(closeCookieBanner())
    }
  }, [dispatch, shouldOpen])

  // Gully Multisig: the banner's height is published as --gully-cookie-banner-h while it is open, so pages that fill the
  // screen (the Safe Apps disclaimer on /apps/open) keep their buttons above it instead of under it (390 px phones).
  const popupRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = document.documentElement
    const el = popupRef.current
    if (!cookiePopup.open || !el) {
      root.style.removeProperty('--gully-cookie-banner-h')
      return
    }
    const publish = () => root.style.setProperty('--gully-cookie-banner-h', `${Math.ceil(el.getBoundingClientRect().height)}px`)
    publish()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(publish) : undefined
    ro?.observe(el)
    return () => {
      ro?.disconnect()
      root.style.removeProperty('--gully-cookie-banner-h')
    }
  }, [cookiePopup.open])

  return cookiePopup.open ? (
    <div className={css.popup} ref={popupRef}>
      <CookieAndTermBanner warningKey={cookiePopup.warningKey} inverted />
    </div>
  ) : null
}
export default CookieBannerPopup
