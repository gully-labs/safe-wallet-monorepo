import { readFileSync } from 'fs'
import { join } from 'path'
import { render, screen } from '@testing-library/react'
import { showGlToast, toastHref } from '../LiveUi/glToast'
import { GlStepper } from '../LiveUi/Actions'

// Design standard, 2026-11-09: Create a multisig / Add an existing one show the shared gl-stepper (was a local list),
// and transaction successes (proposed, signed, executed) show the kit toast instead of the snackbar, never both.
const web = join(__dirname, '..', '..', '..', '..')
const read = (p: string) => readFileSync(join(web, p), 'utf8')

describe('create / add-existing stepper', () => {
  it('CardStepper renders GlStepper over the titled steps; the local path list is gone', () => {
    const src = read('src/components/new-safe/CardStepper/index.tsx')
    expect(src).toContain('<GlStepper')
    expect(src).toContain('steps.filter((s) => s.title)')
    expect(src).not.toContain('css.path')
    expect(read('src/components/new-safe/CardStepper/styles.module.css')).not.toContain('.pathOn')
  })

  it('a comma inside a step title does not split the step', () => {
    render(<GlStepper steps={['Choose address, network and a name', 'Review']} current={1} />)
    const el = screen.getByTestId('gully-tx-stepper')
    expect(el.getAttribute('steps')?.split(',')).toEqual(['Choose address‚ network and a name', 'Review'])
    expect(el.getAttribute('current')).toBe('1')
  })
})

describe('kit toast for tx successes', () => {
  it('toastHref keeps internal paths only', () => {
    expect(toastHref({ pathname: '/transactions/tx', query: { id: 'multisig_0x1', safe: 'anubis:0x2' } })).toBe(
      '/transactions/tx?id=multisig_0x1&safe=anubis%3A0x2',
    )
    expect(toastHref('/home')).toBe('/home')
    expect(toastHref('https://scan.example/tx/0x1')).toBe('')
    expect(toastHref(undefined)).toBe('')
  })

  it('without the module: false, so the snackbar shows', () => {
    expect(showGlToast('Send 1 HYPE: Successfully signed.')).toBe(false)
  })

  it('with the module: the toast shows once, with the link', () => {
    const show = jest.fn()
    class FakeToast extends HTMLElement {
      show = show
    }
    customElements.define('gl-toast', FakeToast)
    expect(showGlToast('Send 1 HYPE: Successfully executed.', { href: { pathname: '/home', query: {} } })).toBe(true)
    expect(show).toHaveBeenCalledWith('Send 1 HYPE: Successfully executed.', { kind: 'good', href: '/home', ms: 6000 })
    expect(document.querySelectorAll('gl-toast')).toHaveLength(1)
  })

  it('useTxNotifications: successes go to the kit toast first, the snackbar only when it did not show', () => {
    const src = read('src/hooks/useTxNotifications.ts')
    expect(src).toContain(
      'if (isSuccess && showGlToast(`${humanDescription}: ${message}`, { href: link?.href })) return',
    )
    expect(src.indexOf('showGlToast(`')).toBeLessThan(src.indexOf('showNotification({'))
    expect(src).toContain('preloadGlToast()')
  })
})
