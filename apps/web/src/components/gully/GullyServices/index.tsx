import { useMemo, useState, type ReactElement } from 'react'
import Link from 'next/link'
import { MenuItem, TextField, Typography } from '@mui/material'
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined'
import HubOutlinedIcon from '@mui/icons-material/HubOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded'
import TravelExploreOutlinedIcon from '@mui/icons-material/TravelExploreOutlined'
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined'
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined'
import useChainId from '@/hooks/useChainId'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeAddress from '@/hooks/useSafeAddress'
import useAllSafes from '@/hooks/safes/useAllSafes'
import { useIsHydrated } from '@/hooks/useIsHydrated'
import { AppRoutes } from '@/config/routes'
import { chainLinksFor } from '@/config/gully'
import { GULLY_CORE_ICON, gullyAppsFor, openAppQuery, type GullyAppId } from '@/config/gullyApps'
import css from './styles.module.css'

const ICONS: Record<string, typeof HubOutlinedIcon> = {
  Bridge: SwapHorizRoundedIcon,
  'Anubis bridge': SwapHorizRoundedIcon,
  Kinetiq: SwapHorizRoundedIcon,
  Explorer: TravelExploreOutlinedIcon,
  'Anubis explorer': TravelExploreOutlinedIcon,
  'Elysium explorer': TravelExploreOutlinedIcon,
  'Robinhood explorer': TravelExploreOutlinedIcon,
  Faucet: WaterDropOutlinedIcon,
  Verify: VerifiedOutlinedIcon,
  Docs: MenuBookOutlinedIcon,
  Ecosystem: HubOutlinedIcon,
  Status: MonitorHeartOutlinedIcon,
}

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`

/**
 * Gully Multisig services page (owner 2026-11-10: "bad ux ... why our services not in the multisig app"), for the chain
 * picked in the header:
 *  - "Use from this multisig": the Gully apps that run INSIDE the multisig (Safe Apps, config/gullyApps.ts), one click
 *    opens the app in-app with the open multisig as the account; with no multisig open, pick one of yours on this chain;
 *  - "Around <chain>": the chain's explorer, verify, docs and status (faucet and bridge on the testnet only), new tab.
 * `only` narrows the apps (the header's Swap uses it to ask which multisig swaps).
 */
const GullyServices = ({ only, heading }: { only?: GullyAppId[]; heading?: string }): ReactElement | null => {
  const chainId = useChainId()
  const chain = useCurrentChain()
  const safeAddress = useSafeAddress()
  const links = chainLinksFor(chainId)
  const apps = gullyAppsFor(chainId).filter((a) => !only || only.includes(a.id))
  const allSafes = useAllSafes()
  const mine = useMemo(() => (allSafes ?? []).filter((s) => s.chainId === chainId), [allSafes, chainId])
  const [picked, setPicked] = useState('')
  const actor = safeAddress || picked || (mine.length === 1 ? mine[0].address : '')
  const chainName = chain?.chainName ?? links?.title ?? 'this chain'
  // client-only values (the open multisig, your multisigs, the picked chain): the static prerender draws nothing here
  const hydrated = useIsHydrated()

  if (!hydrated || (!links && !apps.length)) return null

  return (
    <section className={css.panel} data-testid="gully-services" data-chain={chainId}>
      <Typography variant="h2" component="h1" className={css.title}>
        {heading ?? chainName}
      </Typography>
      {links?.subtitle && <Typography className={css.subtitle}>{links.subtitle}</Typography>}

      {apps.length > 0 && (
        <>
          <div className={css.sectionHead}>
            <Typography variant="h3" className={css.sectionTitle}>
              Use from this multisig
            </Typography>
            <Typography className={css.sectionNote}>
              Opens here. The multisig proposes, its owners sign; nothing is sent from a personal wallet.
            </Typography>
          </div>

          {!safeAddress && (
            <div className={css.picker} data-testid="gully-services-picker">
              {mine.length > 0 ? (
                <TextField
                  select
                  size="small"
                  label={`Multisig on ${chainName}`}
                  value={actor}
                  onChange={(e) => setPicked(e.target.value)}
                  className={css.pickerField}
                >
                  {mine.map((s) => (
                    <MenuItem key={s.address} value={s.address}>
                      {s.name ? `${s.name} · ${short(s.address)}` : short(s.address)}
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
                <Typography className={css.sectionNote}>
                  No multisig of yours on {chainName} yet.{' '}
                  <Link href={AppRoutes.newSafe.create} className={css.inline}>
                    Create one
                  </Link>{' '}
                  or{' '}
                  <Link href={AppRoutes.newSafe.load} className={css.inline}>
                    add an existing one
                  </Link>
                  .
                </Typography>
              )}
            </div>
          )}

          <ul className={css.grid} data-testid="gully-apps">
            {apps.map((app) => {
              const body = (
                <>
                  <span className={css.name}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={GULLY_CORE_ICON} alt="" width={28} height={28} className={css.appIcon} />
                    {app.name}
                  </span>
                  <span className={css.description}>{app.line}</span>
                </>
              )
              return (
                <li key={app.id}>
                  {actor && chain ? (
                    <Link
                      href={{ pathname: AppRoutes.apps.open, query: openAppQuery(chain.shortName, actor, app.url) }}
                      className={css.card}
                      data-app={app.id}
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className={`${css.card} ${css.cardOff}`} data-app={app.id} aria-disabled="true">
                      {body}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}

      {links && (
        <>
          <div className={css.sectionHead}>
            <Typography variant="h3" className={css.sectionTitle}>
              Around {chainName}
            </Typography>
          </div>
          <ul className={css.grid} data-testid="gully-around">
            {links.services.map((service) => {
              const Icon = ICONS[service.name] ?? BoltOutlinedIcon
              return (
                <li key={service.href}>
                  <a href={service.href} target="_blank" rel="noopener noreferrer" className={css.card}>
                    <span className={css.name}>
                      <Icon className={css.icon} aria-hidden />
                      {service.name}
                      <OpenInNewRoundedIcon className={css.external} aria-label="opens in a new tab" />
                    </span>
                    <span className={css.description}>{service.description}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}

export default GullyServices
