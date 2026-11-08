import type { NextPage } from 'next'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import GullyServices from '@/components/gully/GullyServices'
import PageHeader from '@/components/common/PageHeader'

const GullyServicesPage: NextPage = () => (
  <>
    <Head>
      <title>{`${BRAND_NAME} – Gully services`}</title>
    </Head>

    <PageHeader title="Gully services" noBorder />
    <main>
      <GullyServices />
    </main>
  </>
)

export default GullyServicesPage
