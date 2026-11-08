import { readFileSync } from 'fs'
import { join } from 'path'
import { agoText, chainKind, dailySeries, readCache, summarize, type StatsFile } from '../GullyActivityCard/stats'

// Owner, 2026-11-08 ("bad ux" on the accounts screen): three header calls to action at once, four buttons for two
// actions, Safe wording everywhere and an empty dark box. Design slice 1: one session control in the header, "My
// multisigs" with one primary and one secondary action, Import as a text link, a live activity card from the chains.
const src = join(__dirname, '..', '..', '..')
const read = (p: string) => readFileSync(join(src, p), 'utf8')

const stats: StatsFile = {
  updated: '2026-11-08T23:15:01Z',
  chains: [
    {
      id: 6714,
      name: 'Anubis Network',
      safes: 7,
      txs: 12,
      safes_daily: [
        { day: '2026-11-05', n: 4 },
        { day: '2026-11-07', n: 1 },
      ],
      txs_daily: [
        { day: '2026-11-05', n: 2 },
        { day: '2026-11-07', n: 10 },
      ],
    },
    {
      id: 485590,
      name: 'Gully Chain Testnet',
      safes: 9,
      txs: 39,
      safes_daily: [],
      txs_daily: [{ day: '2026-10-01', n: 5 }],
    },
  ],
}
const now = new Date(2026, 10, 8, 12).getTime()

describe('activity feed helpers', () => {
  it('zero-fills the window, oldest first and today last, and drops rows outside it', () => {
    const s = dailySeries(stats.chains[0].txs_daily, 7, now)
    expect(s).toHaveLength(7)
    expect(s.map((p) => p.v)).toEqual([0, 0, 0, 2, 0, 10, 0])
    expect(s[6].day).toBe(new Date(2026, 10, 8).getTime())
    expect(dailySeries(stats.chains[1].txs_daily, 30, now).every((p) => p.v === 0)).toBe(true)
  })

  it('sums the chains and keeps the file order; a chain with no rows has zero activity, not invented activity', () => {
    const s = summarize(stats, now)!
    expect(s.multisigs).toBe(16)
    expect(s.transactions).toBe(51)
    expect(s.chains).toBe(2)
    expect(s.perChain.map((c) => c.id)).toEqual([6714, 485590])
    expect(s.perChain[0].last7).toBe(12)
    expect(s.perChain[1].created.every((p) => p.v === 0)).toBe(true)
    expect(summarize(null)).toBeNull()
    expect(summarize({ updated: 'x', chains: 'nope' } as unknown as StatsFile)).toBeNull()
  })

  it('names testnets and says how old the file is without making a time up', () => {
    expect(chainKind('Gully Chain Testnet')).toBe('testnet')
    expect(chainKind('Anubis Network')).toBe('mainnet')
    expect(agoText(Date.parse(stats.updated), Date.parse(stats.updated) + 30_000)).toBe('updated just now')
    expect(agoText(Date.parse(stats.updated), Date.parse(stats.updated) + 5 * 60_000)).toBe('updated 5 min ago')
    expect(agoText(null)).toBe('update time unknown')
  })

  it('ignores a broken cache', () => {
    expect(readCache({ getItem: () => '{not json' })).toBeNull()
    expect(readCache({ getItem: () => JSON.stringify({ chains: 1 }) })).toBeNull()
    expect(readCache({ getItem: () => JSON.stringify(stats) })?.chains).toHaveLength(2)
    expect(readCache(undefined)).toBeNull()
  })
})

describe('the header has one session control', () => {
  const header = read('components/common/Header/index.tsx')

  it('no "Start building", no stand-alone Gully ID button once a wallet is connected', () => {
    expect(header).not.toContain('Start building')
    expect(header).toContain('{!wallet && (')
    expect(header).toContain('css.session')
  })

  it('Gully ID sign-in moved into the wallet chip menu', () => {
    expect(read('components/common/WalletInfo/index.tsx')).toContain('<GullySignIn />')
  })
})

describe('My multisigs', () => {
  it('title, one primary and one secondary action, Import as a text link, the live card above the list', () => {
    expect(read('features/myAccounts/components/AccountsHeader/index.tsx')).toContain('My multisigs')
    expect(read('features/myAccounts/components/AccountsHeader/index.tsx')).toContain('Add an existing one')
    expect(read('features/myAccounts/components/CreateButton/index.tsx')).toContain('Create a multisig')
    const page = read('features/myAccounts/components/MyAccounts/index.tsx')
    expect(page).toContain('<GullyActivityCard />')
    expect(page).toContain('<DataWidget compact={!isSidebar} />')
    expect(read('features/myAccounts/components/DataWidget/index.tsx')).toContain('Import your multisig data')
    expect(read('features/myAccounts/styles.module.css')).toContain('max-width: 1200px')
  })

  it('says multisig, never Safe or account, in the list copy and the sidebar', () => {
    for (const f of [
      'features/myAccounts/components/AccountsHeader/index.tsx',
      'features/myAccounts/components/CreateButton/index.tsx',
      'features/myAccounts/components/DataWidget/index.tsx',
      'features/myAccounts/components/MigrationPrompt/index.tsx',
      'features/myAccounts/components/ConnectWalletPrompt/index.tsx',
      'features/myAccounts/components/AccountsList/index.tsx',
      'features/myAccounts/components/PinnedSafes/index.tsx',
    ]) {
      const text = read(f).replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
      // visible copy only: JSX text between tags and string props
      const copy = (text.match(/>[^<>{}]*[A-Za-z][^<>{}]*</g) ?? []).join(' ')
      expect({ f, copy }).not.toEqual(
        expect.objectContaining({ copy: expect.stringMatching(/\bSafes?\b|\bAccounts?\b/) }),
      )
    }
    expect(read('components/sidebar/GullyAccountSidebar/index.tsx')).toContain("'My multisigs'")
    expect(read('pages/welcome/accounts.tsx')).toContain('My multisigs')
  })

  it('the live card draws real numbers only and has an honest empty state', () => {
    const card = read('components/gully/GullyActivityCard/index.tsx')
    expect(card).toContain('fetch(STATS_URL')
    expect(card).toContain('No activity yet on')
    expect(card).toContain('did not answer')
    expect(card).toContain('<CountUp')
    expect(card).toContain('<Sparkline')
    expect(read('components/gully/GullyActivityCard/styles.module.css')).toContain('prefers-reduced-motion')
  })
})

describe('toasts wear the kit', () => {
  it('slide in, ink card, severity bar, no stock alert look', () => {
    const css = read('components/common/Notifications/styles.module.css')
    expect(css).toContain('@keyframes toastIn')
    expect(css).toContain('border-left')
    expect(css).toContain('prefers-reduced-motion')
  })
})
