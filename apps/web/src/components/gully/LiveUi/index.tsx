import { createElement, useEffect, useRef, type ReactElement, type ReactNode } from 'react'
import css from './styles.module.css'

/**
 * Gully Live UI 1.0.1 in Gully Multisig: the shared live components (gully-ops sites/_shared/gully-live-ui), copied
 * byte-identical into /public/vendor/gully-live-ui and loaded as browser modules, so webpack, lint and prettier never
 * touch them and the sync check can compare the served files with the canonical ones. gl-stat and gl-chart are
 * used on the live cards; gl-stepper and gl-sign-button (gl-actions.js, see Actions.tsx) on the transaction steps.
 * Theme: the Gully Chain kit tokens (light and dark) in styles.module.css, on the .glKit wrapper.
 */
export const LIVE_UI_VERSION = '1.0.1'
export const LIVE_UI_BASE = '/vendor/gully-live-ui'
export const LIVE_UI_FILES = ['gl-core.js', 'gl-stat.js', 'gl-chart.js', 'gl-actions.js'] as const

export const loadModule = (file: string): void => {
  if (typeof document === 'undefined') return
  const src = `${LIVE_UI_BASE}/${file}`
  if (document.querySelector(`script[data-gl="${file}"]`)) return
  const s = document.createElement('script')
  s.type = 'module'
  s.src = src
  s.dataset.gl = file
  document.head.appendChild(s)
}

/** Wrapper that carries the kit tokens for every gl-* element inside it. */
export const GlKit = ({
  children,
  className,
  dark,
}: {
  children: ReactNode
  className?: string
  /** Always the dark rows (cards that are ink on both themes). */
  dark?: boolean
}): ReactElement => (
  <div className={[css.glKit, dark ? css.glKitDark : '', className ?? ''].filter(Boolean).join(' ')}>{children}</div>
)

export const liveCss = css

type StatProps = {
  label: string
  value: number | null
  /** Points for the sparkline, oldest first (two or more draw it). */
  spark?: number[]
  loading?: boolean
  live?: boolean
  full?: boolean
  testId?: string
}

/** <gl-stat>: count-up value, sparkline, skeleton while loading, "No data yet" when there is no number. */
export const GlStat = ({ label, value, spark, loading, live, full, testId }: StatProps): ReactElement => {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => loadModule('gl-stat.js'), [])
  // The sparkline goes in as an attribute: React 19 would assign a string to the upgraded element's `spark` setter
  // (which expects an array), and a property set before the upgrade would shadow the class setter.
  const sparkAttr = spark && spark.length >= 2 ? spark.join(',') : ''
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (sparkAttr) el.setAttribute('spark', sparkAttr)
    else el.removeAttribute('spark')
  }, [sparkAttr])
  return createElement('gl-stat', {
    ref,
    label,
    value: value === null ? '' : String(value),
    loading: loading ? '' : undefined,
    live: live ? '' : undefined,
    full: full ? '' : undefined,
    'data-testid': testId,
  })
}

export type Point = [number, number]

type ChartProps = {
  kind?: 'area' | 'line' | 'bars'
  title?: string
  unit?: string
  height?: number
  series: Point[]
  loading?: boolean
  empty?: string
  testId?: string
}

/** <gl-chart>: canvas chart with draw-in, crosshair tooltip and a table for screen readers; never an empty frame. */
export const GlChart = ({ kind = 'bars', title, unit, height = 160, series, loading, empty, testId }: ChartProps) => {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => loadModule('gl-chart.js'), [])
  useEffect(() => {
    const el = ref.current
    if (!el || typeof customElements === 'undefined') return
    let alive = true
    // .data is a property: set it only once the element is defined (an own property set earlier would shadow it).
    customElements.whenDefined('gl-chart').then(() => {
      if (alive) (el as HTMLElement & { data: unknown }).data = { series, loading: Boolean(loading) }
    })
    return () => {
      alive = false
    }
  }, [series, loading])
  return createElement('gl-chart', {
    ref,
    kind,
    title,
    unit,
    height: String(height),
    empty,
    'data-testid': testId,
  })
}
