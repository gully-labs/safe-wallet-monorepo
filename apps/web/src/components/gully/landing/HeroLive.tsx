import { useEffect, useState, type ReactElement } from 'react'
import css from './styles.module.css'

/**
 * The welcome hero's live card (it replaces the old mascot and its "gm" bubble): the kit mark and the numbers the product
 * landing shows, read from the same file (/landing/stats.json, written every 5 minutes from each chain's own Safe
 * transaction service). Nothing is made up: while the file loads or if it cannot, the numbers read an en dash.
 */
type ChainStat = { id: number; name: string; safes: number; txs: number }
const LOGO = (id: number) => `/cfg/media/chains/${id}/chain_logo.png`

const HeroLive = (): ReactElement => {
  const [chains, setChains] = useState<ChainStat[] | null>(null)

  useEffect(() => {
    let alive = true
    fetch('/landing/stats.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { chains: ChainStat[] }) => alive && setChains(d.chains))
      .catch(() => alive && setChains(null))
    return () => {
      alive = false
    }
  }, [])

  const rows: { id: number; name: string; kind: string }[] = [
    { id: 6714, name: 'Anubis Network', kind: 'mainnet' },
    { id: 485590, name: 'Gully Chain Testnet', kind: 'test funds' },
  ]

  return (
    <aside className={css.heroLive} aria-label="Live numbers from the chains" data-testid="hero-live">
      <div className={css.heroLiveHead}>
        <img src="/brand/logo/gc-icon.svg" width={32} height={32} alt="" />
        <span>On-chain now</span>
      </div>
      {rows.map((r) => {
        const c = chains?.find((x) => Number(x.id) === r.id)
        return (
          <div key={r.id} className={css.heroLiveRow}>
            <img src={LOGO(r.id)} width={28} height={28} alt="" />
            <span className={css.heroLiveName}>
              <b>{r.name}</b>
              <small>{r.kind}</small>
            </span>
            <span className={css.heroLiveNum}>
              <b>{c ? c.safes : '–'}</b>
              <small>Safes</small>
            </span>
            <span className={css.heroLiveNum}>
              <b>{c ? c.txs : '–'}</b>
              <small>transactions</small>
            </span>
          </div>
        )
      })}
    </aside>
  )
}

export default HeroLive
