import type { ReactElement } from 'react'
import { BRAND_NAME } from '@/config/constants'
import css from './styles.module.css'

/** Gully Safe header logo: GullyChain logo (brand kit v3) plus the "Safe" product label. */
const GullySafeLogo = ({ compact = false }: { compact?: boolean }): ReactElement => (
  <span className={css.lockup} aria-label={BRAND_NAME}>
    {compact ? (
      <img src="/brand/logo/gullychain-icon-transparent-512.png" width={24} height={24} alt="" className={css.icon} />
    ) : (
      <img src="/brand/logo/gullychain-logo-transparent.png" width={656} height={152} alt="" className={css.logo} />
    )}
    <span className={css.label}>Safe</span>
  </span>
)

export default GullySafeLogo
