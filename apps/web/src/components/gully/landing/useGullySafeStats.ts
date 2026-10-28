import { useEffect, useRef, useState } from 'react'
import gullyContracts from '@/config/gully-contracts.json'

/**
 * Gully Safe landing: live Safe numbers for Gully Chain Testnet, read straight from the chain through the public RPC.
 * - Safes: ProxyCreation logs of both Safe 1.4.1 factories on 485590 (the Gully deployment the app uses, and the
 *   canonical-address factory that ERC-4337 / SDK flows use).
 * - Transactions executed: ExecutionSuccess logs emitted by those Safes.
 * - Value held: the Safes' native ETH balances.
 * Block timestamps come from the blocks that hold the creations (Gully Chain only makes blocks when there are txs,
 * so timestamps cannot be interpolated from block numbers).
 */

export const GULLY_TESTNET_RPC = 'https://testnet-rpc.gullychain.xyz'
export const GULLY_EXPLORER = 'https://testnet-explorer.gullychain.xyz'

const FACTORIES = [
  gullyContracts.contracts.proxyFactory,
  '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67', // canonical SafeProxyFactory 1.4.1 address, also on Gully Chain
]
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
async function rpcBatch<T = unknown>(reqs: RpcReq[], signal?: AbortSignal): Promise<T[]> {
  if (reqs.length === 0) return []
  const body = reqs.map((r) => ({ jsonrpc: '2.0', id: ++rpcId, method: r.method, params: r.params }))
  const res = await fetch(GULLY_TESTNET_RPC, {
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

async function getLogs(filter: Record<string, unknown>, head: number, signal?: AbortSignal): Promise<RpcLog[]> {
  const reqs: RpcReq[] = []
  for (let from = 0; from <= head; from += LOG_RANGE) {
    reqs.push({
      method: 'eth_getLogs',
      params: [{ ...filter, fromBlock: hex(from), toBlock: hex(Math.min(head, from + LOG_RANGE - 1)) }],
    })
  }
  const parts = await rpcBatch<RpcLog[]>(reqs, signal)
  return parts.flat()
}

const topicToAddress = (topic: string) => '0x' + topic.slice(26).toLowerCase()

export async function loadGullySafeStats(signal?: AbortSignal): Promise<GullySafeStats> {
  const [headHex] = await rpcBatch<string>([{ method: 'eth_blockNumber', params: [] }], signal)
  const head = parseInt(headHex, 16)

  const creationLogs = await getLogs({ address: FACTORIES, topics: [PROXY_CREATION] }, head, signal)
  const safeSet = new Set(creationLogs.map((l) => topicToAddress(l.topics[1])))

  const execLogs = (await getLogs({ topics: [EXECUTION_SUCCESS] }, head, signal)).filter((l) =>
    safeSet.has(l.address.toLowerCase()),
  )

  // Timestamps of the most recent blocks that matter (older ones fall back to the oldest known timestamp)
  const blocks = Array.from(
    new Set([...creationLogs, ...execLogs].map((l) => parseInt(l.blockNumber, 16))),
  ).sort((a, b) => b - a)
  const wanted = blocks.slice(0, MAX_TIMESTAMP_BLOCKS)
  const blockRes = await rpcBatch<{ timestamp: string } | null>(
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
    balanceOf.map((s) => ({ method: 'eth_getBalance', params: [s.address, 'latest'] })),
    signal,
  )
  const heldWei = balances.reduce((sum, b) => sum + BigInt(b), 0n)

  return { head, safes, executions, heldWei, updatedAt: Date.now() }
}

export type StatsState = { data?: GullySafeStats; error?: string; loading: boolean }

/** Loads the stats, then refreshes them every 20 s while the tab is visible. */
export function useGullySafeStats(): StatsState {
  const [state, setState] = useState<StatsState>({ loading: true })
  const busy = useRef(false)

  useEffect(() => {
    const ctrl = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined

    const tick = async () => {
      if (!busy.current && document.visibilityState === 'visible') {
        busy.current = true
        try {
          const data = await loadGullySafeStats(ctrl.signal)
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
  }, [])

  return state
}
