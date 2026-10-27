import type { ReactElement } from 'react'
import { Typography } from '@mui/material'
import { GULLY_SERVICES } from '@/config/gully'
import css from './styles.module.css'

/** Gully Safe: the other Gully products, as external links (new tab). */
const GullyServices = (): ReactElement => (
  <section className={css.panel}>
    <Typography variant="h2" className={css.title}>
      Gully services
    </Typography>
    <Typography className={css.subtitle}>Everything else on Gully Chain. Links open in a new tab.</Typography>

    <ul className={css.grid}>
      {GULLY_SERVICES.map((service) => (
        <li key={service.href}>
          <a href={service.href} target="_blank" rel="noopener noreferrer" className={css.card}>
            <span className={css.name}>{service.name}</span>
            <span className={css.description}>{service.description}</span>
          </a>
        </li>
      ))}
    </ul>
  </section>
)

export default GullyServices
