// Gully Safe mainnet readiness (2026-11-02): the Gully chain is config (gully-contracts.json keyed by chain id,
// NEXT_PUBLIC_GULLY_CHAIN_ID), testnet stays the default, and mainnet 48559 has no Safe contracts until they exist.
import { readFileSync } from 'fs'
import { join } from 'path'
import { GULLY_CHAINS, GULLY_CHAIN, GULLY_CHAIN_ID, gullyChainIdFrom, hasGullySafe } from '@/config/gully-chains'
import { GULLY_DEPLOYMENTS_REGISTERED, registerGullyDeployments } from '@/config/gully-deployments'
import { factoriesFor, loadGullySafeStats } from '@/components/gully/landing/useGullySafeStats'
import { getLatestSpendingLimitAddress } from '@/features/spending-limits/services/spendingLimitDeployments'

const TESTNET = '485590'
const MAINNET = '48559'
const PROXY_FACTORY = '0xd9d2Ba03a7754250FDD71333F444636471CACBC4'
const CANONICAL_FACTORY = '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67'
const GULLY_MODULE = '0x0Fd09Bd80206854b1dAd588A2eFCd7573De536b9'
const TESTNET_HOSTS = /testnet-(rpc|bridge|explorer)\.gullychain\.xyz|faucet\.gullychain\.xyz/

describe('Gully chain config', () => {
  it('defaults to Gully Chain Testnet; an unknown id falls back to it', () => {
    expect(GULLY_CHAIN_ID).toBe(TESTNET)
    expect(GULLY_CHAIN.name).toBe('Gully Chain Testnet')
    expect(gullyChainIdFrom(undefined)).toBe(TESTNET)
    expect(gullyChainIdFrom('')).toBe(TESTNET)
    expect(gullyChainIdFrom('1')).toBe(TESTNET)
    expect(gullyChainIdFrom(` ${MAINNET} `)).toBe(MAINNET)
  })

  it('keeps the testnet addresses as they were', () => {
    const t = GULLY_CHAINS[TESTNET]
    expect(t.contracts?.proxyFactory).toBe(PROXY_FACTORY)
    expect(t.contracts?.singleton).toBe('0x639245e8476E03e789a244f279b5843b9633b2E7')
    expect(t.modules?.allowanceModule['0.1.1']).toBe(GULLY_MODULE)
    expect(t.rpc).toBe('https://testnet-rpc.gullychain.xyz')
    expect(hasGullySafe(TESTNET)).toBe(true)
  })

  it('lists mainnet 48559 with no contracts, no modules and no faucet yet', () => {
    const m = GULLY_CHAINS[MAINNET]
    expect(m).toMatchObject({ name: 'Gully Chain', testnet: false, contracts: null, modules: null, faucet: null })
    expect(JSON.stringify(m)).not.toMatch(TESTNET_HOSTS)
    expect(hasGullySafe(MAINNET)).toBe(false)
    expect(hasGullySafe('1')).toBe(false)
  })

  it('registers only the chains that have contracts', () => {
    expect(registerGullyDeployments()).toEqual({ [TESTNET]: true })
    expect(GULLY_DEPLOYMENTS_REGISTERED).toBe(true)
  })

  it('spending limits: overlay on 485590 only', () => {
    expect(getLatestSpendingLimitAddress(TESTNET)).toBe(GULLY_MODULE)
    expect(getLatestSpendingLimitAddress(MAINNET)).toBeUndefined()
  })

  it('live stats: factories per chain, nothing fetched for a chain without Safes', async () => {
    expect(factoriesFor(GULLY_CHAINS[TESTNET])).toEqual([PROXY_FACTORY, CANONICAL_FACTORY])
    expect(factoriesFor(GULLY_CHAINS[MAINNET])).toEqual([])
    const fetchSpy = jest.fn(() => Promise.reject(new Error('no fetch expected')))
    const old = global.fetch
    global.fetch = fetchSpy as unknown as typeof fetch
    try {
      const s = await loadGullySafeStats(undefined, GULLY_CHAINS[MAINNET])
      expect(s).toMatchObject({ head: 0, safes: [], executions: [], heldWei: BigInt(0) })
      expect(fetchSpy).not.toHaveBeenCalled()
    } finally {
      global.fetch = old
    }
  })
})

describe('mainnet build (NEXT_PUBLIC_GULLY_CHAIN_ID=48559)', () => {
  const env = process.env.NEXT_PUBLIC_GULLY_CHAIN_ID
  afterEach(() => {
    if (env === undefined) delete process.env.NEXT_PUBLIC_GULLY_CHAIN_ID
    else process.env.NEXT_PUBLIC_GULLY_CHAIN_ID = env
  })

  it('serves Gully Chain 48559: no testnet hosts, no faucet, nothing registered for it', () => {
    process.env.NEXT_PUBLIC_GULLY_CHAIN_ID = MAINNET
    jest.isolateModules(() => {
      const chains = require('@/config/gully-chains')
      const gully = require('@/config/gully')
      const deployments = require('@/config/gully-deployments')
      expect(chains.GULLY_CHAIN_ID).toBe(MAINNET)
      expect(chains.GULLY_CHAIN.name).toBe('Gully Chain')
      const services = JSON.stringify(gully.GULLY_SERVICES)
      expect(services).not.toMatch(TESTNET_HOSTS)
      expect(gully.GULLY_SERVICES.some((s: { name: string }) => s.name === 'Faucet')).toBe(false)
      expect(services).toContain('https://bridge.gullychain.xyz/')
      expect(services).toContain('https://explorer.gullychain.xyz/')
      expect(deployments.GULLY_CHAIN_ID).toBe(MAINNET)
      expect(deployments.GULLY_DEPLOYMENTS_REGISTERED).toBe(false)
    })
  })
})

describe('no Gully chain id or testnet host hard-coded in the components', () => {
  const FILES = [
    'src/components/gully/GullySafeActivity/index.tsx',
    'src/components/gully/landing/GullyLanding.tsx',
    'src/components/gully/landing/useGullySafeStats.ts',
    'src/components/common/MetaTags/index.tsx',
    'src/config/gully.ts',
    'src/config/gully-deployments.ts',
    'src/features/spending-limits/services/spendingLimitDeployments.ts',
  ]
  const code = (f: string) =>
    readFileSync(join(__dirname, '../../..', f), 'utf8')
      .split('\n')
      .filter((l) => !/^\s*(\*|\/\*\*|\/\/)/.test(l))
      .join('\n')
  for (const f of FILES)
    it(f, () => {
      expect(code(f)).not.toMatch(/485590|testnet-(rpc|bridge|explorer)\.gullychain\.xyz|gully-contracts\.json/)
    })
})
