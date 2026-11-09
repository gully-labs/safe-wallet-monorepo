import { createHash } from 'crypto'
import { readFileSync } from 'fs'
import { join } from 'path'

// Gully Live UI 1.0.3 (gully-ops main d103c613): gl-stepper stays on one row at every width (at 390 px the connectors
// wrapped onto their own lines in Create a multisig). The copies stay byte-identical and the wrapper says 1.0.3.
const web = join(__dirname, '..', '..', '..', '..')
const sha = (p: string) =>
  createHash('sha256')
    .update(readFileSync(join(web, p)))
    .digest('hex')

describe('Gully Live UI 1.0.3', () => {
  it('gl-actions.js and gl-core.js are the 1.0.3 files', () => {
    expect(sha('public/vendor/gully-live-ui/gl-actions.js')).toBe(
      'f4519c881a4671896ff4223768770c05dbb9b7340d5a81c454c415dc0d9e95d7',
    )
    expect(sha('public/vendor/gully-live-ui/gl-core.js')).toBe(
      '98743e360fb20313afcd43dd26bb82064b9c4d1430e4fb48aebf0022cc1e2f1a',
    )
    expect(readFileSync(join(web, 'public/vendor/gully-live-ui/gl-core.js'), 'utf8')).toContain(
      "GULLY_LIVE_UI_VERSION = '1.0.3'",
    )
  })

  it('the wrapper names the version it loads', () => {
    expect(readFileSync(join(web, 'src/components/gully/LiveUi/index.tsx'), 'utf8')).toContain(
      "LIVE_UI_VERSION = '1.0.3'",
    )
  })
})
