import type { NextPage } from 'next'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import GullyServices from '@/components/gully/GullyServices'

const GullyServicesPage: NextPage = () => (
  <>
    <Head>
      <title>{`${BRAND_NAME} – Gully services`}</title>
    </Head>

    <main>
      <GullyServices />
    </main>
  </>
)

export default GullyServicesPage
