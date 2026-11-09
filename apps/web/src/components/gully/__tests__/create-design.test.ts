import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

// Design slice 4: creating a multisig and adding an existing one. The steppers already exist (CardStepper path);
// they now wear the kit (pill signature buttons, 12 px card) and every word of copy says multisig.
const src = join(__dirname, '..', '..', '..')
const read = (p: string) => readFileSync(join(src, p), 'utf8')

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(n) ? [p] : []
  })

describe('create and add-existing flows', () => {
  it('no file under components/new-safe says Safe Account any more', () => {
    const offenders = walk(join(src, 'components', 'new-safe')).filter((p) =>
      /\bSafe Account/.test(readFileSync(p, 'utf8')),
    )
    expect(offenders.map((p) => p.slice(src.length + 1))).toEqual([])
  })

  it('the primary actions read as multisig actions', () => {
    expect(read('components/new-safe/create/index.tsx')).toContain('Create a multisig')
    expect(read('components/new-safe/load/index.tsx')).toContain('Add an existing multisig')
    expect(read('components/new-safe/create/steps/StatusStep/StatusMessage.tsx')).toContain('Your multisig is ready!')
  })

  it('the stepper wears the kit', () => {
    const css = read('components/new-safe/CardStepper/styles.module.css')
    expect(css).toContain('border-radius: 999px')
    expect(css).toContain('translateX(120%)')
    expect(css).toContain('prefers-reduced-motion')
  })

  it('the review step shows a live network fee and the flow toasts its steps', () => {
    expect(read('components/new-safe/create/steps/ReviewStep/index.tsx')).toContain('<NetworkFee')
    const n = read('features/counterfactual/hooks/usePendingSafeNotifications.ts')
    expect(n).toContain('[SafeCreationEvent.PROCESSING]')
    expect(n).toContain('[SafeCreationEvent.INDEXED]')
    expect(n).toContain('[SafeCreationEvent.FAILED]')
  })
})
