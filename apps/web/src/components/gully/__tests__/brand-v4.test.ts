/**
 * Gully Safe: GullyChain brand kit v4 guard. Fails on any kit v3 leftover (colours, Exo 2, the 3D logo, wordmark files,
 * v3 mascots), on a typed "GullyChain" wordmark in markup, and when a shipped kit file or shared script is not the
 * byte-identical copy of the source (kit: Desktop\GULLY LABS GRAPHICS\Gully Chain\brand-kit-v4; scripts: gully-ops
 * sites/_shared/gc-switcher 1.8.2 and sites/_shared/gc-connect 1.0.0).
 */
import { createHash } from 'crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'fs'
import { join, relative } from 'path'

const WEB = join(__dirname, '..', '..', '..', '..')
const REPO = join(WEB, '..', '..')
const sha = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')

const walk = (dir: string, out: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next' || name === 'out') continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

// the shared scripts carry their own changelog (they name the v3 files they removed), and this file names them on purpose
const EXEMPT = [/public[\/]assets[\/]gc-(switcher|connect)\.js$/, /brand-v4\.test\.ts$/]
const TEXT = /\.(ts|tsx|js|jsx|css|json|webmanifest|html|svg|md)$/

const SCANNED = [
  ...walk(join(WEB, 'src')),
  ...walk(join(WEB, 'public', 'brand')),
  ...walk(join(WEB, 'public', 'assets')),
  join(WEB, 'public', 'site.webmanifest'),
  join(WEB, 'public', 'fonts', 'fonts.css'),
  ...walk(join(REPO, 'packages', 'theme', 'src')),
].filter((p) => !EXEMPT.some((r) => r.test(p)))

const V3: [string, RegExp][] = [
  ['kit v3 cyan #00B2FA', /#00b2fa\b/i],
  ['kit v3 green #46FB04', /#46fb04\b/i],
  ['kit v3 blue #2563FF', /#2563ff\b/i],
  ['kit v3 night #05080D', /#05080d\b/i],
  ['kit v3 ink #0A1018', /#0a1018\b/i],
  ['kit v3 white #F2F5F7', /#f2f5f7\b/i],
  ['kit v3 muted #8A97A8', /#8a97a8\b/i],
  ['retired cyan #01D9FA', /#01d9fa\b/i],
  ['retired royal #1567F9', /#1567f9\b/i],
  ['kit v3 cyan rgba(0, 178, 250)', /rgba\(\s*0\s*,\s*178\s*,\s*250\b/],
  ['kit v3 green rgba(70, 251, 4)', /rgba\(\s*70\s*,\s*251\s*,\s*4\b/],
  ['kit v3 font Exo 2', /Exo(\s|\+)2/],
  ['kit v3 3D logo', /gullychain-logo/],
  ['kit v3 icon', /gullychain-icon/],
  ['kit v3 wordmark file', /wordmark-for-/],
  ['kit v3 mascot', /gullychain-mascot/],
]

describe('Gully Safe brand kit v4', () => {
  it('scans a real tree', () => {
    expect(SCANNED.length).toBeGreaterThan(500)
  })

  it.each(V3)('has no %s', (_label, re) => {
    const hits = SCANNED.filter((p) => TEXT.test(p)).filter((p) => re.test(readFileSync(p, 'utf8')))
    expect(hits.map((p) => relative(REPO, p))).toEqual([])
  })

  it('ships no kit v3 image files', () => {
    const v3 = walk(join(WEB, 'public')).filter((p) => /gullychain-(logo|icon|wordmark|mascot)/.test(p))
    expect(v3.map((p) => relative(REPO, p))).toEqual([])
  })

  it('never types a GullyChain wordmark in markup', () => {
    const tsx = SCANNED.filter((p) => /\.(tsx|jsx|html)$/.test(p))
    const hits = tsx.filter((p) => />\s*Gully\s?Chain\s*</i.test(readFileSync(p, 'utf8')))
    expect(hits.map((p) => relative(REPO, p))).toEqual([])
  })

  it('the header logo is the kit v4 icon', () => {
    const logo = readFileSync(join(WEB, 'src', 'components', 'common', 'GullySafeLogo', 'index.tsx'), 'utf8')
    expect(logo).toContain('src="/brand/logo/gc-icon.svg"')
    expect(logo).not.toMatch(/\.png"/)
  })

  // SHA-256 of the kit v4 files (= gully-ops sites/_shared/brand/kit-v4) and the shared scripts on gully-ops feat/gc-sync-v4
  const KIT: [string, string][] = [
    ['public/brand/logo/gc-icon.svg', '4f86d2a0c2bb1afda317f21ae7c2198564ca61241f2c48cc75df1cb87033739b'],
    ['public/favicon.svg', '4f86d2a0c2bb1afda317f21ae7c2198564ca61241f2c48cc75df1cb87033739b'],
    ['public/brand/mascots/mascot-builder.png', 'e3ebd29bff2ab4577246de3c97d4bad72421af2c7df0fc7adce6ae44f14b4c97'],
    ['public/brand/mascots/mascot-executive.png', '3e130446792c626fcaea3c51b7ee98a6874ebb0ea4782dab819a119681ee47d6'],
    ['public/brand/mascots/mascot-presenter.png', '93e59014a26463e60dd14ab2e217eb808222f057287221ae75e2e79057f2262e'],
    ['public/fonts/inter-var.woff2', 'f052ee44c3728dfd23aba8a4567150bc314d23903026fbb6ad089422c2df56af'],
    ['public/assets/gc-switcher.js', '4022b13d3de24363824b6c317032bf22187aa84549631905f570fa4e9286228b'],
    ['public/assets/gc-connect.js', 'a6ba55b038ed7e7eece270ae8473472341723e05cbe999cf9f7844258812587f'],
  ]
  it.each(KIT)('%s is the byte-identical source file', (file, hash) => {
    const p = join(WEB, file)
    expect(existsSync(p)).toBe(true)
    expect(sha(p)).toBe(hash)
  })

  it('carries gc-switcher 1.8.2 (no kre8 entries) and gc-connect 1.0.0', () => {
    const sw = readFileSync(join(WEB, 'public', 'assets', 'gc-switcher.js'), 'utf8')
    expect(sw).toContain("GC_SWITCHER_VERSION = '1.8.2'")
    expect(sw).not.toMatch(/href: 'https:\/\/(offers\.)?kre8\.fun\//)
    expect(readFileSync(join(WEB, 'public', 'assets', 'gc-connect.js'), 'utf8')).toContain("GC_CONNECT_VERSION = '1.0.0'")
  })

  it('the Gully services list has Gully Chain products only', () => {
    const cfg = readFileSync(join(WEB, 'src', 'config', 'gully.ts'), 'utf8')
    const list = cfg.slice(cfg.indexOf('GULLY_SERVICES'))
    expect(list).not.toMatch(/kre8\.fun|app\.gullychain\.xyz|gullypay\.xyz|holdermaps\.xyz|gullysecurity\.xyz/)
  })
})
