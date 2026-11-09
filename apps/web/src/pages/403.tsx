import type { NextPage } from 'next'
import { AppRoutes } from '@/config/routes'
import GullyEmptyPage from '@/components/gully/GullyEmptyPage'

const Custom403: NextPage = () => (
  <GullyEmptyPage
    code="403"
    title="Not available in your region"
    actions={[{ label: 'Read the terms', href: AppRoutes.terms }]}
  >
    <p>Gully Multisig cannot be used from where you are connecting. The terms say which regions are served.</p>
  </GullyEmptyPage>
)

export default Custom403
