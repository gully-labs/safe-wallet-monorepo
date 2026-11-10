import { readFileSync } from 'fs'
import { join } from 'path'
import { chainLinksFor, ROBINHOOD_CHAIN_ID } from '@/config/gully'
import { GULLY_APPS, gullyAppsFor, gullyAppUrl, isGullyAppUrl, openAppQuery } from '@/config/gullyApps'

const src = (p: string) => readFileSync(join(__dirname, '..', '..', '..', p), 'utf8')

// Owner 2026-11-10: "bad ux and why isnt there a swap in the app? why our services not in the multisig app that fits it?"
describe('Gully services run inside the multisig (Safe Apps)', () => {
  it('Swap, Locks, Vaults, Distribute and Stock markets on every served chain, the testnet on the testnet build', () => {
    expect(GULLY_APPS.map((a) => a.id)).toEqual(['swap', 'locks', 'vaults', 'distribute', 'stocks'])
    for (const id of ['6714', '4663', '99901']) expect(gullyAppUrl('swap', id)).toBe('https://app.gullycore.xyz/safe-apps/swap')
    expect(gullyAppUrl('swap', '485590')).toBe('https://testnet.gullycore.xyz/safe-apps/swap')
    expect(gullyAppsFor('8453')).toEqual([])
    expect(gullyAppsFor(undefined)).toEqual([])
  })

  it('opens an app in-app for a multisig', () => {
    expect(openAppQuery('gully-test', '0xabc', 'https://testnet.gullycore.xyz/safe-apps/swap')).toEqual({
      safe: 'gully-test:0xabc',
      appUrl: 'https://testnet.gullycore.xyz/safe-apps/swap',
    })
  })

  it('first-party apps skip the third-party disclaimer and the cross-origin manifest fetch; no Safe cookie probe', () => {
    expect(isGullyAppUrl('https://app.gullycore.xyz/safe-apps/swap')).toBe(true)
    expect(isGullyAppUrl('https://evil.example/app.gullycore.xyz')).toBe(false)
    expect(src('pages/apps/open.tsx')).toContain('isModalVisible && !(isGullyAppUrl(appUrl) && safeAppData)')
    expect(src('hooks/safe-apps/useSafeAppFromManifest.ts')).toContain('!isGullyAppUrl(appUrl)')
    expect(src('config/constants.ts')).toContain("SAFE_APPS_THIRD_PARTY_COOKIES_CHECK_URL = ''")
  })

  it('the header Swap opens the swap app in-app, never another site', () => {
    const page = src('pages/swap.tsx')
    expect(page).not.toContain('window.location.replace')
    expect(page).not.toContain('https://app.gullycore.xyz/swap')
    expect(page).toContain("gullyAppUrl('swap', chainId)")
    expect(page).toContain('AppRoutes.apps.open')
    expect(src('components/common/GullyNav/index.tsx')).toContain("new Set(['services', 'swap'])")
  })

  it('the services page has the in-app apps first and the chain links after, with copy per chain', () => {
    const panel = src('components/gully/GullyServices/index.tsx')
    expect(panel).toContain('Use from this multisig')
    expect(panel).toContain('Around {chainName}')
    expect(panel).toContain('AppRoutes.apps.open')
    expect(JSON.stringify(chainLinksFor(ROBINHOOD_CHAIN_ID))).not.toMatch(/faucet|test ETH/i)
    for (const id of ['6714', '4663', '99901', '485590']) expect(JSON.stringify(chainLinksFor(id))).not.toContain('Links open in a new tab')
  })
})

describe('Clean UX', () => {
  it('one auth entry: no second Connect button on My multisigs', () => {
    expect(src('features/myAccounts/components/AccountsHeader/index.tsx')).not.toContain('ConnectWalletButton')
  })
  it('the dashboard chart axis labels are plain numbers, the unit in the title', () => {
    const card = src('components/gully/GullyActivityCard/index.tsx')
    expect(card).toContain('title="Transactions executed per day (tx), last 30 days, all chains"\n            unit="plain"')
  })
})
