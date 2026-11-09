import { useEffect, useState } from 'react'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { healthUrl, MANIFEST_URL, type Health, type PlannedChain } from './chains'
import planned from '@/config/gully-planned-chains.json'

const TTL_MS = 60_000
const TIMEOUT_MS = 4_000

// one cache for every switcher instance on the page
const cache: { at: number; health: Record<string, Health> } = { at: 0, health: {} }
const listeners = new Set<() => void>()
let inflight: Promise<void> | null = null

const ping = async (url: string): Promise<Health> => {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const r = await fetch(url, { signal: ctrl.signal, cache: 'no-store' })
    return r.ok ? 'ok' : 'down'
  } catch {
    return 'down'
  } finally {
    clearTimeout(t)
  }
}

const refresh = (configs: Chain[]): Promise<void> => {
  if (inflight) return inflight
  inflight = (async () => {
    const origin = typeof location === 'undefined' ? '' : location.origin
    const next: Record<string, Health> = {}
    await Promise.all(
      configs.map(async (c) => {
        const url = healthUrl(c.transactionService, origin)
        next[c.chainId] = url ? await ping(url) : 'unknown'
      }),
    )
    cache.at = Date.now()
    cache.health = next
    listeners.forEach((l) => l())
  })().finally(() => {
    inflight = null
  })
  return inflight
}

/** Transaction-service health per chain: checked on first use, then every minute while the tab is visible. */
export const useChainHealth = (configs: Chain[]): Record<string, Health> => {
  const [health, setHealth] = useState<Record<string, Health>>(cache.health)
  useEffect(() => {
    const onUpdate = () => setHealth({ ...cache.health })
    listeners.add(onUpdate)
    if (configs.length && Date.now() - cache.at > TTL_MS) refresh(configs)
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible' && configs.length) refresh(configs)
    }, TTL_MS)
    return () => {
      listeners.delete(onUpdate)
      clearInterval(timer)
    }
  }, [configs])
  return health
}

/** Planned chains: the Gully Core manifest when it answers, else the bundled list (same shape). */
export const usePlannedChains = (): PlannedChain[] => {
  const [list, setList] = useState<PlannedChain[]>(planned as PlannedChain[])
  useEffect(() => {
    let alive = true
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    fetch(MANIFEST_URL, { signal: ctrl.signal, cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { planned?: PlannedChain[] } | PlannedChain[]) => {
        const rows = Array.isArray(d) ? d : d?.planned
        if (alive && Array.isArray(rows) && rows.every((p) => p && p.chainId && p.chainName)) setList(rows)
      })
      .catch(() => {
        // no manifest yet: the bundled list stands
      })
      .finally(() => clearTimeout(t))
    return () => {
      alive = false
      ctrl.abort()
    }
  }, [])
  return list
}
