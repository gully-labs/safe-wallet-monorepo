import Head from 'next/head'
import type { NextPage } from 'next'

import CreateSafe from '@/components/new-safe/create'
import { BRAND_NAME } from '@/config/constants'

const Open: NextPage = () => {
  return (
    <main>
      <Head>
        <title>{`${BRAND_NAME} – Create multisig`}</title>
      </Head>

      <CreateSafe />
    </main>
  )
}

export default Open
