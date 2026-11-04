import type { NextPage } from 'next'
import { GullyLegalRedirect } from '@/components/common/GullyLegal'
import { GULLY_TERMS_URL } from '@/config/gully'

// Gully Safe: the Gully Chain Terms cover this app. Safe's own terms do not apply to this deployment.
const Terms: NextPage = () => (
  <main style={{ lineHeight: '1.5' }}>
    <GullyLegalRedirect title="Terms" href={GULLY_TERMS_URL} />
  </main>
)

export default Terms
