import { useEffect, useState, type ReactElement } from 'react'
import css from './mascot.module.css'

/**
 * GullyChain mascot (brand kit v4 art, unmodified kit files): the builder pose bobs while idle and waves on hover/focus,
 * and it switches to the presenter pose with a burst of G coins when `celebrateKey` changes (a new Safe was created on
 * Gully Chain).
 * All motion stops under prefers-reduced-motion.
 */
const COINS = [0, 1, 2, 3, 4, 5, 6, 7]

const Mascot = ({ celebrateKey }: { celebrateKey: number }): ReactElement => {
  const [celebrating, setCelebrating] = useState(false)

  useEffect(() => {
    if (celebrateKey === 0) return
    setCelebrating(true)
    const t = setTimeout(() => setCelebrating(false), 3200)
    return () => clearTimeout(t)
  }, [celebrateKey])

  return (
    <button
      type="button"
      className={`${css.stage} ${celebrating ? css.celebrating : ''}`}
      aria-label={celebrating ? 'A new Safe was just created on Gully Chain' : 'The GullyChain mascot: press to celebrate'}
      onClick={() => setCelebrating(true)}
    >
      <span className={css.glow} aria-hidden />
      <span className={`${css.floatCoin} ${css.fc1}`} aria-hidden>
        G
      </span>
      <span className={`${css.floatCoin} ${css.fc2}`} aria-hidden>
        G
      </span>
      <span className={`${css.floatCoin} ${css.fc3}`} aria-hidden>
        G
      </span>
      <span className={css.bob}>
        <span className={css.wave}>
          <img
            src="/brand/mascots/mascot-builder.png"
            width={630}
            height={502}
            alt=""
            className={`${css.img} ${css.idleImg}`}
          />
          <img
            src="/brand/mascots/mascot-presenter.png"
            width={644}
            height={552}
            alt=""
            className={`${css.img} ${css.partyImg}`}
          />
        </span>
      </span>
      {celebrating && (
        <span className={css.burst} aria-hidden>
          {COINS.map((i) => (
            <span key={i} className={css.coin} style={{ ['--a' as string]: `${i * 45}deg` }}>
              G
            </span>
          ))}
        </span>
      )}
      <span className={css.bubble} aria-hidden>
        {celebrating ? 'New Safe on Gully Chain!' : 'gm, ready to build a Safe?'}
      </span>
    </button>
  )
}

export default Mascot
