import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'
import { holdingShares } from '../HoldingsBar'

// Design slice 6: the gap sweep. Visible copy says multisig everywhere (the GPL footer notice and the Safe Apps feature
// name are the exceptions), local mutations toast, the assets page has a chart.
const src = join(__dirname, '..', '..', '..')
const read = (p: string) => readFileSync(join(src, p), 'utf8')

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) return n === 'node_modules' ? [] : walk(p)
    return /\.tsx?$/.test(n) && !/stories/.test(n) ? [p] : []
  })

describe('wording', () => {
  it('no visible "Safe Account", "this/your/a Safe" or "Nested Safe" is left in the app source', () => {
    const rx = /\bSafe Accounts?\b|\b(this|your|a) Safe\b(?![\w{])(?! Apps?\b)|\bNested Safes?\b|\bParent Safe\b/
    const offenders: string[] = []
    for (const dir of ['components', 'features', 'pages', 'hooks', 'config']) {
      for (const p of walk(join(src, dir))) {
        const code = readFileSync(p, 'utf8')
          .split('\n')
          .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
          .join('\n')
        if (rx.test(code)) offenders.push(p.slice(src.length + 1))
      }
    }
    expect(offenders).toEqual([])
  })
})

describe('toasts on local mutations', () => {
  it('address book save, remove and import report', () => {
    expect(read('components/address-book/EntryDialog/index.tsx')).toContain('showNotification')
    expect(read('components/address-book/RemoveDialog/index.tsx')).toContain('showNotification')
    expect(read('components/address-book/ImportDialog/index.tsx')).toContain('showNotification')
  })
})

describe('assets page chart', () => {
  it('shares by fiat value, top five then Other, nothing without a fiat value', () => {
    const h = holdingShares([
      { symbol: 'A', fiat: 50 },
      { symbol: 'B', fiat: 30 },
      { symbol: 'C', fiat: 10 },
      { symbol: 'D', fiat: 5 },
      { symbol: 'E', fiat: 3 },
      { symbol: 'F', fiat: 1 },
      { symbol: 'G', fiat: 1 },
      { symbol: 'X', fiat: 0 },
      { symbol: 'Y', fiat: NaN },
    ])
    expect(h.map((x) => x.label)).toEqual(['A', 'B', 'C', 'D', 'E', 'Other'])
    expect(h[0].share).toBeCloseTo(0.5)
    expect(h[5].fiat).toBe(2)
    expect(h.reduce((s, x) => s + x.share, 0)).toBeCloseTo(1)
    expect(holdingShares([{ symbol: 'A', fiat: 0 }])).toEqual([])
  })

  it('is on the assets page', () => {
    expect(read('pages/balances/index.tsx')).toContain('<HoldingsBar />')
  })
})
