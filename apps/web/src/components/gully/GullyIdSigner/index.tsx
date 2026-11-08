import { useEffect, useState, type ReactElement } from 'react'
import { Alert, Box, Button, Typography } from '@mui/material'
import useWallet from '@/hooks/wallets/useWallet'
import { isGullyWalletLabel } from '@/utils/gully-wallet'
import { pickGullyIdAddress, readGullyIdSession } from './gullyIdWallet'
import { shortenAddress } from '@safe-global/utils/utils/formatters'

export const GULLY_ID_SIGNER_TEXT =
  'Your Gully ID passkey is the signer. No seed phrase and no browser extension: each signature is one passkey tap, and gas is sponsored when the paymaster allows it.'

/**
 * Create-a-Safe helper. With the Gully Wallet connected it explains what the signer is; with a Gully ID signed in
 * (header button) but another wallet connected it offers the Gully ID wallet address as an extra signer.
 */
const GullyIdSigner = ({
  chainId,
  existing,
  onAdd,
}: {
  chainId?: string
  existing: string[]
  onAdd: (address: string) => void
}): ReactElement | null => {
  const wallet = useWallet()
  const [address, setAddress] = useState<string | null>(null)

  useEffect(() => {
    let off = false
    readGullyIdSession().then((s) => {
      if (!off) setAddress(pickGullyIdAddress(s, chainId))
    })
    return () => {
      off = true
    }
  }, [chainId])

  if (isGullyWalletLabel(wallet?.label)) {
    return (
      <Alert severity="info" data-testid="gully-id-signer-note" sx={{ mb: 2 }}>
        {GULLY_ID_SIGNER_TEXT}
      </Alert>
    )
  }

  const listed = address ? existing.some((a) => a.toLowerCase() === address.toLowerCase()) : false
  if (!address || listed) return null
  return (
    <Box
      data-testid="gully-id-signer-offer"
      sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}
    >
      <Typography variant="body2" sx={{ flex: 1, minWidth: 220 }}>
        You are signed in with Gully ID. Add your Gully ID wallet ({shortenAddress(address)}) as a signer: no seed
        phrase needed.
      </Typography>
      <Button variant="outlined" size="small" onClick={() => onAdd(address)} data-testid="gully-id-signer-add">
        Add my Gully ID wallet
      </Button>
    </Box>
  )
}

export default GullyIdSigner
