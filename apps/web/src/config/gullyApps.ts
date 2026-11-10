/**
 * Gully Multisig: the Gully services that run INSIDE the multisig, as Safe Apps (owner 2026-11-10: "multisig app should
 * be clean UX with bridge swap and other of gully services"). Each is a gully-core-app /safe-apps/<id> page: the open
 * multisig is the account and every action is proposed to its queue; the owners sign as for any multisig transaction.
 *
 * The same apps are registered on Gully Multisig's own config service (gully-ops l3/safe/add_safe_apps.py), per chain,
 * only where the product is live on that chain (gullycore.xyz/manifest.json chains + features), so the app list, the
 * header's Swap and this table agree. Mainnets use the mainnet build (app.gullycore.xyz), the testnet the testnet build.
 */

export type GullyAppId = 'swap' | 'locks' | 'vaults' | 'distribute' | 'stocks'

export type GullyApp = { id: GullyAppId; name: string; line: string }

export const GULLY_APPS: GullyApp[] = [
  { id: 'swap', name: 'Swap', line: 'Trade tokens on Gully Core. Approval and swap go to the queue as one transaction.' },
  { id: 'locks', name: 'Locks', line: 'Lock liquidity or vest tokens from this multisig.' },
  { id: 'vaults', name: 'Vaults', line: 'Open a Gully Core vault this multisig owns.' },
  { id: 'distribute', name: 'Distribute', line: 'Splits, airdrops and batch sends from this multisig.' },
  { id: 'stocks', name: 'Stock markets', line: 'Run a Gully Core stock market owned by this multisig.' },
]

/** The Gully Core kit icon (02-icon/gully-core-icon-orange.png, byte-identical), the mark of every Gully Core app. */
export const GULLY_CORE_ICON = '/brand/gully-core/gully-core-icon-orange.png'

const MAINNET_APP = 'https://app.gullycore.xyz'
const TESTNET_APP = 'https://testnet.gullycore.xyz'

/** Where Gully Core runs per served chain (manifest: router, locks, vaults, splits, stocks live on 6714, 4663, 99901; testnet 485590). */
const APP_ORIGIN: Record<string, string> = {
  '6714': MAINNET_APP,
  '4663': MAINNET_APP,
  '99901': MAINNET_APP,
  '485590': TESTNET_APP,
}

/** The app's URL on a chain, or undefined where it does not run. */
export const gullyAppUrl = (id: GullyAppId, chainId: string | undefined): string | undefined => {
  const origin = chainId ? APP_ORIGIN[chainId] : undefined
  return origin ? `${origin}/safe-apps/${id}` : undefined
}

/** The apps that run on a chain (empty on a chain without Gully Core). */
export const gullyAppsFor = (chainId: string | undefined): (GullyApp & { url: string })[] =>
  GULLY_APPS.flatMap((a) => {
    const url = gullyAppUrl(a.id, chainId)
    return url ? [{ ...a, url }] : []
  })

/** A Gully-run app (first party): no third-party disclaimer, no manifest fetch across origins, no cookie probe. */
export const isGullyAppUrl = (url: string | undefined): boolean =>
  !!url && /^https:\/\/(app|testnet)\.gullycore\.xyz(\/|$)/.test(url)

/** The query of /apps/open for an app and a multisig (`safe` is `<shortName>:<address>`). */
export const openAppQuery = (shortName: string, safeAddress: string, url: string) => ({
  safe: `${shortName}:${safeAddress}`,
  appUrl: url,
})
