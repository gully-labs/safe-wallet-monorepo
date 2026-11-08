import { readFileSync } from 'fs'
import { join } from 'path'

// Owner, 2026-11-08: the header showed the wallet "gully-test:0xC46E…a07A" connected through the Gully ID wallet and still a
// "Sign in with Gully ID" button. A wallet connected through the Gully ID wallet is a Gully ID account, so the header shows
// an account chip and asks the SDK for a silent session, never the sign-in button. Source check (the behaviour is covered in
// GullySignIn/index.test.tsx) so a merge from upstream cannot bring the button back for that wallet.
const src = join(__dirname, '..', '..', '..')
const read = (p: string) => readFileSync(join(src, p), 'utf8')

describe('Gully ID wallet is a Gully ID session', () => {
  it('the header sign-in component draws a chip for the Gully Wallet and asks for a silent session', () => {
    const c = read('components/common/GullySignIn/index.tsx')
    expect(c).toContain('GULLY_WALLET_LABEL')
    expect(c).toContain('data-testid="gully-id-chip"')
    expect(c).toContain('silentSignIn')
  })
})
