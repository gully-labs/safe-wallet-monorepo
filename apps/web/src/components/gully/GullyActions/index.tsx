import { useContext, useState, type ReactElement, type ReactNode } from 'react'
import { Alert, Box, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import useChainId from '@/hooks/useChainId'
import CheckWallet from '@/components/common/CheckWallet'
import { TxModalContext } from '@/components/tx-flow'
import { GullyActionFlow } from '@/components/tx-flow/flows'
import {
  buildCancelBuilderFee,
  buildPause,
  buildPayout,
  buildSetBuilderFee,
  buildSetLaunchFee,
  buildSetListing,
  gullyChainRecord,
  parsePayoutLines,
  type Built,
  type ListingStatus,
} from '@/services/gully-actions'

const Card = ({ title, text, children }: { title: string; text: string; children: ReactNode }): ReactElement => (
  <Paper sx={{ p: 3 }} variant="outlined" data-testid={`gully-action-${title.toLowerCase().replace(/\W+/g, '-')}`}>
    <Typography variant="h5" sx={{ fontWeight: 700 }}>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
      {text}
    </Typography>
    <Stack spacing={2}>{children}</Stack>
  </Paper>
)

/**
 * The Gully panel: Gully Core console operations, Gully Pay payouts and a pause switch as Safe transactions. Every
 * button builds the calls, shows them decoded in the normal Safe review, and the transaction then waits in the queue
 * for the other signers. Nothing is sent from this page.
 */
const GullyActions = (): ReactElement => {
  const chainId = useChainId()
  const { setTxFlow } = useContext(TxModalContext)
  const record = gullyChainRecord(chainId)

  const [error, setError] = useState<string>()
  const [fee, setFee] = useState('0.30')
  const [hook, setHook] = useState('')
  const [status, setStatus] = useState<ListingStatus>('deprecated')
  const [reason, setReason] = useState('')
  const [launchFee, setLaunchFee] = useState('')
  const [pauseTarget, setPauseTarget] = useState('')
  const [token, setToken] = useState(record?.payToken?.address ?? '')
  const [symbol, setSymbol] = useState(record?.payToken?.symbol ?? '')
  const [decimals, setDecimals] = useState(String(record?.payToken?.decimals ?? 18))
  const [payouts, setPayouts] = useState('')

  const open = (title: string, built: Built) => {
    if (!built.ok) return setError(built.error)
    setError(undefined)
    setTxFlow(<GullyActionFlow title={title} summary={built.summary} calls={built.calls} />, undefined, false)
  }

  const propose = (label: string, onClick: () => void): ReactElement => (
    <CheckWallet>
      {(isOk) => (
        <Button variant="contained" size="small" disabled={!isOk} onClick={onClick} sx={{ alignSelf: 'flex-start' }}>
          {label}
        </Button>
      )}
    </CheckWallet>
  )

  if (!record) {
    return (
      <Alert severity="info" data-testid="gully-actions-unsupported">
        The Gully panel has no Gully Core or Gully Pay records for this network yet. Switch to Gully Chain Testnet or
        Anubis Network.
      </Alert>
    )
  }

  return (
    <Box data-testid="gully-actions" data-chain={chainId}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {record.name}. Each button opens a normal Safe transaction with a preview. Nothing is sent from this page: the
        transaction waits in the queue until the signers confirm it.
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} data-testid="gully-actions-error">
          {error}
        </Alert>
      )}
      <Stack spacing={3}>
        <Card
          title="Gully Core fees"
          text="The builder fee on new pools. A lower fee applies at once. A higher fee only takes effect 7 days after it is scheduled. The Core cap is 0.40%."
        >
          <TextField label="Builder fee (%)" value={fee} onChange={(e) => setFee(e.target.value)} size="small" />
          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {propose('Set builder fee', () => open('Set Gully Core builder fee', buildSetBuilderFee(chainId, fee)))}
            {propose('Cancel scheduled increase', () =>
              open('Cancel builder fee increase', buildCancelBuilderFee(chainId)),
            )}
          </Stack>
          <TextField
            label="Launch fee (in the chain's coin)"
            value={launchFee}
            onChange={(e) => setLaunchFee(e.target.value)}
            size="small"
          />
          {propose('Set launch fee', () => open('Set Gully Core launch fee', buildSetLaunchFee(chainId, launchFee)))}
        </Card>

        <Card
          title="Gully Core curation"
          text="Mark a hook Active, Deprecated or Malicious in the Gully Core registry. The reason is public on chain."
        >
          <TextField label="Hook address" value={hook} onChange={(e) => setHook(e.target.value)} size="small" />
          <TextField
            select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ListingStatus)}
            size="small"
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="deprecated">Deprecated</MenuItem>
            <MenuItem value="malicious">Malicious</MenuItem>
          </TextField>
          <TextField label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} size="small" />
          {propose('Propose listing change', () =>
            open('Change hook listing', buildSetListing(chainId, hook, status, reason)),
          )}
        </Card>

        <Card
          title="Pause a contract"
          text="Calls pause() or unpause() on a Gully contract the Safe owns. Check the address: the call fails on a contract without a pause switch."
        >
          <TextField
            label="Contract address"
            value={pauseTarget}
            onChange={(e) => setPauseTarget(e.target.value)}
            size="small"
          />
          <Stack direction="row" spacing={2}>
            {propose('Pause', () => open('Pause contract', buildPause(pauseTarget, true)))}
            {propose('Unpause', () => open('Unpause contract', buildPause(pauseTarget, false)))}
          </Stack>
        </Card>

        <Card
          title="Gully Pay payouts"
          text="Pay several people in one transaction: one address and one amount per line. The Safe needs the balance."
        >
          <TextField label="Token address" value={token} onChange={(e) => setToken(e.target.value)} size="small" />
          <Stack direction="row" spacing={2}>
            <TextField label="Symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)} size="small" />
            <TextField label="Decimals" value={decimals} onChange={(e) => setDecimals(e.target.value)} size="small" />
          </Stack>
          <TextField
            label="Payouts (address amount)"
            value={payouts}
            onChange={(e) => setPayouts(e.target.value)}
            multiline
            minRows={4}
            size="small"
            placeholder={'0x… 500\n0x… 12.5'}
          />
          {propose('Propose payouts', () => {
            const d = Number(decimals)
            if (!Number.isInteger(d) || d < 0 || d > 36)
              return setError('Decimals must be a whole number from 0 to 36.')
            open('Gully Pay payouts', buildPayout(token, d, symbol || 'tokens', parsePayoutLines(payouts)))
          })}
        </Card>

        <Card
          title="Token launches"
          text="Launching a token takes a launch configuration this panel does not build yet. Launch from the Gully Core app and use this multisig as the owner."
        >
          <Button
            component="a"
            href="https://app.gullycore.xyz"
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
            size="small"
            sx={{ alignSelf: 'flex-start' }}
          >
            Open Gully Core
          </Button>
        </Card>
      </Stack>
    </Box>
  )
}

export default GullyActions
