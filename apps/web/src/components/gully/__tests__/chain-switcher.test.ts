import { readFileSync } from 'fs'
import { join } from 'path'

// Gully Multisig (owner, 2026-11-08: "there's no chain switcher"): the network selector is in the top bar on every route
// and lists every chain the config service serves, not only the chains of the open Safe. Upstream rendered it only inside
// a Safe and listed only that Safe's chains. These checks read the sources, so a merge from upstream that brings the old
// behaviour back fails here.
const src = join(__dirname, '..', '..', '..')
const read = (p: string) => readFileSync(join(src, p), 'utf8')

describe('Gully Multisig chain switcher', () => {
  it('the header shows the network selector with or without a Safe, and /welcome shows that header', () => {
    const header = read('components/common/Header/index.tsx')
    expect(header).toContain('data-testid="gully-network-selector"')
    expect(header).not.toMatch(/\{safeAddress && \(\s*<div className=\{classnames\(css\.element, css\.networkSelector\)\}>/)

    // /welcome shows that same header (it used to hide it and draw its own bar without the selector)
    expect(read('components/common/PageLayout/index.tsx')).not.toMatch(/hideHeader = [^
]*isWelcomePage/)
  })

  it('the selector offers every configured chain, also with a Safe open', () => {
    const selector = read('components/common/NetworkSelector/index.tsx')
    expect(selector).toContain('configs.map((config) => config.chainId)')
    expect(selector).not.toContain('allMultiChainSafes')
  })

  it('/swap goes to the Gully Core swap instead of loading the CoW widget, and /gully-services has an h1', () => {
    const swap = read('pages/swap.tsx')
    expect(swap).toContain('https://app.gullycore.xyz/swap')
    expect(swap).not.toContain('cowprotocol')
    expect(read('components/gully/GullyServices/index.tsx')).toContain('component="h1"')
  })
})
