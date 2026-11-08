import { readFileSync } from 'fs'
import { join } from 'path'
import { ANUBIS_BRIDGE_URL, ANUBIS_CHAIN_ID, GULLY_TESTNET_CHAIN_ID } from '@/config/gully'
import { addressCopiedMessage, gullyTokenActionsFor, gullyToolsFor } from '@/config/gullyIntegrations'

const SAFE = '0x482DB3E6651e8ee1A36Aa0539B4711b1488896c8'
const TOKEN = '0x83fd06F0846d9D90B3016bF670Efe2E0B11cDe14'
const explorerUrl = `https://example.org/address/${SAFE}`

describe('Gully Multisig: sidebar tools follow the Safe and its chain', () => {
  it('puts the Safe in the Gully Bridge link on the testnet and offers the faucet', () => {
    const tools = gullyToolsFor({ chainId: GULLY_TESTNET_CHAIN_ID, safeAddress: SAFE, explorerUrl })
    expect(tools.map((t) => t.id)).toEqual(['explorer', 'bridge', 'faucet'])

    const bridge = new URL(tools[1].href)
    expect(bridge.origin).toBe('https://testnet-bridge.gullychain.xyz')
    expect(bridge.searchParams.get('destinationAddress')).toBe(SAFE)
    expect(bridge.searchParams.get('destinationChain')).toBe('gully-chain-testnet')
    expect(bridge.searchParams.get('sourceChain')).toBe('arbitrum-sepolia')
    expect(tools[1].copiesAddress).toBe(false)
    expect(tools[2].copiesAddress).toBe(true)
  })

  it('has no faucet and no testnet link on Anubis Network', () => {
    const tools = gullyToolsFor({ chainId: ANUBIS_CHAIN_ID, safeAddress: SAFE, explorerUrl })
    expect(tools.map((t) => t.id)).toEqual(['explorer', 'bridge'])
    expect(tools[1].href).toBe(ANUBIS_BRIDGE_URL)
    expect(tools[1].copiesAddress).toBe(true)
    expect(JSON.stringify(tools)).not.toMatch(/faucet|testnet/i)
  })

  it.each(['1', '8453', '48559'])('offers no Gully link on chain %s, even with an explorer', (chainId) => {
    const tools = gullyToolsFor({ chainId, safeAddress: SAFE, explorerUrl })
    expect(tools.map((t) => t.id)).toEqual(['explorer'])
  })

  it('leaves the explorer out when the chain has none', () => {
    const tools = gullyToolsFor({ chainId: GULLY_TESTNET_CHAIN_ID, safeAddress: SAFE, explorerUrl: undefined })
    expect(tools.map((t) => t.id)).toEqual(['bridge', 'faucet'])
  })

  it('has nothing without a Safe or a chain', () => {
    expect(gullyToolsFor({ chainId: GULLY_TESTNET_CHAIN_ID, safeAddress: undefined, explorerUrl })).toEqual([])
    expect(gullyToolsFor({ chainId: GULLY_TESTNET_CHAIN_ID, safeAddress: '', explorerUrl })).toEqual([])
    expect(gullyToolsFor({ chainId: undefined, safeAddress: SAFE, explorerUrl })).toEqual([])
  })

  it('never names the retired host', () => {
    const tools = gullyToolsFor({ chainId: GULLY_TESTNET_CHAIN_ID, safeAddress: SAFE, explorerUrl })
    expect(JSON.stringify(tools)).not.toContain('safe.gullychain.xyz')
  })

  it('says what was copied and where it goes', () => {
    expect(addressCopiedMessage('Faucet')).toBe('Safe address copied. Paste it in the Faucet.')
  })
})

describe('Gully Multisig: token actions show only where the product serves the token', () => {
  it('links the three views of a token on the testnet, lower-cased', () => {
    const lower = TOKEN.toLowerCase()
    expect(gullyTokenActionsFor(GULLY_TESTNET_CHAIN_ID, TOKEN).map((a) => a.href)).toEqual([
      `https://holdermaps.xyz/gully/${lower}`,
      `https://gullysecurity.xyz/score/gully/${lower}`,
      `https://gullychain.xyz/core/tokens/${lower}`,
    ])
  })

  it.each([ANUBIS_CHAIN_ID, '1', '48559', undefined])('has none on chain %s', (chainId) => {
    expect(gullyTokenActionsFor(chainId, TOKEN)).toEqual([])
  })

  it('has none for the native coin, which has no contract', () => {
    expect(gullyTokenActionsFor(GULLY_TESTNET_CHAIN_ID, `0x${'0'.repeat(40)}`)).toEqual([])
  })

  it('refuses anything that is not an address', () => {
    expect(gullyTokenActionsFor(GULLY_TESTNET_CHAIN_ID, undefined)).toEqual([])
    expect(gullyTokenActionsFor(GULLY_TESTNET_CHAIN_ID, '0x123')).toEqual([])
    expect(gullyTokenActionsFor(GULLY_TESTNET_CHAIN_ID, `${TOKEN}/../x`)).toEqual([])
  })
})

describe('Gully Multisig: the navigation is lazy and keeps an icon on every item', () => {
  const src = (p: string) => readFileSync(join(__dirname, '..', '..', p), 'utf8')

  it('loads everything new as its own chunk', () => {
    expect(src('sidebar/SidebarNavigation/index.tsx')).toMatch(/dynamic\(\(\) => import\('\.\/GullyChainTools'\)/)
    expect(src('common/PageLayout/SideDrawer.tsx')).toMatch(
      /dynamic\(\(\) => import\('@\/components\/sidebar\/GullyAccountSidebar'\)/,
    )
    expect(src('balances/AssetsTable/ActionButtons.tsx')).toMatch(/dynamic\(\(\) => import\('\.\/GullyTokenActions'\)/)
  })

  it('gives every account menu item an icon', () => {
    const sidebar = src('sidebar/GullyAccountSidebar/index.tsx')
    const items = sidebar.match(/label: '/g) ?? []
    const icons = sidebar.match(/icon: </g) ?? []
    expect(items.length).toBeGreaterThanOrEqual(4)
    expect(icons).toHaveLength(items.length)
  })

  it('gives every tool an icon', () => {
    const tools = src('sidebar/SidebarNavigation/GullyChainTools.tsx')
    for (const id of ['explorer', 'bridge', 'faucet']) expect(tools).toMatch(new RegExp(`${id}: <`))
  })

  it('names no product outside Gully Chain in a menu', () => {
    const menus = src('sidebar/SidebarNavigation/GullyChainTools.tsx') + src('sidebar/GullyAccountSidebar/index.tsx')
    expect(menus).not.toMatch(/HolderMaps|Gully Security|Gully Pay|kre8/)
  })
})
