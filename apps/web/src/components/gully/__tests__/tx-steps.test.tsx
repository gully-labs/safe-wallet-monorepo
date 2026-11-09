import { readFileSync } from 'fs'
import { join } from 'path'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import SplitMenuButton from '@/components/common/SplitMenuButton'
import { stepLabels } from '../LiveUi/Actions'

// Design standard (owner, 2026-11-08/09 design-gap gate): transaction steps use the shared Gully Live UI stepper and
// signature button. TxLayout shows <gl-stepper> for multi-step flows; Sign and Execute are hold-to-sign
// (<gl-sign-button>) that submit the same form the old button did. Until the browser module defines the element
// (never in jsdom) the original button renders.
const web = join(__dirname, '..', '..', '..', '..')
const read = (p: string) => readFileSync(join(web, p), 'utf8')

describe('tx steps: gl-stepper', () => {
  it('step names end with Review and sign', () => {
    expect(stepLabels(2)).toEqual(['Details', 'Review and sign'])
    expect(stepLabels(3)).toEqual(['Details', 'Step 2', 'Review and sign'])
    expect(stepLabels(1)).toEqual(['Review and sign'])
  })

  it('TxLayout renders gl-stepper for multi-step flows, the progress bar for one step', () => {
    const src = read('src/components/tx-flow/common/TxLayout/index.tsx')
    expect(src).toContain('<GlStepper')
    expect(src).toContain('steps.length > 1 ?')
    expect(src).toContain('current={step}')
  })

  it('Sign and Execute ask for hold-to-sign, Add to batch does not', () => {
    expect(read('src/components/tx-flow/actions/Sign/SignForm.tsx')).toMatch(/<SplitMenuButton\s+holdToSign/)
    expect(read('src/components/tx-flow/actions/Execute/ExecuteForm.tsx')).toMatch(/<SplitMenuButton\s+holdToSign/)
    expect(read('src/components/tx-flow/actions/Batching/index.tsx')).not.toContain('holdToSign')
  })

  it('gl-actions.js is one of the loaded Live UI files', () => {
    expect(read('src/components/gully/LiveUi/index.tsx')).toContain("'gl-actions.js'] as const")
  })
})

describe('tx steps: hold-to-sign', () => {
  const options = [{ id: 'sign', label: 'Sign' }]

  it('without the module the original submit button renders and submits', () => {
    const onSubmit = jest.fn((e) => e.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <SplitMenuButton holdToSign options={options} />
      </form>,
    )
    const btn = screen.getByTestId('combo-submit-sign')
    expect(btn.tagName).toBe('BUTTON')
    fireEvent.click(btn)
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('with the module: gl-sign-button, the completed hold submits the form, loading shows signing', async () => {
    class FakeSign extends HTMLElement {
      state = 'idle'
    }
    if (!customElements.get('gl-sign-button')) customElements.define('gl-sign-button', FakeSign)
    const onSubmit = jest.fn((e) => e.preventDefault())
    const { rerender } = render(
      <form onSubmit={onSubmit}>
        <SplitMenuButton holdToSign options={options} />
      </form>,
    )
    const el = await waitFor(() => {
      const e = screen.getByTestId('combo-submit-sign')
      expect(e.tagName).toBe('GL-SIGN-BUTTON')
      return e as HTMLElement & { state: string }
    })
    expect(el.getAttribute('label')).toBe('Hold to sign')
    act(() => {
      el.dispatchEvent(new CustomEvent('gl-sign', { bubbles: true }))
    })
    expect(onSubmit).toHaveBeenCalledTimes(1)

    rerender(
      <form onSubmit={onSubmit}>
        <SplitMenuButton holdToSign loading options={options} />
      </form>,
    )
    expect((screen.getByTestId('combo-submit-sign') as HTMLElement & { state: string }).state).toBe('signing')

    rerender(
      <form onSubmit={onSubmit}>
        <SplitMenuButton holdToSign disabled options={options} />
      </form>,
    )
    const off = screen.getByTestId('combo-submit-sign')
    expect(off.hasAttribute('disabled')).toBe(true)
    act(() => {
      off.dispatchEvent(new CustomEvent('gl-sign', { bubbles: true }))
    })
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
