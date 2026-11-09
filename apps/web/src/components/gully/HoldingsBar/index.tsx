import { useMemo, useState, type ReactElement } from 'react'
import { useVisibleBalances } from '@/hooks/useVisibleBalances'
import css from './styles.module.css'

const MAX_SEGMENTS = 5

export type Holding = { label: string; share: number; fiat: number; other?: boolean }

/** Top holdings by fiat value as shares of the total (0..1), the rest folded into "Other". Assets without a fiat value
 * cannot be compared, so they are left out; with no fiat at all the result is empty and nothing is drawn. */
export const holdingShares = (items: { symbol: string; fiat: number }[], max = MAX_SEGMENTS): Holding[] => {
  const priced = items.filter((i) => Number.isFinite(i.fiat) && i.fiat > 0).sort((a, b) => b.fiat - a.fiat)
  const total = priced.reduce((s, i) => s + i.fiat, 0)
  if (total <= 0) return []
  const top: Holding[] = priced.slice(0, max).map((i) => ({ label: i.symbol, fiat: i.fiat, share: i.fiat / total }))
  const rest = priced.slice(max).reduce((s, i) => s + i.fiat, 0)
  if (rest > 0) top.push({ label: 'Other', fiat: rest, share: rest / total, other: true })
  return top
}

const pct = (v: number) => (v >= 0.1 ? `${Math.round(v * 100)}%` : v >= 0.01 ? `${(v * 100).toFixed(1)}%` : '<1%')

/**
 * Gully Multisig assets page: how the value is spread across the holdings, as one proportional bar. One hue for every
 * asset (identity is in the label under each segment, not in a colour), 2 px gaps, rounded ends, grow-in once, hover
 * for the exact share, a table for screen readers. Drawn only when there is a fiat value to compare.
 */
const HoldingsBar = (): ReactElement | null => {
  const { balances, loaded } = useVisibleBalances()
  const [hover, setHover] = useState<number | null>(null)
  const holdings = useMemo(
    () => holdingShares(balances.items.map((i) => ({ symbol: i.tokenInfo.symbol, fiat: Number(i.fiatBalance) }))),
    [balances.items],
  )
  if (!loaded || holdings.length === 0) return null

  return (
    <figure className={css.wrap} data-testid="holdings-bar">
      <figcaption className={css.caption}>Where the value sits</figcaption>
      <div
        className={css.bar}
        role="img"
        aria-label={`Share of value by asset: ${holdings.map((h) => `${h.label} ${pct(h.share)}`).join(', ')}`}
      >
        {holdings.map((h, i) => (
          <span
            key={h.label}
            className={`${css.seg} ${h.other ? css.segOther : ''} ${hover === i ? css.segHot : ''}`}
            style={{ flexGrow: Math.max(h.share, 0.01), animationDelay: `${i * 60}ms` }}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onTouchStart={() => setHover(i)}
          >
            {hover === i && (
              <span className={css.tip} role="status">
                {h.label} · {pct(h.share)}
              </span>
            )}
          </span>
        ))}
      </div>
      <ul className={css.labels}>
        {holdings.map((h, i) => (
          <li key={h.label} className={hover === i ? css.labelHot : undefined}>
            <i className={h.other ? css.dotOther : css.dot} aria-hidden="true" />
            <b>{h.label}</b> {pct(h.share)}
          </li>
        ))}
      </ul>
      <div className={css.srOnly}>
        <table>
          <caption>Share of value by asset</caption>
          <tbody>
            {holdings.map((h) => (
              <tr key={h.label}>
                <td>{h.label}</td>
                <td>{pct(h.share)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}

export default HoldingsBar
