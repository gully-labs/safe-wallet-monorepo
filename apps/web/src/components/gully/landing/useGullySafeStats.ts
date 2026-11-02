import { useEffect, useRef, useState } from 'react'
import { GULLY_CHAIN, GULLY_CHAIN_ID, gullyChain, type GullyChain } from '@/config/gully-chains'

/**
 * Gully Safe landing: live Safe numbers for a Gully chain (gully-chains.ts), read straight from the chain through its
 * public RPC.
 * - Safes: ProxyCreation logs of the chain's Safe 1.4.1 factories (factoriesFor: the Gully deployment the app uses, and
 *   on 485590 the canonical-address factory that ERC-4337 / SDK flows use).
 * - Transactions executed: ExecutionSuccess logs emitted by those Safes.
 * - Value held: the Safes' native ETH balances.
 * Block timestamps come from the blocks that hold the creations (Gully Chain only makes blocks when there are txs,
 * so timestamps cannot be interpolated from block numbers).
 */

/** the build's Gully chain (gully-chains.ts): RPC and explorer of NEXT_PUBLIC_GULLY_CHAIN_ID, testnet by default */
export const GULLY_RPC = GULLY_CHAIN.rpc
export const GULLY_EXPLORER = GULLY_CHAIN.explorer

/** The Gully deployment's factory plus the other factories listed for the chain (on 485590 the canonical-address
 * SafeProxyFactory 1.4.1 that ERC-4337 / SDK flows use). Empty when the chain has no Safe contracts. Pure. */
export const factoriesFor = (chain: GullyChain): string[] =>
  chain.contracts?.proxyFactory ? [chain.contracts.proxyFactory, ...chain.extraFactories] : []
// keccak256('ProxyCreation(address,address)'), Safe 1.4.1: event ProxyCreation(SafeProxy indexed proxy, address singleton)
const PROXY_CREATION = '0x4f51faf6c4561ff95f067657e43439f0f856d97c04d9ec9070a6199ad418e235'
// keccak256('ExecutionSuccess(bytes32,uint256)')
const EXECUTION_SUCCESS = '0x442e715f626346e8c54381002da614f62bee8d27386535b2521ec8540898556e'

const LOG_RANGE = 500_000 // blocks per eth_getLogs call
const MAX_TIMESTAMP_BLOCKS = 400
const MAX_BALANCES = 300
const POLL_MS = 20_000

export type SafeCreation = { address: string; block: number; timestamp: number; tx: string }
export type SafeExecution = { safe: string; block: number; timestamp: number; tx: string }

export type GullySafeStats = {
  head: number
  safes: SafeCreation[] // oldest first
  executions: SafeExecution[] // oldest first
  heldWei: bigint
  updatedAt: number
}

type RpcLog = { address: string; topics: string[]; blockNumber: string; transactionHash: string }
type RpcReq = { method: string; params: unknown[] }

