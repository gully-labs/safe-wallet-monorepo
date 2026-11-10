import { readFileSync } from 'fs'
import { join } from 'path'
import {
  addFundsCopyFor,
  chainLinksFor,
  ANUBIS_BRIDGE_URL,
  ANUBIS_CHAIN_ID,
  ANUBIS_EXPLORER_URL,
  GULLY_SERVICES,
  GULLY_TESTNET_CHAIN_ID,
} from '@/config/gully'
import { descriptionText, landingTitle } from '@/components/common/MetaTags'

const TESTNET_ONLY = /faucet|test ETH|testnet-bridge|testnet-explorer|free testnet/i

const testnet = { chainId: GULLY_TESTNET_CHAIN_ID, chainName: 'Gully Chain Testnet', nativeCurrency: { symbol: 'ETH' } }
const anubis = { chainId: ANUBIS_CHAIN_ID, chainName: 'Anubis Network', nativeCurrency: { symbol: 'gasDAI' } }

describe('Gully Multisig: the dashboard copy follows the chain of the open Safe', () => {
  it('keeps the faucet and test ETH on Gully Chain Testnet', () => {
    const copy = addFundsCopyFor(testnet, false)
    expect(copy.title).toBe('Add funds to get started')
    expect(copy.text).toBe('Send ETH to your address from another wallet, or get free test ETH from the faucet.')
    expect(copy.links).toEqual([{ label: 'Faucet', href: 'https://faucet.gullychain.xyz/' }])
  })

  it('says tokens on Anubis Network: gasDAI pays gas only, with the Anubis bridge and explorer', () => {
    const copy = addFundsCopyFor(anubis, true)
    expect(copy.title).toBe('Add tokens to get started')
    expect(copy.text).toBe(
      'gasDAI pays gas only on Anubis Network and cannot be sent to a multisig. Tokens are ERC-20: send tokens to your address from another wallet, or bring them in over the bridge.',
    )
    expect(copy.links.map((l) => l.href)).toEqual([ANUBIS_BRIDGE_URL, ANUBIS_EXPLORER_URL])
    expect(ANUBIS_BRIDGE_URL).toBe('https://app.anubisbridge.com')
    expect(ANUBIS_EXPLORER_URL).toBe('https://browser.anubispace.org')
    expect(JSON.stringify(copy)).not.toMatch(TESTNET_ONLY)
  })

  it('has no testnet copy on any other chain, gas-only or not', () => {
    const other = { chainId: '8453', chainName: 'Base', nativeCurrency: { symbol: 'ETH' } }
    expect(addFundsCopyFor(other, false)).toEqual({
      title: 'Add funds to get started',
      text: 'Send ETH or tokens to your address from another wallet.',
      links: [],
    })
    expect(JSON.stringify(addFundsCopyFor(other, true))).not.toMatch(TESTNET_ONLY)
    expect(addFundsCopyFor(other, true).links).toEqual([])
    expect(JSON.stringify(addFundsCopyFor(undefined, false))).not.toMatch(TESTNET_ONLY)
  })
})

describe('Gully Multisig: the links panel follows the chain', () => {
  it('lists the Gully Chain services on the testnet', () => {
    const links = chainLinksFor(GULLY_TESTNET_CHAIN_ID)
    expect(links?.title).toBe('Gully Chain Testnet')
    expect(links?.services).toBe(GULLY_SERVICES)
    expect(links?.services.map((s) => s.name)).toEqual(expect.arrayContaining(['Bridge', 'Faucet', 'Explorer']))
  })

  it('lists the Anubis bridge and explorer on Anubis Network, and no testnet service', () => {
    const links = chainLinksFor(ANUBIS_CHAIN_ID)
    expect(links?.title).toBe('Anubis Network')
    expect(links?.subtitle).toContain('gasDAI pays gas only on Anubis Network')
    expect(links?.subtitle).toContain('Tokens are ERC-20')
    const hrefs = links?.services.map((s) => s.href) ?? []
    expect(hrefs.slice(0, 2)).toEqual([ANUBIS_BRIDGE_URL, ANUBIS_EXPLORER_URL])
    expect(JSON.stringify(links)).not.toMatch(TESTNET_ONLY)
    expect(hrefs.every((h) => h.startsWith('https://'))).toBe(true)
  })

  it('leaves the panel out on a chain without checked links', () => {
    expect(chainLinksFor('8453')).toBeUndefined()
    expect(chainLinksFor(undefined)).toBeUndefined()
  })

  it('no link anywhere names the retired host', () => {
    const cfg = readFileSync(join(__dirname, '..', '..', '..', 'config', 'gully.ts'), 'utf8')
    expect(cfg).not.toContain('safe.gullychain.xyz')
  })
})

describe('Gully Multisig: the components read the chain, they do not assume the testnet', () => {
  const src = (p: string) => readFileSync(join(__dirname, '..', '..', p), 'utf8')

  it('the add funds banner takes its copy from the chain', () => {
    const banner = src('dashboard/AddFundsBanner/index.tsx')
    expect(banner).toContain('addFundsCopyFor(chain, noNativeValue)')
    expect(banner).not.toMatch(TESTNET_ONLY)
  })

  it('the links panel takes its list from the chain', () => {
    const panel = src('gully/GullyServices/index.tsx')
    expect(panel).toContain('chainLinksFor(chainId)')
    expect(panel).not.toContain('GULLY_SERVICES')
  })

  it('the first step says tokens where the native coin pays gas only', () => {
    expect(src('dashboard/FirstSteps/index.tsx')).toContain("noNativeValue ? 'Add tokens' : 'Add native assets'")
  })
})

describe('Gully Multisig: the landing names the chains it serves', () => {
  const landing = readFileSync(join(__dirname, '..', 'landing', 'GullyLanding.tsx'), 'utf8')

  it('leads with Anubis Network and has one h1', () => {
    expect(landing).toContain('Anubis Network · Kinetiq Elysium · Gully Chain Testnet · Safe 1.4.1')
    expect(landing.match(/<h1\b/g)).toHaveLength(1)
    expect(landing).toContain(
      'Anubis Network (chain id 6714, a mainnet), Kinetiq Elysium (chain id 99901, a mainnet) and Gully Chain Testnet (chain id 485590',
    )
  })

  it('does not send visitors to the faucet, and makes no audit claim of its own', () => {
    expect(landing).not.toMatch(/faucet\.gullychain\.xyz|Get test ETH/)
    expect(landing).not.toMatch(/audited/i)
    expect(landing).toContain('unmodified Safe 1.4.1 contracts')
    expect(landing).toContain('at the canonical addresses on Anubis Network')
  })

  it('has a title of at most 60 characters and a description of 120 to 160', () => {
    expect(landingTitle.length).toBeLessThanOrEqual(60)
    expect(descriptionText.length).toBeGreaterThanOrEqual(120)
    expect(descriptionText.length).toBeLessThanOrEqual(160)
    expect(descriptionText).toContain('Anubis Network')
  })
})
