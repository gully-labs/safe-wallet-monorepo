import type { NextPage } from 'next'
import Head from 'next/head'
import NewSafe from '@/components/welcome/NewSafe'
import { BRAND_NAME } from '@/config/constants'

const Welcome: NextPage = () => {
  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Multisig smart accounts on Gully Chain`}</title>
      </Head>

      <NewSafe />
    </>
  )
}

export default Welcome
