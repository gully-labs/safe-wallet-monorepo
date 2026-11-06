import type { NextPage } from 'next'
import Head from 'next/head'
import NewSafe from '@/components/welcome/NewSafe'
import { landingTitle } from '@/components/common/MetaTags'

const Welcome: NextPage = () => {
  return (
    <>
      <Head>
        <title>{landingTitle}</title>
      </Head>

      <NewSafe />
    </>
  )
}

export default Welcome
