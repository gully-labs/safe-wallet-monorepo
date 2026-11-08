import { readFileSync } from 'fs'
import { join } from 'path'

// Owner, 2026-11-08 ("why navigation have gaps"): the landing and the app had two different headers. One data file now feeds
// both: same lockup, same link order (Live or Dashboard, Features, Chains, Security, Docs), one primary button ("Open app"
// on the landing, "New Safe" in the app), the app header at one height, no ape and no "gm" bubble on /welcome.
const src = join(__dirname, '..', '..', '..')
const read = (p: string) => readFileSync(join(src, p), 'utf8')

describe('Gully Multisig shared navigation', () => {
  it('one data file: lockup, link order and the two primary buttons', () => {
    const nav = JSON.parse(read('config/gully-nav.json'))
    expect(nav.brand.name).toBe('Gully Multisig')
    expect(nav.links.map((l: { id: string }) => l.id)).toEqual(['live', 'features', 'chains', 'security', 'docs'])
    expect(nav.links[0].appLabel).toBe('Dashboard')
    expect(nav.primary.landing.label).toBe('Open app')
    expect(nav.primary.app.label).toBe('New Safe')
  })

  it('the app header uses it: links right after the logo, the one primary button, the lockup reads Gully Multisig', () => {
    const header = read('components/common/Header/index.tsx')
    expect(header).toContain('<GullyNavLinks')
    expect(header).toContain('NAV_PRIMARY')
    expect(header).not.toContain('Start building')
    expect(read('components/common/GullySafeLogo/index.tsx')).toContain("'Gully Multisig'")
    // the logo no longer takes the free space (that was the empty band between it and the links)
    expect(read('components/common/Header/styles.module.css')).not.toMatch(/\.menuButton,\s*\.logo \{\s*flex: 1;/)
    expect(read('styles/globals.css')).toContain('--header-height: 64px;')
  })

  it('/welcome shows the app header and the live card, not the mascot', () => {
    expect(read('components/common/PageLayout/index.tsx')).not.toMatch(/hideHeader = [^\n]*isWelcomePage/)
    const landing = read('components/gully/landing/GullyLanding.tsx')
    expect(landing).toContain('<HeroLive')
    expect(landing).not.toContain('Mascot')
    expect(landing).not.toContain('gc-switcher')
  })
})
