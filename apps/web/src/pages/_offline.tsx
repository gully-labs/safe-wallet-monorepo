import type { NextPage } from 'next'
import Head from 'next/head'
import { BRAND_NAME } from '@/config/constants'
import { AppRoutes } from '@/config/routes'
import GullyEmptyPage from '@/components/gully/GullyEmptyPage'

const Offline: NextPage = () => (
  <>
    <Head>
      <title>{`${BRAND_NAME} – Offline`}</title>
    </Head>
    <GullyEmptyPage
      code="Offline"
      title="You are offline"
      actions={[{ label: 'Try again', href: AppRoutes.welcome.accounts, primary: true }]}
    >
      <p>
        Gully Multisig needs a connection to read your multisigs and their queues. Nothing was lost: your signatures and
        settings stay on this device.
      </p>
    </GullyEmptyPage>
  </>
)

export default Offline
