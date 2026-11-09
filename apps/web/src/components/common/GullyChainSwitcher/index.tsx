import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ButtonBase, InputBase, MenuItem, MenuList, Popover } from '@mui/material'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import ExpandMoreIcon from '@mui/icons-material/KeyboardArrowDownRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import useChains, { useCurrentChain } from '@/hooks/useChains'
import useChainId from '@/hooks/useChainId'
import useSafeAddress from '@/hooks/useSafeAddress'
import useWallet from '@/hooks/wallets/useWallet'
import { useSafeApps } from '@/hooks/safe-apps/useSafeApps'
import { getNetworkLink } from '@/components/common/NetworkSelector'
import ChainSwitcher from '@/components/common/ChainSwitcher'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import { AppRoutes } from '@/config/routes'
import { buildRows, filterRows, readLastChain, rememberLastChain, type ChainRow } from './chains'
import { useChainHealth, usePlannedChains } from './useChainHealth'
import css from './styles.module.css'

const SEARCH_FROM = 7
const STATUS_LABEL: Record<ChainRow['status'], string> = {
  live: 'Live',
  offline: 'Offline',
  checking: 'Checking',
  coming: 'Coming',
}

/**
 * Gully Multisig chain switcher (owner, 2026-11-08: "chain switcher needs to have a better ux"). The trigger says which
 * network is active: kit icon, name (icon only under 480 px), a health dot (green when the chain's transaction service
 * answers), chevron. The menu is a light popover without a page dim: the current chain first with a check, Mainnets then
 * Testnets, each row with icon, name, native token and a Live / Offline / Coming chip; Coming rows cannot be picked.
 * Picking a chain changes the app chain and the URL (the same links as before, deep links keep working), toasts
 * "Switched to <chain>", and is remembered per account. If the wallet sits on another network, one inline action
 * switches it (wallet_switchEthereumChain, add-chain fallback with our RPC and explorer, through onboard).
 */
