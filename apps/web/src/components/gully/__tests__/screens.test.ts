import { readFileSync } from 'fs'
import { join } from 'path'
import { watchForUpdates } from '../GullySwUpdate'
import { dailyExecutions } from '../GullySafeActivity'

const fakeSw = (controller: unknown) => {
  const handlers: Record<string, () => void> = {}
  return {
    handlers,
    update: jest.fn(() => Promise.resolve()),
    sw: {
      controller,
      addEventListener: (n: string, h: () => void) => (handlers[n] = h),
      removeEventListener: (n: string) => delete handlers[n],
      getRegistration: () => Promise.resolve({ update: () => Promise.resolve() }),
    },
  }
}
const fakeDoc = () => {
  const handlers: Record<string, () => void> = {}
  return {
    handlers,
    doc: {
      visibilityState: 'visible',
      addEventListener: (n: string, h: () => void) => (handlers[n] = h),
      removeEventListener: jest.fn(),
    },
  }
}

describe('service worker updates', () => {
  it('offers a reload when a new worker takes over a page that already had one', () => {
    const f = fakeSw({})
    const d = fakeDoc()
    const onNew = jest.fn()
    const stop = watchForUpdates(f.sw as never, onNew, d.doc as never)
    f.handlers.controllerchange()
    expect(onNew).toHaveBeenCalledTimes(1)
    stop()
  })

  it('stays quiet when the first worker of a first visit takes control', () => {
    const f = fakeSw(null)
    const d = fakeDoc()
    const onNew = jest.fn()
    const stop = watchForUpdates(f.sw as never, onNew, d.doc as never)
    f.handlers.controllerchange()
    expect(onNew).not.toHaveBeenCalled()
    f.handlers.controllerchange()
    expect(onNew).toHaveBeenCalledTimes(1)
    stop()
  })

  it('a failed update check, as when offline, is ignored', async () => {
    const f = fakeSw({})
    const d = fakeDoc()
    f.sw.getRegistration = () => Promise.reject(new Error('offline'))
    const stop = watchForUpdates(f.sw as never, jest.fn(), d.doc as never)
    expect(() => d.handlers.visibilitychange()).not.toThrow()
    await Promise.resolve()
    stop()
  })
})

describe('dailyExecutions', () => {
  it('counts real executions per local day, oldest first and today last', () => {
    const now = new Date(2026, 10, 2, 12).getTime()
    const bars = dailyExecutions(
      [
        new Date(2026, 10, 2, 1).getTime(),
        new Date(2026, 10, 1, 23).getTime(),
        new Date(2026, 10, 1, 1).getTime(),
        new Date(2026, 0, 1).getTime(),
      ],
      3,
      now,
    )
    expect(bars.map((b) => b.v)).toEqual([0, 2, 1])
  })

  it('has no invented activity when nothing ran', () => {
    expect(dailyExecutions([], 14).every((b) => b.v === 0)).toBe(true)
  })
})

describe('footers', () => {
  const src = (p: string) => readFileSync(join(__dirname, '..', '..', p), 'utf8')

  it('the welcome page has exactly one: the landing renders it and the layout skips that route only', () => {
    expect(src('gully/landing/GullyLanding.tsx').match(/<Footer\b/g)).toHaveLength(1)
    expect(src('common/PageLayout/index.tsx')).toContain('{!isSafeLabsTermsPage && !isWelcomePage && <Footer />}')
    expect(src('common/PageLayout/index.tsx')).toContain('const isWelcomePage = pathname === AppRoutes.welcome.index')
  })

  it('the welcome footer links are 44 px on phones (the landing replaces the Footer container class)', () => {
    const css = src('gully/landing/styles.module.css')
    const phone = css.slice(css.indexOf('@media (max-width: 599.95px)'))
    const rule = /\.footer li > a \{([^}]*)\}/.exec(phone)?.[1] ?? ''
    expect(rule).toMatch(/min-height: 44px/)
    expect(rule).toMatch(/min-width: 44px/)
  })
})

describe('phone header', () => {
  const src = (p: string) => readFileSync(join(__dirname, '..', '..', p), 'utf8')

  it('keeps one sign-in, so the redirect is handled once', () => {
    expect(src('common/Header/index.tsx').match(/<GullySignIn/g)).toHaveLength(1)
  })

  it('is two rows below the phone breakpoint only, and the rows add up to the header height', () => {
    const globals = readFileSync(join(__dirname, '..', '..', '..', 'styles', 'globals.css'), 'utf8')
    expect(globals).toMatch(/--header-height: 64px;/)
    expect(globals).toMatch(/@media \(max-width: 599\.95px\) \{\s+:root \{\s+--header-height: 108px;/)
    const css = src('common/Header/styles.module.css')
    const phone = css.slice(css.indexOf('@media (max-width: 599.95px)'))
    expect(phone).toMatch(/\.element \{\s+height: 56px;/)
    // the second row is the session group (Gully ID pill + Connect, or the wallet chip + chain); only the phone block
    // turns it into a row of its own
    expect(phone).toMatch(/\.session \{[^}]*order: 10;[^}]*height: 52px;/)
    expect(css.slice(0, css.indexOf('@media (max-width: 599.95px)'))).not.toContain('order: 10')
  })
})
