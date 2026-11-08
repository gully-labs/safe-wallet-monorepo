import { ContentSecurityPolicy } from '../securityHeaders'

describe('ContentSecurityPolicy', () => {
  it('lets the Gully analytics loader run', () => {
    const scriptSrc = ContentSecurityPolicy.split(';').find((d) => d.trim().startsWith('script-src')) ?? ''
    expect(scriptSrc).toContain('https://analytics.gullylabs.xyz')
  })
})
