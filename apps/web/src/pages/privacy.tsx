import type { NextPage } from 'next'
import { GullyLegalRedirect } from '@/components/common/GullyLegal'
import { GULLY_PRIVACY_URL } from '@/config/gully'

// Gully Safe: the Gully Chain Privacy Policy covers this app. Safe's own policy does not apply to this deployment.
const PrivacyPolicy: NextPage = () => (
  <main style={{ lineHeight: '1.5' }}>
    <GullyLegalRedirect title="Privacy Policy" href={GULLY_PRIVACY_URL} />
  </main>
)

export default PrivacyPolicy
