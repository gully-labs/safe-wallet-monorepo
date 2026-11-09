import { useState, type ReactElement } from 'react'
import Link from 'next/link'
import { IconButton, Menu, MenuItem } from '@mui/material'
import nav from '@/config/gully-nav.json'
import { Icon, type IconName } from '@/components/gully/landing/icons'
import css from './styles.module.css'

/**
 * Gully Multisig navigation: ONE data file (config/gully-nav.json, the app's copy of gully-ops
 * sites/gullymultisig.xyz/nav.json) feeds the landing header and the app header, so the lockup, the link order and the
 * primary button cannot drift apart. In the app "Live" reads "Dashboard".
 */
type AnyLink = (typeof nav.links)[number] & { landingOnly?: boolean; appOnly?: boolean }
/** The app header's links: the landing-only anchors (Features, Chains, Security) would all land on one page here. */
export const APP_LINKS = (nav.links as AnyLink[]).filter((l) => !l.landingOnly)
/** The landing's links (no app-only destinations). */
export const LANDING_LINKS = (nav.links as AnyLink[]).filter((l) => !l.appOnly)
export const NAV_LINKS = APP_LINKS
export const NAV_PRIMARY = nav.primary.app

type NavLink = (typeof nav.links)[number]
const labelOf = (l: NavLink) => ('appLabel' in l && l.appLabel ? l.appLabel : l.label)
const isExternal = (l: NavLink) => 'external' in l && l.external === true

export const GullyNavLinks = ({ className }: { className?: string }): ReactElement => (
  <nav className={`${css.links} ${className ?? ''}`} aria-label="Gully Multisig">
    {APP_LINKS.map((l) =>
      isExternal(l) ? (
        <a key={l.id} href={l.app} target="_blank" rel="noopener noreferrer" className={css.link}>
          <Icon name={l.icon as IconName} size={16} />
          {labelOf(l)}
        </a>
      ) : (
        <Link key={l.id} href={l.app} className={css.link}>
          <Icon name={l.icon as IconName} size={16} />
          {labelOf(l)}
        </Link>
      ),
    )}
  </nav>
)

/** The phone version: one menu button with the same links in the same order, then the primary action. */
export const GullyNavMenu = (): ReactElement => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  return (
    <>
      <IconButton aria-label="Menu" onClick={(e) => setAnchor(e.currentTarget)} size="large" className={css.menuBtn}>
        <Icon name={'menu' as IconName} size={22} />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {APP_LINKS.map((l) => (
          <MenuItem
            key={l.id}
            component="a"
            href={l.app}
            onClick={() => setAnchor(null)}
            {...(isExternal(l) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className={css.menuItem}
          >
            <Icon name={l.icon as IconName} size={18} />
            {labelOf(l)}
          </MenuItem>
        ))}
        <MenuItem component="a" href={nav.primary.app.href} onClick={() => setAnchor(null)} className={css.menuItem}>
          {nav.primary.app.label}
        </MenuItem>
      </Menu>
    </>
  )
}
