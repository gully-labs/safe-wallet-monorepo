import type { ReactElement } from 'react'
import { Typography } from '@mui/material'
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined'
import CodeRoundedIcon from '@mui/icons-material/CodeRounded'
import HubOutlinedIcon from '@mui/icons-material/HubOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined'
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined'
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded'
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded'
import TravelExploreOutlinedIcon from '@mui/icons-material/TravelExploreOutlined'
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined'
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined'
import useChainId from '@/hooks/useChainId'
import { chainLinksFor } from '@/config/gully'
import css from './styles.module.css'

const ICONS: Record<string, typeof HubOutlinedIcon> = {
  Bridge: SwapHorizRoundedIcon,
  'Anubis bridge': SwapHorizRoundedIcon,
  Explorer: TravelExploreOutlinedIcon,
  'Anubis explorer': TravelExploreOutlinedIcon,
  Faucet: WaterDropOutlinedIcon,
  'Gully Core': ShowChartRoundedIcon,
  Verify: VerifiedOutlinedIcon,
  Sentry: SecurityOutlinedIcon,
  Docs: MenuBookOutlinedIcon,
  Developers: CodeRoundedIcon,
  Ecosystem: HubOutlinedIcon,
  Status: MonitorHeartOutlinedIcon,
}

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
      <Typography variant="h2" component="h1" className={css.title}>
        {links.title}
      </Typography>
      <Typography className={css.subtitle}>{links.subtitle}</Typography>

      <ul className={css.grid}>
        {links.services.map((service) => {
          const Icon = ICONS[service.name] ?? BoltOutlinedIcon
          return (
            <li key={service.href}>
              <a href={service.href} target="_blank" rel="noopener noreferrer" className={css.card}>
                <span className={css.name}>
                  <Icon className={css.icon} aria-hidden />
                  {service.name}
                </span>
                <span className={css.description}>{service.description}</span>
              </a>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default GullyServices
