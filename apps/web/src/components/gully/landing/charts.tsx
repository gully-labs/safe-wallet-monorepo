import { useEffect, useMemo, useRef, useState, type ReactElement, type RefObject } from 'react'
import css from './charts.module.css'

/** Gully Safe landing charts: plain SVG, single series each (so no legend: the title names it), crosshair/hover
 * tooltips, a table view for screen readers, and draw-in animations that stop under prefers-reduced-motion. */

const useWidth = <T extends HTMLElement>(): [RefObject<T | null>, number] => {
  const ref = useRef<T>(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setW(Math.floor(el.getBoundingClientRect().width))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

const niceMax = (v: number) => {
  if (v <= 4) return 4
  const p = Math.pow(10, Math.floor(Math.log10(v)))
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p
  return 10 * p
}

const compact = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, '')}K` : String(Math.round(n))

const fmtDate = (t: number, withTime = false) =>
  new Date(t).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })

const H = 200
const PAD = { top: 16, right: 16, bottom: 28, left: 36 }

export type CumulativePoint = { t: number; v: number }

/** Cumulative count over time as a step area (one series). */
export const CumulativeChart = ({ points, label }: { points: CumulativePoint[]; label: string }): ReactElement => {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)

  const geo = useMemo(() => {
    if (width === 0 || points.length === 0) return null
    const now = Date.now()
    const t0 = points[0].t
    const span = Math.max(now - t0, 60 * 60 * 1000)
    const tMin = t0 - span * 0.04
    const tMax = now
    const vMax = niceMax(points[points.length - 1].v)
    const iw = width - PAD.left - PAD.right
    const ih = H - PAD.top - PAD.bottom
    const x = (t: number) => PAD.left + ((t - tMin) / (tMax - tMin)) * iw
    const y = (v: number) => PAD.top + ih - (v / vMax) * ih
    // step path: flat, then vertical jump at each creation, flat to now
    let d = `M${x(tMin)},${y(0)}`
    for (const p of points) d += ` H${x(p.t)} V${y(p.v)}`
    d += ` H${x(tMax)}`
    const area = `${d} V${y(0)} H${x(tMin)} Z`
    const ticks = [0, vMax / 2, vMax]
    const xTicks = [tMin + (tMax - tMin) * 0.02, tMin + (tMax - tMin) / 2, tMax]
    return { x, y, d, area, ticks, xTicks, vMax }
  }, [points, width])

  const onMove = (clientX: number, rect: DOMRect) => {
    if (!geo) return
    const px = clientX - rect.left
    let best = 0
    let bestD = Infinity
    points.forEach((p, i) => {
      const dd = Math.abs(geo.x(p.t) - px)
      if (dd < bestD) {
        bestD = dd
        best = i
      }
    })
    setHover(best)
  }

  const hp = hover !== null ? points[hover] : null

  return (
    <div className={css.chartWrap} ref={ref}>
      {geo && (
        <svg
          width={width}
          height={H}
          className={css.svg}
          role="img"
          aria-label={`${label}: ${points[points.length - 1].v} as of now`}
          onMouseMove={(e) => onMove(e.clientX, e.currentTarget.getBoundingClientRect())}
          onTouchStart={(e) => onMove(e.touches[0].clientX, e.currentTarget.getBoundingClientRect())}
          onTouchMove={(e) => onMove(e.touches[0].clientX, e.currentTarget.getBoundingClientRect())}
          onMouseLeave={() => setHover(null)}
        >
          {geo.ticks.map((v) => (
            <g key={v}>
              <line x1={PAD.left} x2={width - PAD.right} y1={geo.y(v)} y2={geo.y(v)} className={css.grid} />
              <text x={PAD.left - 8} y={geo.y(v) + 4} className={css.axis} textAnchor="end">
                {compact(v)}
              </text>
            </g>
          ))}
          {geo.xTicks.map((t, i) => (
            <text
              key={i}
              x={geo.x(t)}
              y={H - 8}
              className={css.axis}
              textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}
            >
              {i === 2 ? 'now' : fmtDate(t)}
            </text>
          ))}
          <path d={geo.area} className={css.area} />
          <path d={geo.d} className={css.line} pathLength={1} />
          {/* end dot + direct label for the latest value */}
          <circle
            cx={geo.x(Date.now())}
            cy={geo.y(points[points.length - 1].v)}
            r={4}
            className={`${css.dot} ${css.pulse}`}
          />
          {hp && (
            <g>
              <line x1={geo.x(hp.t)} x2={geo.x(hp.t)} y1={PAD.top} y2={H - PAD.bottom} className={css.crosshair} />
              <circle cx={geo.x(hp.t)} cy={geo.y(hp.v)} r={5} className={css.dot} />
            </g>
          )}
        </svg>
      )}
      {hp && geo && (
        <div
          className={css.tooltip}
          style={{ left: Math.min(Math.max(geo.x(hp.t), 70), width - 70), top: Math.max(geo.y(hp.v) - 56, 0) }}
          role="status"
        >
          <span className={css.ttLabel}>{fmtDate(hp.t, true)}</span>
          <span className={css.ttValue}>
            {hp.v} {hp.v === 1 ? 'Safe' : 'Safes'}
          </span>
        </div>
      )}
      <table className={css.srOnly}>
        <caption>{label}</caption>
        <thead>
          <tr>
            <th>Time</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p, i) => (
            <tr key={i}>
              <td>{fmtDate(p.t, true)}</td>
              <td>{p.v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export type DailyBar = { day: number; v: number }

/** Count per day as columns (one series), zero-filled. */
export const DailyColumns = ({ bars, label, unit }: { bars: DailyBar[]; label: string; unit: string }): ReactElement => {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)

  const geo = useMemo(() => {
    if (width === 0 || bars.length === 0) return null
    const vMax = niceMax(Math.max(...bars.map((b) => b.v)))
    const iw = width - PAD.left - PAD.right
    const ih = H - PAD.top - PAD.bottom
    const band = iw / bars.length
    const bw = Math.min(24, Math.max(4, band - 2))
    const x = (i: number) => PAD.left + i * band + (band - bw) / 2
    const y = (v: number) => PAD.top + ih - (v / vMax) * ih
    return { x, y, bw, band, vMax, base: PAD.top + ih, ticks: [0, vMax / 2, vMax] }
  }, [bars, width])

  const hb = hover !== null ? bars[hover] : null
  // rounded data-end, square at the baseline
  const barPath = (x: number, y: number, w: number, base: number) => {
    const h = base - y
    if (h <= 0) return ''
    const r = Math.min(4, w / 2, h)
    return `M${x},${base} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${base} Z`
  }

  return (
    <div className={css.chartWrap} ref={ref}>
      {geo && (
        <svg width={width} height={H} className={css.svg} role="img" aria-label={label} onMouseLeave={() => setHover(null)}>
          {geo.ticks.map((v) => (
            <g key={v}>
              <line x1={PAD.left} x2={width - PAD.right} y1={geo.y(v)} y2={geo.y(v)} className={css.grid} />
              <text x={PAD.left - 8} y={geo.y(v) + 4} className={css.axis} textAnchor="end">
                {compact(v)}
              </text>
            </g>
          ))}
          {bars.map((b, i) => (
            <g key={b.day}>
              <path
                d={barPath(geo.x(i), geo.y(b.v), geo.bw, geo.base)}
                className={css.bar}
                style={{ animationDelay: `${i * 30}ms` }}
              />
              {/* hit target: the whole band */}
              <rect
                x={PAD.left + i * geo.band}
                y={PAD.top}
                width={geo.band}
                height={geo.base - PAD.top}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onTouchStart={() => setHover(i)}
              />
            </g>
          ))}
          {[0, bars.length - 1].map((i) => (
            <text
              key={i}
              x={geo.x(i) + geo.bw / 2}
              y={H - 8}
              className={css.axis}
              textAnchor={i === 0 ? 'start' : 'end'}
            >
              {i === bars.length - 1 ? 'today' : fmtDate(bars[i].day)}
            </text>
          ))}
        </svg>
      )}
      {hb && geo && hover !== null && (
        <div
          className={css.tooltip}
          style={{
            left: Math.min(Math.max(geo.x(hover) + geo.bw / 2, 70), width - 70),
            top: Math.max(geo.y(hb.v) - 56, 0),
          }}
          role="status"
        >
          <span className={css.ttLabel}>{fmtDate(hb.day)}</span>
          <span className={css.ttValue}>
            {hb.v} {unit}
          </span>
        </div>
      )}
      <table className={css.srOnly}>
        <caption>{label}</caption>
        <thead>
          <tr>
            <th>Day</th>
            <th>{unit}</th>
          </tr>
        </thead>
        <tbody>
          {bars.map((b) => (
            <tr key={b.day}>
              <td>{fmtDate(b.day)}</td>
              <td>{b.v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Number that counts up to its value when it changes (instant under prefers-reduced-motion). */
export const CountUp = ({ value, format = (n) => String(Math.round(n)) }: { value: number; format?: (n: number) => string }) => {
  const [shown, setShown] = useState(0)
  const from = useRef(0)
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setShown(value)
      from.current = value
      return
    }
    const start = performance.now()
    const a = from.current
    let raf = 0
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / 900)
      const e = 1 - Math.pow(1 - k, 3)
      setShown(a + (value - a) * e)
      if (k < 1) raf = requestAnimationFrame(step)
      else from.current = value
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <>{format(shown)}</>
}
