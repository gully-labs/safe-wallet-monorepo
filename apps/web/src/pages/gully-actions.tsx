import type { NextPage } from 'next'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import GullyActions from '@/components/gully/GullyActions'

const GullyActionsPage: NextPage = () => (
  <>
    <Head>
      <title>{`${BRAND_NAME} – Gully actions`}</title>
    </Head>

    <main>
      <GullyActions />
    </main>
  </>
)

export default GullyActionsPage
