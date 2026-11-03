import type { NextPage } from 'next'
import { GullyLegalRedirect } from '@/components/common/GullyLegal'
import { GULLY_LEGAL_URL } from '@/config/gully'

// Gully Safe: the operator's details (Gully Labs LLC) and every product's legal pages are on gullylabs.xyz/legal.
const Imprint: NextPage = () => (
  <main style={{ lineHeight: '1.5' }}>
    <GullyLegalRedirect title="Legal information" href={GULLY_LEGAL_URL} />
  </main>
)

export default Imprint
