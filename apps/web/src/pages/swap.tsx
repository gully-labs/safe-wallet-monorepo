import { useEffect } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Button, Typography } from '@mui/material'
import { BRAND_NAME } from '@/config/constants'

// Gully Multisig does not embed a swap widget (the upstream page loaded the CoW Swap widget, which is not served here and
// aborted). Swaps live in Gully Core: this route sends the visitor there, keeping a token and amount if one was passed.
export const GULLY_CORE_SWAP = 'https://app.gullycore.xyz/swap'

const SwapPage: NextPage = () => {
  const router = useRouter()
  const { token, amount } = router.query
  const params = new URLSearchParams()
  if (token) params.set('token', String(token))
  if (amount) params.set('amount', String(amount))
  const target = params.toString() ? `${GULLY_CORE_SWAP}?${params.toString()}` : GULLY_CORE_SWAP

  useEffect(() => {
    if (router.isReady) window.location.replace(target)
  }, [router.isReady, target])

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Swap on Gully Core`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <main style={{ textAlign: 'center', padding: '48px 16px' }}>
        <Typography variant="h1" mb={1}>
          Swap on Gully Core
        </Typography>
        <Typography color="text.secondary" mb={3}>
          Swaps run on Gully Core, not inside Gully Multisig. Taking you there.
        </Typography>
        <Button component="a" href={target} variant="contained">
          Open Gully Core
        </Button>
      </main>
    </>
  )
}

export default SwapPage
