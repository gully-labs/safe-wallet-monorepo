import { readFileSync } from 'fs'
import { join } from 'path'

// Design slice 5: pages that are not a feature (404, 403, offline) share one kit layout with a way forward, the light
// theme carries the kit green as its primary, the Gully services page has a header, the connect button wears the theme.
const src = join(__dirname, '..', '..', '..')
const read = (p: string) => readFileSync(join(src, p), 'utf8')

describe('empty pages', () => {
  it('404, 403 and offline use the one layout and offer the way forward', () => {
    for (const p of ['pages/404.tsx', 'pages/403.tsx', 'pages/_offline.tsx']) {
      expect(read(p)).toContain('<GullyEmptyPage')
    }
    expect(read('pages/404.tsx')).toContain('AppRoutes.welcome.accounts')
    expect(read('pages/_offline.tsx')).not.toContain('grass')
    const css = read('components/gully/GullyEmptyPage/styles.module.css')
    expect(css).toContain('prefers-reduced-motion')
    expect(css).toContain('@keyframes float')
  })
})

describe('light theme parity', () => {
  it('the light primary is the Gully Labs kit blue in the palette and the generated variables alike', () => {
    expect(read('../../../packages/theme/src/palettes/light.ts')).toMatch(
      /primary: \{\s*dark: '#2D468A',\s*main: '#3754A0'/,
    )
    const vars = read('styles/vars.css')
    const light = vars.slice(0, vars.indexOf("[data-theme='dark']"))
    expect(light).toContain('--color-primary-main: #3754a0;')
    expect(light).toContain('--color-primary-dark: #2d468a;')
  })

  it('no hard-coded Safe black on the connect buttons', () => {
    expect(read('components/welcome/WelcomeLogin/WalletLogin.tsx')).not.toContain('#121312')
  })
})

describe('Gully services page', () => {
  it('has a page header', () => {
    expect(read('pages/gully-services.tsx')).toContain('<PageHeader')
  })
})
