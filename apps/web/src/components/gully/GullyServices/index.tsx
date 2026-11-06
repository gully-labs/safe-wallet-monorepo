import type { ReactElement } from 'react'
import { Typography } from '@mui/material'
import useChainId from '@/hooks/useChainId'
import { chainLinksFor } from '@/config/gully'
import css from './styles.module.css'

/**
 * Gully Multisig: links for the chain of the open Safe, as external links (new tab). On Gully Chain Testnet the other
 * Gully Chain products (bridge, faucet, explorer, ...); on Anubis Network the chain's own bridge and explorer and the
 * note that gasDAI pays gas only. Nothing on a chain without checked links, so testnet links never show on a mainnet.
 */
const GullyServices = (): ReactElement | null => {
  const chainId = useChainId()
  const links = chainLinksFor(chainId)
  if (!links) return null

  return (
    <section className={css.panel} data-testid="gully-services" data-chain={chainId}>
      <Typography variant="h2" className={css.title}>
        {links.title}
      </Typography>
      <Typography className={css.subtitle}>{links.subtitle}</Typography>

      <ul className={css.grid}>
        {links.services.map((service) => (
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
}

export default GullyServices