let rpcId = 0
async function rpcBatch<T = unknown>(rpc: string, reqs: RpcReq[], signal?: AbortSignal): Promise<T[]> {
  if (reqs.length === 0) return []
  const body = reqs.map((r) => ({ jsonrpc: '2.0', id: ++rpcId, method: r.method, params: r.params }))
  const res = await fetch(rpc, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  if (!res.ok) throw new Error(`RPC ${res.status}`)
  const out = (await res.json()) as Array<{ id: number; result?: T; error?: { message: string } }>
  const byId = new Map(out.map((o) => [o.id, o]))
  return body.map((b) => {
    const o = byId.get(b.id)
    if (!o || o.error) throw new Error(o?.error?.message || 'RPC error')
    return o.result as T
  })
}

const hex = (n: number) => '0x' + n.toString(16)

async function getLogs(
  rpc: string,
  filter: Record<string, unknown>,
  head: number,
  signal?: AbortSignal,
): Promise<RpcLog[]> {
  const reqs: RpcReq[] = []
  for (let from = 0; from <= head; from += LOG_RANGE) {
    reqs.push({
      method: 'eth_getLogs',
      params: [{ ...filter, fromBlock: hex(from), toBlock: hex(Math.min(head, from + LOG_RANGE - 1)) }],
    })
  }
  const parts = await rpcBatch<RpcLog[]>(rpc, reqs, signal)
  return parts.flat()
}

const topicToAddress = (topic: string) => '0x' + topic.slice(26).toLowerCase()

export async function loadGullySafeStats(
  signal?: AbortSignal,
  chain: GullyChain = GULLY_CHAIN,
): Promise<GullySafeStats> {
  const rpc = chain.rpc
  const factories = factoriesFor(chain)
  if (factories.length === 0) return { head: 0, safes: [], executions: [], heldWei: 0n, updatedAt: Date.now() }
  const [headHex] = await rpcBatch<string>(rpc, [{ method: 'eth_blockNumber', params: [] }], signal)
  const head = parseInt(headHex, 16)

  const creationLogs = await getLogs(rpc, { address: factories, topics: [PROXY_CREATION] }, head, signal)
  const safeSet = new Set(creationLogs.map((l) => topicToAddress(l.topics[1])))

  const execLogs = (await getLogs(rpc, { topics: [EXECUTION_SUCCESS] }, head, signal)).filter((l) =>
    safeSet.has(l.address.toLowerCase()),
  )

  // Timestamps of the most recent blocks that matter (older ones fall back to the oldest known timestamp)
  const blocks = Array.from(
    new Set([...creationLogs, ...execLogs].map((l) => parseInt(l.blockNumber, 16))),
  ).sort((a, b) => b - a)
  const wanted = blocks.slice(0, MAX_TIMESTAMP_BLOCKS)
  const blockRes = await rpcBatch<{ timestamp: string } | null>(
    rpc,
    wanted.map((b) => ({ method: 'eth_getBlockByNumber', params: [hex(b), false] })),
    signal,
  )
  const ts = new Map<number, number>()
  wanted.forEach((b, i) => {
    const r = blockRes[i]
    if (r) ts.set(b, parseInt(r.timestamp, 16) * 1000)
  })
  const oldestKnown = Math.min(...Array.from(ts.values()), Date.now())
  const tsOf = (b: number) => ts.get(b) ?? oldestKnown

  const safes: SafeCreation[] = creationLogs
    .map((l) => ({
      address: topicToAddress(l.topics[1]),
      block: parseInt(l.blockNumber, 16),
      timestamp: tsOf(parseInt(l.blockNumber, 16)),
      tx: l.transactionHash,
    }))
    .sort((a, b) => a.block - b.block)

  const executions: SafeExecution[] = execLogs
    .map((l) => ({
      safe: l.address.toLowerCase(),
      block: parseInt(l.blockNumber, 16),
      timestamp: tsOf(parseInt(l.blockNumber, 16)),
      tx: l.transactionHash,
    }))
    .sort((a, b) => a.block - b.block)

  const balanceOf = safes.slice(-MAX_BALANCES)
  const balances = await rpcBatch<string>(
    rpc,
    balanceOf.map((s) => ({ method: 'eth_getBalance', params: [s.address, 'latest'] })),
    signal,
  )
  const heldWei = balances.reduce((sum, b) => sum + BigInt(b), 0n)

  return { head, safes, executions, heldWei, updatedAt: Date.now() }
}

export type StatsState = { data?: GullySafeStats; error?: string; loading: boolean }

/** Loads the stats of a Gully chain (default: the build's, gully-chains.ts), then refreshes them every 20 s while the
 * tab is visible. */
export function useGullySafeStats(chainId: string = GULLY_CHAIN_ID): StatsState {
  const [state, setState] = useState<StatsState>({ loading: true })
  const busy = useRef(false)

  useEffect(() => {
    const ctrl = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined

    const tick = async () => {
      if (!busy.current && document.visibilityState === 'visible') {
        busy.current = true
        try {
          const data = await loadGullySafeStats(ctrl.signal, gullyChain(chainId) ?? GULLY_CHAIN)
          setState({ data, loading: false })
        } catch (e) {
          if (!ctrl.signal.aborted) {
            setState((prev) => ({ data: prev.data, loading: false, error: (e as Error).message || 'RPC error' }))
          }
        } finally {
          busy.current = false
        }
      }
      if (!ctrl.signal.aborted) timer = setTimeout(tick, POLL_MS)
    }

    tick()
    return () => {
      ctrl.abort()
      if (timer) clearTimeout(timer)
    }
  }, [chainId])

  return state
}
