import { useEffect, useMemo, useState, type ReactElement } from 'react'
import { Alert, Box, Typography } from '@mui/material'
import { Contract } from 'ethers'
import useBalances from '@/hooks/useBalances'
import useAddressBook from '@/hooks/useAddressBook'
import { useCurrentChain } from '@/hooks/useChains'
import { getWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import { describeCall, type DecodeContext, type Described, type TokenMeta } from '@/services/gully-decode'

const ERC20_META = ['function symbol() view returns (string)', 'function decimals() view returns (uint8)']

/** Symbol and decimals read from the token contract. Resolves undefined when it is not an ERC-20 or the RPC fails. */
export const readTokenMeta = async (address: string): Promise<TokenMeta | undefined> => {
  try {
    const provider = getWeb3ReadOnly()
    if (!provider) return undefined
    const c = new Contract(address, ERC20_META, provider)
    const [symbol, decimals] = await Promise.all([c.symbol(), c.decimals()])
    if (typeof symbol !== 'string' || !symbol) return undefined
    return { symbol, decimals: Number(decimals) }
  } catch {
    return undefined
  }
}

const lower = (a: string) => a.toLowerCase()

/**
 * The plain-language sentence for a call, decoded locally. Token symbols come from the Safe's balances, then from the
 * token contract itself; names come from the address book. Returns null while nothing is known about the selector.
 */
export const useGullyDecoded = (call: {
  to?: string
  data?: string | null
  value?: string | null
}): Described | null => {
  const { balances } = useBalances()
  const addressBook = useAddressBook()
  const chain = useCurrentChain()
  const [looked, setLooked] = useState<Record<string, TokenMeta>>({})

  const ctx = useMemo<DecodeContext>(() => {
    const fromBalances = new Map<string, TokenMeta>()
    for (const item of balances.items ?? []) {
      const t = item.tokenInfo
      if (t?.address && t.symbol && typeof t.decimals === 'number') {
        fromBalances.set(lower(t.address), { symbol: t.symbol, decimals: t.decimals })
      }
    }
    return {
      token: (a) => fromBalances.get(lower(a)) ?? looked[lower(a)],
      name: (a) => addressBook[a] || Object.entries(addressBook).find(([k]) => lower(k) === lower(a))?.[1],
      native: chain?.nativeCurrency
        ? { symbol: chain.nativeCurrency.symbol, decimals: chain.nativeCurrency.decimals }
        : undefined,
    }
  }, [balances.items, addressBook, chain, looked])

  const described = useMemo(
    () => (call.to && call.data ? describeCall({ to: call.to, data: call.data, value: call.value }, ctx) : null),
    [call.to, call.data, call.value, ctx],
  )

  const missing = described?.needsToken.join(',') ?? ''
  useEffect(() => {
    if (!missing) return
    let off = false
    const todo = missing.split(',').filter((a) => !looked[lower(a)])
    if (todo.length === 0) return
    Promise.all(todo.map(async (a) => [lower(a), await readTokenMeta(a)] as const)).then((rows) => {
      if (off) return
      const found = rows.filter((r): r is readonly [string, TokenMeta] => !!r[1])
      if (found.length) setLooked((prev) => ({ ...prev, ...Object.fromEntries(found) }))
    })
    return () => {
      off = true
    }
  }, [missing, looked])

  return described
}

export const GullyDecodedView = ({ described }: { described: Described }): ReactElement => (
  <Box data-testid="gully-decoded" sx={{ mb: 1 }}>
    <Alert severity={described.level === 'careful' ? 'warning' : 'info'} icon={false}>
      <Typography variant="body2" sx={{ fontWeight: 700 }} data-testid="gully-decoded-title">
        {described.title}
      </Typography>
      {described.lines.map((l) => (
        <Typography key={l} variant="caption" component="div" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
          {l}
        </Typography>
      ))}
      <Typography variant="caption" component="div" color="text.secondary" sx={{ mt: 0.5 }}>
        Read from the call data by this app. The raw data is below.
      </Typography>
    </Alert>
  </Box>
)

const GullyDecoded = ({
  to,
  data,
  value,
}: {
  to?: string
  data?: string | null
  value?: string | null
}): ReactElement | null => {
  const described = useGullyDecoded({ to, data, value })
  if (!described) return null
  return <GullyDecodedView described={described} />
}

export default GullyDecoded
