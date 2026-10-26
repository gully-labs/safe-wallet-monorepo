import type { ReactElement } from 'react'
import { Typography } from '@mui/material'
import ExternalLink from '@/components/common/ExternalLink'
import { BRAND_NAME } from '@/config/constants'

/** Gully Safe: replaces Safe's own terms / privacy texts, which do not apply to this deployment. */
const GullyLegalNotice = ({ title, href }: { title: string; href: string }): ReactElement => (
  <>
    <Typography variant="h1" mb={2}>
      {title}
    </Typography>
    <Typography mb={1}>
      {BRAND_NAME} is operated by Gully Labs. The {title.toLowerCase()} for {BRAND_NAME} is published at{' '}
      <ExternalLink href={href}>{href}</ExternalLink>.
    </Typography>
  </>
)

export default GullyLegalNotice
