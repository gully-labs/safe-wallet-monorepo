import type { ComponentType } from 'react'
import { readFileSync } from 'fs'
import { join } from 'path'
import { fireEvent, render, screen } from '@/tests/test-utils'
import { GullyLegalConsent, GullyLegalRedirect, GULLY_LEGAL_CONSENT_TEXT } from '@/components/common/GullyLegal'
import { GULLY_LEGAL_URL, GULLY_PRIVACY_URL, GULLY_TERMS_URL } from '@/config/gully'
import { version, lastUpdated } from '@/markdown/terms/version'
import Footer from '@/components/common/Footer'
import { CookieAndTermBanner } from '@/components/common/CookieAndTermBanner'
import { getStoreInstance } from '@/store'
import { hasAcceptedTerms, selectCookies } from '@/store/cookiesAndTermsSlice'
import TermsPage from '@/pages/terms'
import PrivacyPage from '@/pages/privacy'
import ImprintPage from '@/pages/imprint'
import CookiePage from '@/pages/cookie'
import SafeLabsTermsPage from '@/pages/safe-labs-terms'

const mockNavigate = jest.fn()

jest.mock('@/hooks/useIsOfficialHost', () => ({ useIsOfficialHost: () => false }))

// The pages use the real redirect component; only the browser navigation is replaced (jsdom cannot navigate)
jest.mock('@/components/common/GullyLegal', () => {
  const actual = jest.requireActual('@/components/common/GullyLegal')
  return {
    ...actual,
    GullyLegalRedirect: (props: { title: string; href: string; navigate?: (url: string) => void }) =>
      actual.GullyLegalRedirect({ ...props, navigate: props.navigate ?? mockNavigate }),
  }
})

const SRC = join(__dirname, '../../../..')
const read = (rel: string) => readFileSync(join(SRC, rel), 'utf-8')

// Names and texts of the upstream operator that must never appear on our legal routes
const UPSTREAM = /Safe Labs|Safe Ecosystem Foundation|GmbH|safe\.global|Core Contributors|Telemedia|Rahul|Berlin|Zug/i

