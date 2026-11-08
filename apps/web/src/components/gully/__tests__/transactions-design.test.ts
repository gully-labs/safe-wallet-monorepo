import { readFileSync } from 'fs'
import { join } from 'path'

// Design slice 3: the transaction flow wears the kit (signature buttons, stepper, progress), and the transaction surfaces
// say multisig. Toasts for every lifecycle step already exist (hooks/useTxNotifications) and wear the kit since slice 1.
const src = join(__dirname, '..', '..', '..')
const read = (p: string) => readFileSync(join(src, p), 'utf8')

describe('the transaction flow wears the kit', () => {
  it('signature buttons: pill, shine sweep, pressed scale, focus ring, reduced-motion fallback', () => {
    const css = read('components/tx-flow/common/TxLayout/styles.module.css')
    expect(css).toContain('border-radius: 999px')
    expect(css).toContain('translateX(120%)')
    expect(css).toContain('scale(0.98)')
    expect(css).toContain('focus-visible')
    expect(css).toContain('prefers-reduced-motion')
    expect(css).toContain('.progressBar :global(.MuiLinearProgress-bar)')
  })

  it('the Create / Signed / Execute stepper has kit rings', () => {
    expect(read('components/tx-flow/common/TxStatusWidget/styles.module.css')).toContain('border-radius: 50%')
  })

  it('every lifecycle step has a toast, failures carry the reason', () => {
    const n = read('hooks/useTxNotifications.ts')
    for (const ev of ['PROPOSED', 'SIGNATURE_PROPOSED', 'EXECUTING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REVERTED']) {
      expect(n).toContain(`[TxEvent.${ev}]`)
    }
    expect(n).toContain('detailedMessage: isError ? detail.error.message : undefined')
  })
})

describe('transaction surfaces say multisig', () => {
  it('no "Safe Account" in the batch, single-transaction or nested-transaction copy', () => {
    for (const f of [
      'components/transactions/BatchExecuteButton/index.tsx',
      'components/transactions/SingleTx/index.tsx',
      'components/transactions/TxDetails/TxData/NestedTransaction/ExecTransaction/index.tsx',
    ]) {
      expect({ f, hasSafeAccount: /Safe Account|>Open Safe</.test(read(f)) }).toEqual({ f, hasSafeAccount: false })
    }
  })
})
