import { createHash } from 'crypto'
import { readFileSync } from 'fs'
import { join } from 'path'

// Gully Live UI 1.0.3 (gully-ops main d103c613): gl-stepper stays on one row at every width (at 390 px the connectors
// wrapped onto their own lines in Create a multisig). gl-actions.js is still the 1.0.3 file in 1.0.4 and stays
// byte-identical; the kit version pin (wrapper + gl-core.js) lives in live-ui-104.test.ts.
const web = join(__dirname, '..', '..', '..', '..')
const sha = (p: string) =>
  createHash('sha256')
    .update(readFileSync(join(web, p)))
    .digest('hex')

describe('Gully Live UI 1.0.3 stepper fix', () => {
  it('gl-actions.js is the 1.0.3 file (one-row stepper) and the wrapper loads it', () => {
    expect(sha('public/vendor/gully-live-ui/gl-actions.js')).toBe(
      'f4519c881a4671896ff4223768770c05dbb9b7340d5a81c454c415dc0d9e95d7',
    )
    expect(readFileSync(join(web, 'src/components/gully/LiveUi/index.tsx'), 'utf8')).toContain("'gl-actions.js'")
  })
})
