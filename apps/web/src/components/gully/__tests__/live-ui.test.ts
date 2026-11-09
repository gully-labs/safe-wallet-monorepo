import { createHash } from 'crypto'
import { readFileSync } from 'fs'
import { join } from 'path'
import { DARK_BG_LOGOS, logoForTheme } from '../chainLogo'

// Owner, 2026-11-09 ("Gully Live UI go"): every Gully surface shows live activity with the shared kit. Gully Multisig:
// the welcome live card and the dashboard activity card on gl-stat + gl-chart, fed by /landing/stats.json. Also: the
// Kinetiq Elysium mark (dark ink circle) vanished on the dark theme; Kinetiq's own light variant is used there.
const web = join(__dirname, '..', '..', '..', '..')
const read = (p: string) => readFileSync(join(web, p), 'utf8')
const sha = (p: string) =>
  createHash('sha256')
    .update(readFileSync(join(web, p)))
    .digest('hex')

// gully-ops main 09fc3b25, sites/_shared/gully-live-ui (Gully Live UI 1.0.0): copies must stay byte-identical
const CANON: Record<string, string> = {
  'gl-core.js': '337a4e72a652f9832abfc3eca5e074fe05cdf2399fa8af2e1f658fd5d8cbcac9',
  'gl-stat.js': '41dd5116b927af7e6c4238eeacc2b7250e90f18edd8d6df1d5252fc0c2e2f212',
  'gl-chart.js': '3297f25616c11ae54c2e5c94fb0689254acd6b3753022bab34367340e2e4ce4b',
}

describe('Gully Live UI vendored byte-identical', () => {
  it.each(Object.keys(CANON))('%s matches the canonical file', (f) => {
    expect(sha(`public/vendor/gully-live-ui/${f}`)).toBe(CANON[f])
  })

  it('the wrapper loads those files as browser modules from /vendor/gully-live-ui', () => {
    const src = read('src/components/gully/LiveUi/index.tsx')
    expect(src).toContain("LIVE_UI_BASE = '/vendor/gully-live-ui'")
    expect(src).toContain("s.type = 'module'")
    expect(src).toContain("createElement('gl-stat'")
    expect(src).toContain("createElement('gl-chart'")
    // spark is an attribute, data waits for the element definition
    expect(src).toContain("el.setAttribute('spark'")
    expect(src).toContain("customElements.whenDefined('gl-chart')")
  })

  it('kit tokens: Gully Chain rows, validated chart slots, light and dark', () => {
    const css = read('src/components/gully/LiveUi/styles.module.css')
    expect(css).toContain('--gl-series-1: #0e9f6e')
    expect(css).toContain('--gl-series-1: #1aa676')
    expect(css).toContain(":global([data-theme='dark']) .glKit")
    expect(css).toContain('.glKit.glKitDark')
  })
})

describe('live cards use gl-stat and gl-chart', () => {
  it('welcome hero card', () => {
    const hero = read('src/components/gully/landing/HeroLive.tsx')
    expect(hero).toContain('<GlStat')
    expect(hero).toContain('<GlChart')
    expect(hero).toContain('<GlKit dark')
    expect(hero).not.toContain('<DailyColumns')
    expect(hero).toContain("'/landing/stats.json'")
    // no fake zero chart before the file answers
    expect(hero).toContain('chains ? bars.map')
  })

  it('dashboard activity card', () => {
    const card = read('src/components/gully/GullyActivityCard/index.tsx')
    expect(card.match(/<GlStat/g)?.length).toBe(3)
    expect(card).toContain('<GlChart')
    expect(card).toContain('<Sparkline')
  })
})

describe('chain marks on the dark theme', () => {
  it('Elysium swaps to the official light variant, byte-identical', () => {
    expect(DARK_BG_LOGOS['99901']).toBe('/brand/chains/99901/chain_logo-light.png')
    expect(sha('public/brand/chains/99901/chain_logo-light.png')).toBe(
      'df87cf3598e017395883b7f1d3051b548679d76393dbff90ce70ac999bf1fc4c',
    )
  })

  it('logoForTheme', () => {
    const ely = 'https://gullymultisig.xyz/cfg/media/chains/99901/chain_logo.png'
    expect(logoForTheme(ely, true)).toBe('/brand/chains/99901/chain_logo-light.png')
    expect(logoForTheme(ely, false)).toBe(ely)
    expect(logoForTheme('/cfg/media/chains/99901/chain_logo.png?v=2', true)).toBe(
      '/brand/chains/99901/chain_logo-light.png',
    )
    const anubis = '/cfg/media/chains/6714/chain_logo.png'
    expect(logoForTheme(anubis, true)).toBe(anubis)
    expect(logoForTheme(null, true)).toBeUndefined()
  })

  it.each(['common/ChainIndicator/index.tsx', 'common/ChainSwitcher/index.tsx', 'common/SafeIcon/index.tsx'])(
    '%s renders the theme-aware logo',
    (f) => {
      const src = read(`src/components/${f}`)
      expect(src).toContain('useChainLogo(')
      expect(src).toContain('src={logoSrc}')
    },
  )
})

// 2026-11-09 signed-out design gate: /welcome/accounts scrolled sideways 33 px at 390. Cause: the screen-reader tables
// carried .srOnly themselves, and a table never shrinks below its content nor clips, so the hidden table widened the
// page. The tables now sit inside a block .srOnly wrapper that clips them.
describe('screen-reader tables never widen the page', () => {
  it.each(['GullyActivityCard/Sparkline.tsx', 'HoldingsBar/index.tsx', 'landing/charts.tsx'])('%s', (f) => {
    const src = read(`src/components/gully/${f}`)
    expect(src).not.toContain('<table className={css.srOnly}>')
    expect(src).toMatch(/<div className=\{css\.srOnly\}>\s*<table>/)
  })
})