describe('Gully Safe legal routes', () => {
  beforeEach(() => mockNavigate.mockClear())

  it('the canonical URLs are the Gully Chain Terms and Privacy Policy', () => {
    expect(GULLY_TERMS_URL).toBe('https://gullychain.xyz/terms')
    expect(GULLY_PRIVACY_URL).toBe('https://gullychain.xyz/privacy')
    expect(GULLY_LEGAL_URL).toBe('https://gullylabs.xyz/legal')
  })

  const ROUTES: Array<[string, ComponentType, string, string]> = [
    ['/terms', TermsPage, GULLY_TERMS_URL, 'Terms'],
    ['/privacy', PrivacyPage, GULLY_PRIVACY_URL, 'Privacy Policy'],
    ['/imprint', ImprintPage, GULLY_LEGAL_URL, 'Legal information'],
    ['/safe-labs-terms', SafeLabsTermsPage, GULLY_TERMS_URL, 'Terms'],
  ]

  it.each(ROUTES)('%s redirects to the canonical page and links to it', (_route, Page, href, title) => {
    const { container } = render(<Page />)
    expect(mockNavigate).toHaveBeenCalledWith(href)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(title)
    const link = screen.getByRole('link', { name: href })
    expect(link).toHaveAttribute('href', href)
    expect(link).toHaveAttribute('target', '_blank')
    expect(container.textContent).toContain('Gully Labs LLC')
    expect(container.textContent).not.toMatch(UPSTREAM)
  })

  it('the redirect component sends the browser to the page it names', () => {
    const navigate = jest.fn()
    render(<GullyLegalRedirect title="Terms" href={GULLY_TERMS_URL} navigate={navigate} />)
    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(GULLY_TERMS_URL)
  })

  it('/cookie describes what this build stores and has no upstream text', () => {
    const { container } = render(<CookiePage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Cookies and local storage')
    expect(container.textContent).toContain(`Last updated ${lastUpdated}`)
    expect(container.textContent).toContain('SAFE_v2__')
    expect(container.textContent).toContain('no advertising or tracking cookies')
    expect(screen.getByRole('link', { name: /Gully Chain Privacy Policy/ })).toHaveAttribute('href', GULLY_PRIVACY_URL)
    expect(screen.getByRole('link', { name: /Gully Chain Terms/ })).toHaveAttribute('href', GULLY_TERMS_URL)
    expect(container.textContent).not.toMatch(UPSTREAM)
    expect(container.textContent).not.toMatch(/draft/i)
  })

  it('no legal page imports the upstream Safe{Wallet} texts any more', () => {
    for (const page of ['pages/terms.tsx', 'pages/privacy.tsx', 'pages/cookie.tsx', 'pages/imprint.tsx']) {
      const src = read(page)
      expect(src).not.toMatch(/markdown\/(terms|privacy|cookie)\/\w+\.md/)
      expect(src).not.toMatch(UPSTREAM)
    }
  })
})

describe('Gully Safe footer', () => {
  it('links Terms and Privacy to gullychain.xyz, plus Cookies and Licenses, and keeps the GPL credit', () => {
    render(<Footer forceShow />, { routerProps: { pathname: '/home' } })
    const terms = screen.getByRole('link', { name: 'Terms' })
    expect(terms).toHaveAttribute('href', GULLY_TERMS_URL)
    expect(terms).toHaveAttribute('target', '_blank')
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', GULLY_PRIVACY_URL)
    expect(screen.getByRole('link', { name: 'Cookies' })).toHaveAttribute('href', '/cookie')
    expect(screen.getByRole('link', { name: 'Licenses' })).toHaveAttribute('href', '/licenses')
    expect(screen.getByText(/\(GPL-3\.0\)/)).toBeInTheDocument()
    expect(screen.queryByText(/Safe Labs GmbH/)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Imprint' })).not.toBeInTheDocument()
  })
})

describe('Gully Safe terms notice', () => {
  it('uses a Gully version, so everyone who accepted the Safe{Wallet} terms sees the notice again', () => {
    expect(version).toBe('gully-2026-11-03')
    expect(lastUpdated).toBe('November 3, 2026')
  })

  it('names the Gully Chain Terms and Privacy Policy and offers no Beamer or analytics opt-in', () => {
    const { container } = render(<CookieAndTermBanner />)
    const notice = screen.getByTestId('gully-terms-notice')
    expect(notice).toHaveTextContent(`Gully Chain Terms (last updated ${lastUpdated})`)
    expect(screen.getByRole('link', { name: /Gully Chain Terms/ })).toHaveAttribute('href', GULLY_TERMS_URL)
    expect(screen.getByRole('link', { name: /Privacy Policy/ })).toHaveAttribute('href', GULLY_PRIVACY_URL)
    expect(screen.queryByLabelText('Beamer')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Analytics')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Accept all' })).not.toBeInTheDocument()
    expect(container.textContent).not.toMatch(UPSTREAM)
  })

  it('Accept stores the consent with the Gully terms version', () => {
    render(<CookieAndTermBanner />)
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }))
    const state = getStoreInstance().getState()
    expect(selectCookies(state)).toMatchObject({ terms: true, necessary: true, termsVersion: 'gully-2026-11-03' })
    expect(hasAcceptedTerms(state)).toBe(true)
  })
})

describe('Gully Safe consent line', () => {
  it('reads "By continuing you agree to the Gully Chain Terms and Privacy Policy." with both links', () => {
    render(<GullyLegalConsent />)
    const line = screen.getByTestId('gully-legal-consent')
    expect(line).toHaveTextContent(GULLY_LEGAL_CONSENT_TEXT)
    expect(screen.getByRole('link', { name: 'Gully Chain Terms' })).toHaveAttribute('href', GULLY_TERMS_URL)
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', GULLY_PRIVACY_URL)
  })

  it('is on the create Safe and add Safe screens, the sign-in landing and the Gully ID button', () => {
    expect(read('components/new-safe/create/steps/SetNameStep/index.tsx')).toContain('<GullyLegalConsent />')
    expect(read('components/new-safe/load/steps/SetAddressStep/index.tsx')).toContain('<GullyLegalConsent />')
    const landing = read('components/gully/landing/GullyLanding.tsx')
    expect(landing).toContain('By continuing you agree to the')
    expect(landing).toContain('href={GULLY_TERMS_URL}')
    expect(landing).toContain('href={GULLY_PRIVACY_URL}')
    expect(read('components/common/GullySignIn/index.tsx')).toContain('title={GULLY_LEGAL_CONSENT_TEXT}')
  })
})
