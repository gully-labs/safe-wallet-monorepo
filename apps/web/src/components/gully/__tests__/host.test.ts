import { readFileSync } from 'fs'
import { join } from 'path'

// Gully Multisig's own address is gullymultisig.xyz (owner, 2026-11-08). The host is baked into the static export,
// so these files must name it and must not name the old address (multisig.gullychain.xyz is only a redirect now).
const web = join(__dirname, '..', '..', '..', '..')
const read = (p: string) => readFileSync(join(web, p), 'utf8')
const HOST = 'https://gullymultisig.xyz'
const OLD = 'multisig.gullychain.xyz'

describe('Gully Multisig host', () => {
  it('the build names gullymultisig.xyz everywhere and the old address nowhere', () => {
    const env = read('.env.gully')
    expect(env).toContain(`NEXT_PUBLIC_GATEWAY_URL_PRODUCTION=${HOST}/cgw`)
    expect(env).toContain(`NEXT_PUBLIC_GATEWAY_URL_STAGING=${HOST}/cgw`)

    const meta = read('src/components/common/MetaTags/index.tsx')
    expect(meta).toContain(`SITE_URL = '${HOST}'`)
    expect(meta).toContain(`${HOST}/og-image.png`)
    expect(read('src/pages/cookie.tsx')).toContain(`${HOST}/cookie`)
    expect(read('src/components/gully/landing/GullyLanding.tsx')).toContain(`${HOST}/welcome`)

    for (const f of ['public/sitemap.xml', 'public/robots.txt', '.env.gully']) {
      const t = read(f)
      expect(t).toContain('gullymultisig.xyz')
      expect(t).not.toContain(OLD)
    }
  })
})
