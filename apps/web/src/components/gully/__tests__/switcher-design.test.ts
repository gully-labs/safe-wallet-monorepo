import { readFileSync } from 'fs'
import { join } from 'path'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import {
  buildRows,
  filterRows,
  healthUrl,
  isServedByGully,
  readLastChain,
  rememberLastChain,
  statusOf,
} from '../../common/GullyChainSwitcher/chains'
import planned from '@/config/gully-planned-chains.json'

// Owner, 2026-11-08: "chain switcher needs to have a better ux". The trigger names the active network and shows its
// health; the menu is a light popover with the current chain first, Mainnets / Testnets, native token and a status chip;
// only chains served by Gully's own transaction service can be picked; planned chains show as Coming until the config
// service serves them.
const src = join(__dirname, '..', '..', '..')
const read = (p: string) => readFileSync(join(src, p), 'utf8')

const chain = (o: Partial<Chain> & { chainId: string; chainName: string }): Chain =>
  ({
    shortName: o.chainName.toLowerCase().slice(0, 4),
    isTestnet: false,
    nativeCurrency: { symbol: 'ETH' },
    chainLogoUri: `/cfg/media/chains/${o.chainId}/chain_logo.png`,
    transactionService: 'http://nginx:8000/txs',
    ...o,
  } as Chain)

const configs = [
  chain({ chainId: '485590', chainName: 'Gully Chain Testnet', shortName: 'gully-test', isTestnet: true }),
  chain({
    chainId: '6714',
    chainName: 'Anubis Network',
    shortName: 'anubis',
    transactionService: 'http://nginx:8000/txs-6714',
    nativeCurrency: { symbol: 'gasDAI' } as never,
  }),
  chain({
    chainId: '56',
    chainName: 'BNB Smart Chain',
    shortName: 'bnb',
    transactionService: 'https://api.safe.global/tx-service/bnb',
    nativeCurrency: { symbol: 'BNB' } as never,
  }),
  chain({
    chainId: '8453',
    chainName: 'Base',
    shortName: 'base',
    transactionService: 'https://api.safe.global/tx-service/base',
  }),
]

describe('served chains', () => {
  it('Gully’s own transaction service is the stack behind this host; third parties are not served', () => {
    expect(isServedByGully('http://nginx:8000/txs')).toBe(true)
    expect(isServedByGully('http://nginx:8000/txs-6714')).toBe(true)
    expect(isServedByGully('https://gullymultisig.xyz/txs-99901')).toBe(true)
    expect(isServedByGully('https://api.safe.global/tx-service/bnb')).toBe(false)
    expect(isServedByGully(undefined)).toBe(false)
  })

  it('health is asked through this host for our stacks and directly for https services', () => {
    expect(healthUrl('http://nginx:8000/txs-6714', 'https://gullymultisig.xyz')).toBe(
      'https://gullymultisig.xyz/txs-6714/api/v1/about/',
    )
    expect(healthUrl('https://api.safe.global/tx-service/base/', 'https://x')).toBe(
      'https://api.safe.global/tx-service/base/api/v1/about/',
    )
    expect(healthUrl(undefined, 'https://x')).toBeNull()
  })

  it('status: served + answering = Live, served + silent = Offline, not served = Coming', () => {
    expect(statusOf(true, 'ok')).toBe('live')
    expect(statusOf(true, 'down')).toBe('offline')
    expect(statusOf(true, 'unknown')).toBe('checking')
    expect(statusOf(false, 'ok')).toBe('coming')
  })
})

describe('rows', () => {
  const rows = buildRows(configs, planned, { '485590': 'ok', '6714': 'ok', '56': 'ok', '8453': 'down' }, '6714')

  it('current first, then mainnets, then testnets; planned chains at the end as Coming; third parties cannot be picked', () => {
    expect(rows.map((r) => r.chainId)).toEqual(['6714', '485590', '56', '8453', '99901'])
    expect(rows[0]).toMatchObject({ current: true, status: 'live', selectable: true })
    expect(rows.find((r) => r.chainId === '56')).toMatchObject({ status: 'coming', selectable: false })
    expect(rows.find((r) => r.chainId === '99901')).toMatchObject({
      chainName: 'Kinetiq Elysium',
      nativeSymbol: 'HYPE',
      status: 'coming',
      selectable: false,
      note: 'Elysium is being deployed.',
    })
  })

  it('a planned chain disappears from the plan the moment the config service serves it', () => {
    const withElysium = [
      ...configs,
      chain({
        chainId: '99901',
        chainName: 'Kinetiq Elysium',
        shortName: 'elysium',
        transactionService: 'http://nginx:8000/txs-99901',
        nativeCurrency: { symbol: 'HYPE' } as never,
      }),
    ]
    const r = buildRows(withElysium, planned, { '99901': 'ok' }, '6714')
    expect(r.filter((x) => x.chainId === '99901')).toHaveLength(1)
    expect(r.find((x) => x.chainId === '99901')).toMatchObject({ status: 'live', selectable: true })
  })

  it('search matches name, short name, token and id', () => {
    expect(filterRows(rows, 'hype').map((r) => r.chainId)).toEqual(['99901'])
    expect(filterRows(rows, 'anub').map((r) => r.chainId)).toEqual(['6714'])
    expect(filterRows(rows, '56').map((r) => r.chainId)).toEqual(['56'])
    expect(filterRows(rows, '')).toHaveLength(5)
  })

  it('remembers the last chain per account and survives a blocked storage', () => {
    const store = new Map<string, string>()
    const s = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) }
    rememberLastChain(s, '0xABC', '6714')
    expect(readLastChain(s, '0xabc')).toBe('6714')
    expect(readLastChain(s, '0xdef')).toBeNull()
    expect(readLastChain(s, undefined)).toBeNull()
    rememberLastChain(s, undefined, '485590')
    expect(readLastChain(s, null)).toBe('485590')
    expect(() =>
      rememberLastChain(
        {
          setItem: () => {
            throw new Error('blocked')
          },
        },
        'a',
        '1',
      ),
    ).not.toThrow()
  })
})

describe('the header uses it', () => {
  it('trigger with the network name, no bare icon; the popover has no page dim', () => {
    const header = read('components/common/Header/index.tsx')
    expect(header).toContain('<GullyChainSwitcher')
    expect(header).toContain('data-testid="gully-network-selector"')
    const sw = read('components/common/GullyChainSwitcher/index.tsx')
    expect(sw).toContain('aria-label={`Network: ${current?.chainName')
    expect(sw).toContain("backgroundColor: 'transparent'")
    expect(sw).toContain('Switched to ${row.chainName}')
    expect(read('components/common/GullyChainSwitcher/styles.module.css')).toContain('@media (max-width: 479.95px)')
  })
})
