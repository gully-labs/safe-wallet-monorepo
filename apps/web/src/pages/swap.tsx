import { useEffect } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { BRAND_NAME } from '@/config/constants'
import { AppRoutes } from '@/config/routes'
import useChainId from '@/hooks/useChainId'
import { gullyAppUrl } from '@/config/gullyApps'
import GullyServices from '@/components/gully/GullyServices'

// Gully Multisig: Swap runs INSIDE the multisig (owner 2026-11-10, "why isnt there a swap in the app?"): Gully Core's swap
// as a Safe App on the selected chain (config/gullyApps.ts). With a multisig open (?safe=) this opens it at once; without,
// it asks which of your multisigs on this chain swaps. (Until 2026-11-10 this page sent visitors to app.gullycore.xyz.)
const SwapPage: NextPage = () => {
  const router = useRouter()
  const chainId = useChainId()
  const safe = typeof router.query.safe === 'string' ? router.query.safe : undefined
  const appUrl = gullyAppUrl('swap', chainId)

  useEffect(() => {
    if (router.isReady && safe && appUrl) {
      router.replace({ pathname: AppRoutes.apps.open, query: { safe, appUrl } })
    }
  }, [router, safe, appUrl])

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Swap`}</title>
      </Head>
      <main>
        <GullyServices only={['swap']} heading="Swap from a multisig" />
      </main>
    </>
  )
}

export default SwapPage
