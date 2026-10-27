import CustomLink from '@/components/common/CustomLink'
import type { MDXComponents } from 'mdx/types'
import type { NextPage } from 'next'
import Head from 'next/head'
import SafePrivacyPolicy from '@/markdown/privacy/privacy.md'
import { useIsOfficialHost } from '@/hooks/useIsOfficialHost'
import { BRAND_NAME } from '@/config/constants'
import GullyLegalNotice from '@/components/common/GullyLegalNotice'
import { GULLY_PRIVACY_URL } from '@/config/gully'

const overrideComponents: MDXComponents = {
  a: CustomLink,
}

const PrivacyPolicy: NextPage = () => {
  const isOfficialHost = useIsOfficialHost()

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Privacy policy`}</title>
      </Head>

      <main style={{ lineHeight: '1.5' }}>
        {isOfficialHost ? (
          <SafePrivacyPolicy components={overrideComponents} />
        ) : (
          <GullyLegalNotice title="Privacy policy" href={GULLY_PRIVACY_URL} />
        )}
      </main>
    </>
  )
}

export default PrivacyPolicy
