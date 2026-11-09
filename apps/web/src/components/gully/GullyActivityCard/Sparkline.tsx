import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import type { DayPoint } from './stats'
import css from './styles.module.css'

/**
 * One series over the last days as a thin line with a soft area, a pulsing end dot and a crosshair tooltip. One hue
 * (the kit emerald): a single series needs no legend, the row's caption names it. The line draws in once; the draw and
 * the pulse stop under prefers-reduced-motion. A table of the same values is there for screen readers.
 */
const W = 320
const H = 56
const PAD = 6

const fmtDate = (t: number) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

const Sparkline = ({ points, label, unit }: { points: DayPoint[]; label: string; unit: string }): ReactElement => {
  const box = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const [drawn, setDrawn] = useState(false)
  useEffect(() => {
    // the draw-in runs once the card is on screen (also once in jsdom, which has no IntersectionObserver)
    const el = box.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setDrawn(true)
      return
    }
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) {
        setDrawn(true)
        io.disconnect()
      }
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const geo = useMemo(() => {
    const n = points.length
    if (n === 0) return null
    const vMax = Math.max(1, ...points.map((p) => p.v))
    const x = (i: number) => PAD + (i / Math.max(1, n - 1)) * (W - 2 * PAD)
    const y = (v: number) => PAD + (1 - v / vMax) * (H - 2 * PAD)
    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')
    const area = `${line} L${x(n - 1).toFixed(1)},${H - PAD} L${x(0).toFixed(1)},${H - PAD} Z`
    return { x, y, line, area, vMax }
  }, [points])

  const total = points.reduce((s, p) => s + p.v, 0)
  const hp = hover !== null ? points[hover] : null

  const onMove = (clientX: number, rect: DOMRect) => {
    if (!geo || points.length === 0) return
    const rel = (clientX - rect.left) / rect.width
    const i = Math.round(Math.min(1, Math.max(0, rel)) * (points.length - 1))
    setHover(i)
  }

  return (
    <div className={css.spark} ref={box}>
      {geo && (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className={`${css.sparkSvg} ${drawn ? css.drawn : ''}`}
          role="img"
          aria-label={`${label}: ${total} ${unit} in the last ${points.length} days`}
          onMouseMove={(e) => onMove(e.clientX, e.currentTarget.getBoundingClientRect())}
          onTouchStart={(e) => onMove(e.touches[0].clientX, e.currentTarget.getBoundingClientRect())}
          onTouchMove={(e) => onMove(e.touches[0].clientX, e.currentTarget.getBoundingClientRect())}
          onMouseLeave={() => setHover(null)}
        >
          <path d={geo.area} className={css.sparkArea} />
          <path d={geo.line} className={css.sparkLine} pathLength={1} />
          {total === 0 && <line x1={PAD} x2={W - PAD} y1={H - PAD} y2={H - PAD} className={css.sparkFlat} />}
          <circle
            cx={geo.x(points.length - 1)}
            cy={geo.y(points[points.length - 1].v)}
            r={3}
            className={css.sparkDot}
          />
          {hp && hover !== null && (
            <g>
              <line x1={geo.x(hover)} x2={geo.x(hover)} y1={PAD} y2={H - PAD} className={css.sparkCross} />
              <circle cx={geo.x(hover)} cy={geo.y(hp.v)} r={4} className={css.sparkDot} />
            </g>
          )}
        </svg>
      )}
      {hp && hover !== null && (
        <div
          className={css.sparkTip}
          role="status"
          style={{ left: `${(hover / Math.max(1, points.length - 1)) * 100}%` }}
        >
          <span>{fmtDate(hp.day)}</span>
          <b>
            {hp.v} {unit}
          </b>
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
          {points.map((p) => (
            <tr key={p.day}>
              <td>{fmtDate(p.day)}</td>
              <td>{p.v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Sparkline
