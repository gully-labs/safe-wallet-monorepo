/**
 * Gully Safe regression (2026-11-02): React #418 on /gully-services, /spaces, /safe-labs-terms,
 * /hypernative/oauth-callback and the 404 page.
 *
 * Next's static export prerenders those pages with router.isReady === false, so the sidebar navigation rendered
 * nothing into the HTML. The browser hydrates a URL without a query string with router.isReady === true, so the
 * first client render had the navigation list: a hydration mismatch. This test renders the navigation the way the
 * prerender does (renderToString, isReady false) and hydrates that HTML the way the browser does (isReady true).
 */
import type { ReactNode } from 'react'
import { act } from 'react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot, type Root } from 'react-dom/client'
import type { NextRouter } from 'next/router'
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime'
import { Provider } from 'react-redux'
import { ThemeProvider, type Theme } from '@mui/material/styles'
import SafeThemeProvider from '@/components/theme/SafeThemeProvider'
import { makeStore } from '@/store'
import SidebarNavigation from '@/components/sidebar/SidebarNavigation'

const router = (isReady: boolean): NextRouter =>
  ({
    asPath: '/gully-services',
    basePath: '',
    pathname: '/gully-services',
    route: '/gully-services',
    query: {},
    isReady,
    isFallback: false,
    isLocaleDomain: false,
    isPreview: false,
    back: jest.fn(),
    beforePopState: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(() => Promise.resolve()),
    push: jest.fn(() => Promise.resolve(true)),
    reload: jest.fn(),
    replace: jest.fn(() => Promise.resolve(true)),
    events: { on: jest.fn(), off: jest.fn(), emit: jest.fn() },
  }) as unknown as NextRouter

const Page = ({ isReady, children }: { isReady: boolean; children: ReactNode }) => (
  <Provider store={makeStore(undefined, { skipBroadcast: true })}>
    <RouterContext.Provider value={router(isReady)}>
      <SafeThemeProvider mode="dark">
        {(theme: Theme) => <ThemeProvider theme={theme}>{children}</ThemeProvider>}
      </SafeThemeProvider>
    </RouterContext.Provider>
  </Provider>
)

describe('SidebarNavigation hydration', () => {
  let root: Root | undefined
  afterEach(() => {
    act(() => root?.unmount())
    root = undefined
    document.body.innerHTML = ''
  })

  it('hydrates the static-export HTML of a query-less page without a mismatch (#418)', async () => {
    // the prerender: the export runs with router.isReady === false
    const html = renderToString(
      <Page isReady={false}>
        <SidebarNavigation />
      </Page>,
    )
    expect(html).not.toContain('<ul')

    // the browser: /gully-services has no query string, so router.isReady is already true while hydrating
    const container = document.createElement('div')
    container.innerHTML = html
    document.body.appendChild(container)
    const recoverable: unknown[] = []
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    await act(async () => {
      root = hydrateRoot(
        container,
        <Page isReady>
          <SidebarNavigation />
        </Page>,
        { onRecoverableError: (e) => recoverable.push(e) },
      )
    })
    const hydrationLogs = consoleError.mock.calls.filter((c) => /hydrat|did not match|didn't match/i.test(String(c[0])))
    consoleError.mockRestore()

    expect(recoverable.map((e) => String((e as Error)?.message ?? e))).toEqual([])
    expect(hydrationLogs).toEqual([])
    // and the navigation still appears once hydration is done
    expect(container.querySelector('ul')).not.toBeNull()
  })
})
