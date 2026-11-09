import { readFileSync } from 'fs'
import { join } from 'path'

// Wording sweep (Safe -> Gully Multisig), 2026-11-09: the activation fee note in Create a multisig (pay now / pay
// later, counterfactual chains 6714, 8453, 56, 4663) still said "Safe doesn't profit from the fees."
const src = join(__dirname, '..', '..', '..')

describe('activation fee note names Gully Multisig', () => {
  it('PayNowPayLater', () => {
    const f = readFileSync(join(src, 'features/counterfactual/components/PayNowPayLater/index.tsx'), 'utf8')
    expect(f).toContain('Gully Multisig doesn&apos;t profit from the fees.')
    expect(f).not.toContain('>Safe doesn&apos;t profit')
  })
})
