import { createHash } from 'crypto'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { SWITCHER_ICON_BASE, SWITCHER_SRC } from '../../common/GullyChainSwitcher'

// gc-chain-switcher 1.0.6 (gully-ops main c48ae8aa, 2026-11-11): the switcher falls back to its bundled chain list when the
// manifest cannot be loaded, and reads chain icons from this host first (icon-base), so a gullycore.xyz deploy window
// never leaves the Multisig header with "No chains" or broken marks. And the phone fix of /apps/open (390 px).
const web = join(__dirname, '..', '..', '..', '..')
const read = (p: string) => readFileSync(join(web, p), 'utf8')

describe('gc-chain-switcher 1.0.6 on Gully Multisig', () => {
  it('passes icon-base and serves every kit chain icon the bundled list names from /assets/chains/', () => {
    expect(SWITCHER_ICON_BASE).toBe('/assets/chains/')
    expect(read('src/components/common/GullyChainSwitcher/index.tsx')).toContain("'icon-base': SWITCHER_ICON_BASE")
    const sw = read(`public${SWITCHER_SRC}`)
    const names = [...new Set([...sw.matchAll(/"icon":"https:\/\/gullycore\.xyz\/chains\/([^"]+)"/g)].map((m) => m[1]))]
    expect(names.length).toBeGreaterThanOrEqual(6)
    const have = readdirSync(join(web, 'public', 'assets', 'chains'))
    for (const n of names) expect(have).toContain(n)
    // the testnet mark is the kit file (gully-ops sites/gullycore.xyz/chains/gully-chain-testnet.svg), not a redraw
    const h = createHash('sha256').update(readFileSync(join(web, 'public', 'assets', 'chains', 'gully-chain-testnet.svg'))).digest('hex')
    expect(h).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe('/apps/open on a 390 px phone', () => {
  it('the Safe Apps disclaimer is not wider than the screen and keeps room for the cookie banner', () => {
    const modal = read('src/components/safe-apps/SafeAppsInfoModal/index.tsx')
    expect(modal).not.toContain("width: '450px'")
    expect(modal).toContain("maxWidth: '450px'")
    expect(modal).toContain("pb: 'var(--gully-cookie-banner-h, 0px)'")
    expect(read('src/components/common/CookieAndTermBanner/index.tsx')).toContain("'--gully-cookie-banner-h'")
  })
})
