import { createHash } from 'crypto'
import { readFileSync } from 'fs'
import { join } from 'path'
import { LIVE_UI_VERSION } from '../LiveUi'
import { SWITCHER_SRC, SWITCHER_VERSION } from '../../common/GullyChainSwitcher'

// Gully Live UI 1.0.4 + gc-chain-switcher 1.0.4 (gully-ops main fd3e3940, 2026-11-10):
//  - gl-core fmtValue(n, 'percent') prints a plain share or fee rate with no sign (0.3%, 12.5%); 'pct' stays the signed
//    change (+3.4%). gl-stat documents unit="percent".
//  - gc-chain-switcher: every attribute is also a property with a setter that reflects to the attribute. React 19 assigns
//    props as properties once the element is upgraded; 1.0.3 had getter-only surface/mode and threw "Cannot set property
//    surface of #<GcChainSwitcher> which has only a getter" on every re-render after the module loaded.
// The copies stay byte-identical to the canonical files; the wrappers in src/ say 1.0.4 (both checked in ONE case, so the
// test is red on the previous src even when public/ already holds the new files).
const web = join(__dirname, '..', '..', '..', '..')
const read = (p: string) => readFileSync(join(web, p), 'utf8')
const sha = (p: string) =>
  createHash('sha256')
    .update(readFileSync(join(web, p)))
    .digest('hex')

describe('Gully Live UI 1.0.4 and gc-chain-switcher 1.0.4', () => {
  it('the kit copies are the 1.0.4 files and the wrappers pin 1.0.4', () => {
    // src: the wrappers name the version they ship
    expect(LIVE_UI_VERSION).toBe('1.0.4')
    expect(read('src/components/gully/LiveUi/index.tsx')).toContain("LIVE_UI_VERSION = '1.0.4'")
    // the switcher moved on to 1.0.6 (bundled chain fallback, letter marks, icon-base; gully-ops main c48ae8aa)
    expect(SWITCHER_VERSION).toBe('1.0.6')
    expect(read('src/components/common/GullyChainSwitcher/index.tsx')).toContain("SWITCHER_VERSION = '1.0.6'")

    // public: byte-identical copies of gully-ops sites/_shared (sha256 of the canonical files at main fd3e3940)
    expect(sha('public/vendor/gully-live-ui/gl-core.js')).toBe(
      '1724d54aa78832394e31ad76d0e4dceca27fd1fc41d5929071f87a6b68042948',
    )
    expect(sha('public/vendor/gully-live-ui/gl-stat.js')).toBe(
      '569b84ab7170da5207f4eb3bc90be5a4b299459cda1ffeed77242b4bcaec94ab',
    )
    expect(sha('public/vendor/gully-live-ui/gl-chart.js')).toBe(
      'efaa236579d9a3cf1333c5b14cb714789a55aaed8c6d31b8c8dfdf7cc381fabd',
    )
    expect(sha(`public${SWITCHER_SRC}`)).toBe('43dab76dc4d544e6266af5108d61af71478af7da936191a605a9dd1c4890345a')

    const core = read('public/vendor/gully-live-ui/gl-core.js')
    expect(core).toContain("GULLY_LIVE_UI_VERSION = '1.0.4'")
    expect(core).toContain("if (unit === 'percent') return")
    expect(read('public/vendor/gully-live-ui/gl-stat.js')).toContain('unit="usd|pct|percent|plain"')

    const sw = read(`public${SWITCHER_SRC}`)
    expect(sw).toContain("GC_CHAIN_SWITCHER_VERSION = '1.0.6'")
    expect(sw).toContain('set surface(v)')
    expect(sw).toContain('set mode(v)')
    expect(sw).toContain('set current(v)')
    expect(sw).toContain(
      "static observedAttributes = ['surface', 'current', 'mode', 'manifest', 'health', 'theme', 'wallet', 'compact-below', 'icon-base']",
    )
  })
})
