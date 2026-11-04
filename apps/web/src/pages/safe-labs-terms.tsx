import type { ReactElement } from 'react'
import { useIsOfficialHost } from '@/hooks/useIsOfficialHost'
import SafeLabsTerms from '@/components/terms/safe-labs-terms'
import { GullyLegalRedirect } from '@/components/common/GullyLegal'
import { GULLY_TERMS_URL } from '@/config/gully'

const NewTerms = () => {
  const isOfficialHost = useIsOfficialHost()

  // Gully Safe: not an official Safe host, so this route goes to the Gully Chain Terms like /terms does
  if (!isOfficialHost) {
    return (
      <main style={{ lineHeight: '1.5', padding: 24 }}>
        <GullyLegalRedirect title="Terms" href={GULLY_TERMS_URL} />
      </main>
    )
  }

  return <SafeLabsTerms />
}

NewTerms.getLayout = (page: ReactElement) => page

export default NewTerms
