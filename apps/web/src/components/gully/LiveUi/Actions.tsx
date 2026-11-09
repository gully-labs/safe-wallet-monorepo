import { createElement, useEffect, useRef, useState, type ReactElement } from 'react'
import { GlKit, loadModule } from './index'
import css from './styles.module.css'

/**
 * Gully Live UI actions (gl-actions.js) on the transaction steps (design standard: steppers + signature buttons).
 * Both wait for the browser module: until <gl-sign-button> is defined (and wherever it never is, e.g. jsdom in the
 * unit tests) the original control renders, so nothing a test or a wallet relies on disappears.
 */

const useDefined = (tag: string): boolean => {
  const [defined, setDefined] = useState(false)
  useEffect(() => {
    loadModule('gl-actions.js')
    if (typeof customElements === 'undefined') return
    let alive = true
    if (customElements.get(tag)) setDefined(true)
    else customElements.whenDefined(tag).then(() => alive && setDefined(true))
    return () => {
      alive = false
    }
  }, [tag])
  return defined
}

/** Step names for a flow of `count` steps: the last one is always where the owner reviews and signs. */
export const stepLabels = (count: number): string[] =>
  Array.from({ length: count }, (_, i) =>
    i === count - 1 ? 'Review and sign' : count === 2 ? 'Details' : i === 0 ? 'Details' : `Step ${i + 1}`,
  )

/** <gl-stepper>: numbered steps, done ones ticked, the current one marked (aria-current="step"). */
export const GlStepper = ({ steps, current }: { steps: string[]; current: number }): ReactElement => {
  useDefined('gl-stepper')
  return (
    <GlKit className={css.stepper}>
      {createElement('gl-stepper', {
        steps: steps.join(','),
        current: String(current),
        'data-testid': 'gully-tx-stepper',
      })}
    </GlKit>
  )
}

type HoldProps = {
  /** "Sign", "Execute": shown as "Hold to sign" */
  action: string
  disabled?: boolean
  loading?: boolean
  testId?: string
  /** The original button: rendered until the module is ready. */
  fallback: ReactElement
}

/**
 * <gl-sign-button>: hold to sign, with a progress ring; Enter/Space held, or pressed twice, from the keyboard.
 * When the hold completes it submits the form it sits in, the same submit the original button did
 * (SignForm / ExecuteForm handleSubmit); the wallet call and every check stay in those forms.
 */
export const GlHoldToSign = ({ action, disabled, loading, testId, fallback }: HoldProps): ReactElement => {
  const defined = useDefined('gl-sign-button')
  const ref = useRef<HTMLElement & { state: string }>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.state = loading ? 'signing' : 'idle'
  }, [loading, defined])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onSign = () => {
      if (el.hasAttribute('disabled')) return
      el.closest('form')?.requestSubmit()
    }
    el.addEventListener('gl-sign', onSign)
    return () => el.removeEventListener('gl-sign', onSign)
  }, [defined])

  if (!defined) return fallback

  return (
    <GlKit className={css.signKit}>
      {createElement('gl-sign-button', {
        ref,
        label: `Hold to ${action.toLowerCase()}`,
        hold: '900',
        disabled: disabled ? '' : undefined,
        'data-testid': testId,
      })}
    </GlKit>
  )
}
