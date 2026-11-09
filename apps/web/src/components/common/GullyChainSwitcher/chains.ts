import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

/**
 * Gully Multisig chain switcher: pure helpers. A chain is "served" when its transaction service is Gully's own (the
 * config service points at the stack behind this host); third-party services are listed as Coming and cannot be picked
 * (owner, 2026-11-08: picking them landed on a broken chain). Planned chains come from the manifest (or the bundled
 * list) until the config service serves them, then they switch to Live by themselves.
 */
export type Health = 'ok' | 'down' | 'unknown'
export type RowStatus = 'live' | 'offline' | 'checking' | 'coming'

export type PlannedChain = {
  chainId: string
  chainName: string
  shortName: string
  nativeSymbol: string
  isTestnet: boolean
  logo?: string
  note?: string
}

export type ChainRow = {
  chainId: string
  chainName: string
  shortName: string
  nativeSymbol: string
  isTestnet: boolean
  logo: string | null
  status: RowStatus
  selectable: boolean
  current: boolean
  note?: string
  config?: Chain
}

export const LAST_CHAIN_KEY = 'gully-last-chain'
export const MANIFEST_URL = process.env.NEXT_PUBLIC_GULLY_CHAINS_MANIFEST || 'https://gullycore.xyz/chains.json'

/** Gully's own transaction service: the config service names the stack behind this host, or this host itself. */
export const isServedByGully = (transactionService: string | undefined, host = 'gullymultisig.xyz'): boolean => {
  if (!transactionService) return false
  return /^https?:\/\/nginx(:\d+)?\//.test(transactionService) || transactionService.includes(host)
}

/** Where the browser can ask the chain's transaction service whether it is up (same host for Gully's own stacks). */
export const healthUrl = (transactionService: string | undefined, origin: string): string | null => {
  if (!transactionService) return null
  const m = transactionService.match(/^https?:\/\/nginx(?::\d+)?(\/[^?#]*)$/)
  if (m) return `${origin}${m[1].replace(/\/$/, '')}/api/v1/about/`
  if (/^https:\/\//.test(transactionService)) return `${transactionService.replace(/\/$/, '')}/api/v1/about/`
  return null
}

export const statusOf = (served: boolean, health: Health): RowStatus => {
  if (!served) return 'coming'
  if (health === 'ok') return 'live'
  if (health === 'down') return 'offline'
  return 'checking'
}

/** Rows for the menu: the current chain first, then mainnets, then testnets; planned chains at the end of their group. */
export const buildRows = (
  configs: Chain[],
  planned: PlannedChain[],
  health: Record<string, Health>,
  currentChainId: string,
  host?: string,
): ChainRow[] => {
  const known = new Set(configs.map((c) => c.chainId))
  const fromConfig: ChainRow[] = configs.map((c) => {
    const served = isServedByGully(c.transactionService, host)
    const current = c.chainId === currentChainId
    const status = statusOf(served, health[c.chainId] ?? 'unknown')
    return {
      chainId: c.chainId,
      chainName: c.chainName,
      shortName: c.shortName,
      nativeSymbol: c.nativeCurrency.symbol,
      isTestnet: c.isTestnet,
      logo: c.chainLogoUri ?? null,
      status,
      selectable: served || current,
      current,
      note: served ? undefined : `${c.chainName} is being set up on Gully Multisig.`,
      config: c,
    }
  })
  const fromPlan: ChainRow[] = planned
    .filter((p) => !known.has(p.chainId))
    .map((p) => ({
      chainId: p.chainId,
      chainName: p.chainName,
      shortName: p.shortName,
      nativeSymbol: p.nativeSymbol,
      isTestnet: p.isTestnet,
      logo: p.logo ?? null,
      status: 'coming' as const,
      selectable: false,
      current: false,
      note: p.note ?? `${p.chainName} is being deployed.`,
    }))
  const all = [...fromConfig, ...fromPlan]
  const order = (r: ChainRow) => (r.current ? 0 : r.status === 'coming' ? 2 : 1)
  return all.sort((a, b) => order(a) - order(b) || Number(a.isTestnet) - Number(b.isTestnet))
}

export const filterRows = (rows: ChainRow[], query: string): ChainRow[] => {
  const q = query.trim().toLowerCase()
  if (!q) return rows
  return rows.filter(
    (r) =>
      r.chainName.toLowerCase().includes(q) ||
      r.shortName.toLowerCase().includes(q) ||
      r.nativeSymbol.toLowerCase().includes(q) ||
      r.chainId === q,
  )
}

const keyFor = (account: string | null | undefined) => `${LAST_CHAIN_KEY}:${(account ?? 'anon').toLowerCase()}`

export const rememberLastChain = (
  storage: Pick<Storage, 'setItem'> | undefined,
  account: string | null | undefined,
  chainId: string,
): void => {
  try {
    storage?.setItem(keyFor(account), chainId)
  } catch {
    // storage blocked: nothing to remember
  }
}

export const readLastChain = (
  storage: Pick<Storage, 'getItem'> | undefined,
  account: string | null | undefined,
): string | null => {
  try {
    return storage?.getItem(keyFor(account)) ?? null
  } catch {
    return null
  }
}
