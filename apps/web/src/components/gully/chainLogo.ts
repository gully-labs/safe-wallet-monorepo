import { useAppSelector } from '@/store'
import { selectSettings } from '@/store/settingsSlice'

/**
 * Chain marks that come in two official variants. The config service holds one file per chain (the variant for light
 * backgrounds); on the dark theme these chains swap to the publisher's own variant for dark backgrounds, shipped
 * byte-identical in /public/brand/chains/<id>/. Never redrawn or recoloured.
 *
 * 99901 Kinetiq Elysium: https://kinetiq.xyz/assets/brand/elysium/elysium-logomark-light.png (sha256 df87cf35…fc4c),
 * the dark ink circle (chain_logo.png, elysium-logomark-dark.png) disappears on the dark theme.
 */
export const DARK_BG_LOGOS: Record<string, string> = {
  '99901': '/brand/chains/99901/chain_logo-light.png',
}

const CHAIN_LOGO = /\/chains\/(\d+)\/chain_logo\.png(?:\?.*)?$/

/** The logo to show for `src` (a config-service chain_logo.png URL) on the current theme. Other URLs pass through. */
export const logoForTheme = (src: string | null | undefined, isDark: boolean): string | undefined => {
  if (!src) return undefined
  if (!isDark) return src
  const id = CHAIN_LOGO.exec(src)?.[1]
  return (id && DARK_BG_LOGOS[id]) || src
}

/** Same as the app's useDarkMode default (dark unless the user picked light), read without its side effect. */
export const useIsDarkTheme = (): boolean => useAppSelector(selectSettings).theme.darkMode ?? true

export const useChainLogo = (src: string | null | undefined): string | undefined => logoForTheme(src, useIsDarkTheme())
