import type { ReactElement } from 'react'
import { useRouter } from 'next/router'
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import HubOutlinedIcon from '@mui/icons-material/HubOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import WalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
import {
  SidebarList,
  SidebarListItemButton,
  SidebarListItemIcon,
  SidebarListItemText,
} from '@/components/sidebar/SidebarList'
import { AppRoutes } from '@/config/routes'
import css from '@/components/sidebar/Sidebar/styles.module.css'

const ITEMS: { label: string; icon: ReactElement; href: string }[] = [
  { label: 'My multisigs', icon: <WalletOutlinedIcon />, href: AppRoutes.welcome.accounts },
  { label: 'New multisig', icon: <AddCircleOutlineRoundedIcon />, href: AppRoutes.newSafe.create },
  { label: 'Add existing', icon: <FileDownloadOutlinedIcon />, href: AppRoutes.newSafe.load },
  { label: 'Gully services', icon: <HubOutlinedIcon />, href: AppRoutes.gullyServices },
  { label: 'Settings', icon: <SettingsOutlinedIcon />, href: AppRoutes.settings.appearance },
]

const firstSegment = (path: string) => path.split('/')[1]

/**
 * Gully Multisig: the sidebar of the app pages that have no open Safe (accounts, services, settings). Same list
 * components as the Safe sidebar, which needs a Safe for its header, address and queue.
 */
const GullyAccountSidebar = (): ReactElement => {
  const { pathname } = useRouter()

  return (
    <div data-testid="gully-account-sidebar" className={css.container}>
      <div className={css.scroll}>
        <SidebarList>
          {ITEMS.map(({ label, icon, href }) => {
            const selected =
              href === pathname || (href === AppRoutes.settings.appearance && firstSegment(pathname) === 'settings')
            return (
              <SidebarListItemButton key={href} href={href} selected={selected}>
                <SidebarListItemIcon>{icon}</SidebarListItemIcon>
                <SidebarListItemText data-testid="sidebar-list-item" bold>
                  {label}
                </SidebarListItemText>
              </SidebarListItemButton>
            )
          })}
        </SidebarList>
      </div>
    </div>
  )
}

export default GullyAccountSidebar
