import { AppRoutes } from '@/config/routes'
import { isAccountSidebarRoute } from '@/hooks/useIsSidebarRoute'

describe('Gully Multisig: isAccountSidebarRoute', () => {
  it.each([
    AppRoutes.welcome.accounts,
    AppRoutes.gullyServices,
    AppRoutes.settings.appearance,
    AppRoutes.settings.data,
  ])('keeps a navigation on %s without an open Safe', (route) => {
    expect(isAccountSidebarRoute(route)).toBe(true)
  })

  it.each([
    AppRoutes.welcome.index,
    AppRoutes.index,
    AppRoutes.newSafe.create,
    AppRoutes.newSafe.load,
    AppRoutes.terms,
  ])('leaves %s full width: the landing and the create flow have no sidebar', (route) => {
    expect(isAccountSidebarRoute(route)).toBe(false)
  })
})
