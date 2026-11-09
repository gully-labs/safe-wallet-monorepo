import { useMemo, type ReactElement } from 'react'
import { Divider, SvgIcon } from '@mui/material'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import TravelExploreOutlinedIcon from '@mui/icons-material/TravelExploreOutlined'
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined'
import { SidebarListItemButton, SidebarListItemIcon, SidebarListItemText } from '@/components/sidebar/SidebarList'
import { addressCopiedMessage, gullyToolsFor, type GullyTool, type GullyToolId } from '@/config/gullyIntegrations'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeAddress from '@/hooks/useSafeAddress'
import BridgeIcon from '@/public/images/common/bridge.svg'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { getBlockExplorerLink } from '@/utils/chains'

const ICONS: Record<GullyToolId, ReactElement> = {
  explorer: <TravelExploreOutlinedIcon />,
  bridge: <SvgIcon component={BridgeIcon} inheritViewBox />,
  faucet: <WaterDropOutlinedIcon />,
}

/**
 * Gully Multisig: the sidebar's links out, each wired to the open Safe and shown only on a chain the product serves
 * (config/gullyIntegrations.ts). Opens in a new tab; a product that cannot take the address from its URL gets it copied.
 */
const GullyChainTools = (): ReactElement | null => {
  const chain = useCurrentChain()
  const safeAddress = useSafeAddress()
  const dispatch = useAppDispatch()

  const tools = useMemo(() => {
    const explorerUrl = chain && safeAddress ? getBlockExplorerLink(chain, safeAddress)?.href : undefined
    return gullyToolsFor({ chainId: chain?.chainId, safeAddress, explorerUrl })
  }, [chain, safeAddress])

  if (!tools.length) return null

  const copyAddress = async (tool: GullyTool) => {
    const groupKey = `gully-tool-${tool.id}`
    try {
      await navigator.clipboard.writeText(safeAddress)
      dispatch(showNotification({ message: addressCopiedMessage(tool.label), variant: 'success', groupKey }))
    } catch {
      dispatch(showNotification({ message: 'Could not copy the multisig address.', variant: 'warning', groupKey }))
    }
  }

  return (
    <div data-testid="gully-chain-tools">
      <Divider sx={{ mt: 0.5, mb: 0.5, borderColor: 'background.main' }} />

      {tools.map((tool) => (
        <SidebarListItemButton
          key={tool.id}
          externalHref={tool.href}
          onClick={tool.copiesAddress ? () => void copyAddress(tool) : undefined}
        >
          <SidebarListItemIcon>{ICONS[tool.id]}</SidebarListItemIcon>
          <SidebarListItemText data-testid="sidebar-list-item" bold>
            {tool.label}
            <OpenInNewRoundedIcon sx={{ fontSize: 14, color: 'text.secondary' }} aria-label="opens in a new tab" />
          </SidebarListItemText>
        </SidebarListItemButton>
      ))}

      <Divider sx={{ mt: 0.5, mb: 0.5, borderColor: 'background.main' }} />
    </div>
  )
}

export default GullyChainTools
