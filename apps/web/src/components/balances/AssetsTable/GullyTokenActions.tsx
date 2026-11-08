import { useState, type MouseEvent, type ReactElement } from 'react'
import { IconButton, ListItemIcon, Menu, MenuItem, Tooltip } from '@mui/material'
import BubbleChartOutlinedIcon from '@mui/icons-material/BubbleChartOutlined'
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded'
import { gullyTokenActionsFor, type GullyTokenActionId } from '@/config/gullyIntegrations'
import useChainId from '@/hooks/useChainId'

const ICONS: Record<GullyTokenActionId, ReactElement> = {
  holders: <BubbleChartOutlinedIcon fontSize="small" />,
  score: <ShieldOutlinedIcon fontSize="small" />,
  core: <ShowChartRoundedIcon fontSize="small" />,
}

/** Gully Multisig: read-only Gully views of a token the Safe holds, on the chains that serve them (new tab). */
const GullyTokenActions = ({ tokenAddress }: { tokenAddress: string }): ReactElement | null => {
  const chainId = useChainId()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const actions = gullyTokenActionsFor(chainId, tokenAddress)

  if (!actions.length) return null

  const open = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setAnchor(event.currentTarget)
  }

  return (
    <>
      <Tooltip title="Token details">
        <IconButton
          size="small"
          aria-label="Token details"
          aria-haspopup="menu"
          data-testid="gully-token-actions"
          onClick={open}
          sx={{ minWidth: { xs: 44, sm: 28 }, minHeight: { xs: 44, sm: 28 } }}
        >
          <MoreHorizRoundedIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        {actions.map((action) => (
          <MenuItem
            key={action.id}
            component="a"
            href={action.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => {
              event.stopPropagation()
              setAnchor(null)
            }}
            sx={{ minHeight: 44 }}
          >
            <ListItemIcon>{ICONS[action.id]}</ListItemIcon>
            {action.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

export default GullyTokenActions
