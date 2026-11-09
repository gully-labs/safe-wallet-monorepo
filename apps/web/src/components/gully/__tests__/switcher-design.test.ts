import { createHash } from 'crypto'
import { readFileSync } from 'fs'
import { join } from 'path'
import { healthUrl, SWITCHER_SRC, SWITCHER_SURFACE } from '../../common/GullyChainSwitcher'

// Owner, 2026-11-08: "chain switcher needs to have a better ux". Coordinator, 2026-11-09: every Gully surface mounts the
// ONE shared <gc-chain-switcher> (gully-ops sites/_shared/gc-chain-switcher, fed by the Gully Core manifest); the Multisig
// mounts it with surface="multisig" in event mode and keeps routing in the Safe app.
const src = join(__dirname, '..', '..', '..')
const read = (p: string) => readFileSync(join(src, p), 'utf8')

// sha256 of gully-ops sites/_shared/gc-chain-switcher/gc-chain-switcher.js 1.0.3, equal to the live
// https://gullycore.xyz/assets/gc-chain-switcher.js on 2026-11-09. Update both when the canonical file changes.
const CANONICAL_SHA256 = '8fc16fe2383b8a729d8f86bf552d64553ce4ebdeaffb517a887497e50f2ad10f'

describe('the shared chain switcher', () => {
  it('ships as a byte-identical copy of the canonical file', () => {
    const bytes = readFileSync(join(src, '..', 'public', SWITCHER_SRC))
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(CANONICAL_SHA256)
    expect(bytes.toString('utf8')).toContain("GC_CHAIN_SWITCHER_VERSION = '1.0.3'")
  })

  it('is mounted in the header for the multisig surface in event mode, routing stays in the app', () => {
    expect(read('components/common/Header/index.tsx')).toContain('<GullyChainSwitcher')
    expect(read('components/common/Header/index.tsx')).toContain('data-testid="gully-network-selector"')
    const w = read('components/common/GullyChainSwitcher/index.tsx')
    expect(SWITCHER_SURFACE).toBe('multisig')
    expect(w).toContain("mode: 'event'")
    expect(w).toContain("addEventListener('gc-chain-change'")
    expect(w).toContain('getNetworkLink(router, safeAddress, chain, currentSafeApp)')
    expect(w).toContain('Switched to ${chain.chainName}')
    expect(w).toContain("'compact-below': '480'")
  })

  it('asks this chain’s transaction service for health through this host for Gully’s own stacks', () => {
    expect(healthUrl('http://nginx:8000/txs-6714', 'https://gullymultisig.xyz')).toBe(
      'https://gullymultisig.xyz/txs-6714/api/v1/about/',
    )
    expect(healthUrl('http://nginx:8000/txs', 'https://gullymultisig.xyz')).toBe(
      'https://gullymultisig.xyz/txs/api/v1/about/',
    )
    expect(healthUrl('https://api.safe.global/tx-service/base/', 'https://x')).toBe(
      'https://api.safe.global/tx-service/base/api/v1/about/',
    )
    expect(healthUrl(undefined, 'https://x')).toBeUndefined()
  })

  it('the app CSP lets the module run from this host and reach the manifest and RPCs', () => {
    const csp = read('config/securityHeaders.ts')
    expect(csp).toContain("script-src 'self'")
    expect(csp).toContain("connect-src 'self' *")
    expect(csp).toContain('img-src * data:')
  })
})
