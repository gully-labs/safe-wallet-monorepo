import CustomLink from '@/components/common/CustomLink'
import type { NextPage } from 'next'
import Head from 'next/head'
import SafeTerms from '@/markdown/terms/terms.md'
import type { MDXComponents } from 'mdx/types'
import { useIsOfficialHost } from '@/hooks/useIsOfficialHost'
import { BRAND_NAME } from '@/config/constants'
import GullyLegalNotice from '@/components/common/GullyLegalNotice'
import { GULLY_TERMS_URL } from '@/config/gully'

const overrideComponents: MDXComponents = {
  a: CustomLink,
}

const Terms: NextPage = () => {
  const isOfficialHost = useIsOfficialHost()

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Terms`}</title>
      </Head>

      <main style={{ lineHeight: '1.5' }}>
        {isOfficialHost ? (
          <SafeTerms components={overrideComponents} />
        ) : (
          <GullyLegalNotice title="Terms" href={GULLY_TERMS_URL} />
        )}
      </main>
    </>
  )
}

export default Terms