const GullyChainSwitcher = (): ReactElement => {
  const { configs } = useChains()
  const chainId = useChainId()
  const current = useCurrentChain()
  const router = useRouter()
  const safeAddress = useSafeAddress()
  const wallet = useWallet()
  const { currentSafeApp } = useSafeApps()
  const dispatch = useAppDispatch()
  const planned = usePlannedChains()
  const health = useChainHealth(configs)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [query, setQuery] = useState('')
  const restored = useRef(false)

  const rows = useMemo(
    () => buildRows(configs, planned, health, chainId, typeof location === 'undefined' ? undefined : location.host),
    [configs, planned, health, chainId],
  )
  const shown = useMemo(() => filterRows(rows, query), [rows, query])
  const mainnets = shown.filter((r) => !r.isTestnet)
  const testnets = shown.filter((r) => r.isTestnet)
  const open = Boolean(anchor)
  const dot = health[chainId] ?? 'unknown'
  const walletElsewhere = Boolean(wallet && wallet.chainId !== chainId)

  // the last chain this account used comes back on the pages that have no chain in their URL yet
  useEffect(() => {
    if (restored.current || !router.isReady || configs.length === 0) return
    restored.current = true
    const onEntry = router.pathname === AppRoutes.welcome.index || router.pathname === AppRoutes.welcome.accounts
    if (!onEntry || router.query.chain || router.query.safe) return
    const last = readLastChain(typeof window === 'undefined' ? undefined : window.localStorage, wallet?.address)
    const chain = last && configs.find((c) => c.chainId === last)
    if (chain && chain.chainId !== chainId) {
      router.replace({ pathname: router.pathname, query: { ...router.query, chain: chain.shortName } }, undefined, {
        shallow: true,
      })
    }
  }, [router, configs, chainId, wallet?.address])

  const close = () => {
    setAnchor(null)
    setQuery('')
  }

  const onPick = (row: ChainRow) => {
    trackEvent({ ...OVERVIEW_EVENTS.SWITCH_NETWORK, label: row.chainId })
    rememberLastChain(typeof window === 'undefined' ? undefined : window.localStorage, wallet?.address, row.chainId)
    if (!row.current) {
      dispatch(
        showNotification({
          variant: 'info',
          groupKey: 'chain-switch',
          message: `Switched to ${row.chainName}.`,
        }),
      )
    }
    close()
  }

  const Row = ({ row }: { row: ChainRow }) => {
    const inner = (
      <>
        {row.logo ? (
          <img src={row.logo} alt="" width={24} height={24} className={css.rowLogo} />
        ) : (
          <span className={css.rowLogoEmpty} aria-hidden="true" />
        )}
        <span className={css.rowText}>
          <b>{row.chainName}</b>
          <small>{row.nativeSymbol}</small>
        </span>
        <span className={`${css.chip} ${css[`chip_${row.status}`]}`}>{STATUS_LABEL[row.status]}</span>
        {row.current && <CheckRoundedIcon className={css.check} fontSize="small" />}
      </>
    )
    if (!row.selectable || !row.config) {
      return (
        <li className={`${css.row} ${css.rowDisabled}`} role="option" aria-disabled="true" aria-selected={false}>
          <div className={css.rowMain}>{inner}</div>
          {row.note && <span className={css.note}>{row.note}</span>}
        </li>
      )
    }
    return (
      <Link href={getNetworkLink(router, safeAddress, row.config, currentSafeApp)} passHref legacyBehavior>
        <MenuItem
          component="a"
          onClick={() => onPick(row)}
          selected={row.current}
          role="option"
          aria-selected={row.current}
          className={`${css.row} ${row.current ? css.rowCurrent : ''}`}
          data-testid="network-selector-item"
        >
          {inner}
        </MenuItem>
      </Link>
    )
  }

  return (
    <>
      <ButtonBase
        className={css.trigger}
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-label={`Network: ${current?.chainName ?? 'loading'}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        data-testid="gully-chain-trigger"
      >
        {current?.chainLogoUri ? (
          <img src={current.chainLogoUri} alt="" width={24} height={24} className={css.triggerLogo} />
        ) : (
          <span className={css.rowLogoEmpty} aria-hidden="true" />
        )}
        <span className={css.triggerName}>{current?.chainName ?? '…'}</span>
        <i
          className={`${css.dot} ${css[`dot_${dot}`]}`}
          title={
            dot === 'ok'
              ? 'Transaction service answering'
              : dot === 'down'
              ? 'Transaction service not answering'
              : 'Checking'
          }
        />
        <ExpandMoreIcon className={`${css.chevron} ${open ? css.chevronOpen : ''}`} fontSize="small" />
      </ButtonBase>

      <Popover
        open={open}
        anchorEl={anchor}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: -8, horizontal: 'right' }}
        disableScrollLock
        slotProps={{
          root: { slotProps: { backdrop: { sx: { backgroundColor: 'transparent' } } } },
          paper: { className: css.paper },
        }}
      >
        <div className={css.panel} data-testid="gully-chain-menu">
          {rows.length >= SEARCH_FROM && (
            <label className={css.search}>
              <SearchRoundedIcon fontSize="small" />
              <InputBase
                autoFocus
                placeholder="Search chains"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                inputProps={{ 'aria-label': 'Search chains' }}
                fullWidth
              />
            </label>
          )}

          {walletElsewhere && (
            <div className={css.walletRow}>
              <span>Your wallet is on another network.</span>
              <ChainSwitcher primaryCta />
            </div>
          )}

          <MenuList dense disablePadding autoFocusItem={rows.length < SEARCH_FROM} role="listbox" aria-label="Chains">
            {mainnets.length > 0 && (
              <li className={css.group} role="presentation">
                Mainnets
              </li>
            )}
            {mainnets.map((r) => (
              <Row key={r.chainId} row={r} />
            ))}
            {testnets.length > 0 && (
              <li className={css.group} role="presentation">
                Testnets
              </li>
            )}
            {testnets.map((r) => (
              <Row key={r.chainId} row={r} />
            ))}
            {shown.length === 0 && (
              <li className={css.empty} role="presentation">
                No chain matches “{query}”.
              </li>
            )}
          </MenuList>
        </div>
      </Popover>
    </>
  )
}

export default GullyChainSwitcher
