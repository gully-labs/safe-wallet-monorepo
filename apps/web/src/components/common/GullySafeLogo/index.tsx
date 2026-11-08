import type { ReactElement } from 'react'
import { BRAND_NAME } from '@/config/constants'
import css from './styles.module.css'

/**
 * Gully Multisig header logo: the GullyChain brand kit v4 icon (brand-kit-v4/logo/gc-icon.svg, byte for byte) and the
 * "Multisig" product label. Kit v4 ships no wordmark, so the GullyChain name is never typed or redrawn here.
 */
const GullySafeLogo = ({ compact = false }: { compact?: boolean }): ReactElement => (
  <span className={css.lockup} aria-label={BRAND_NAME}>
    <img
      src="/brand/logo/gc-icon.svg"
      width={compact ? 24 : 32}
      height={compact ? 24 : 32}
      alt=""
      className={compact ? css.icon : css.logo}
    />
    <span className={css.label}>{compact ? 'Multisig' : 'Gully Multisig'}</span>
  </span>
)

export default GullySafeLogo
