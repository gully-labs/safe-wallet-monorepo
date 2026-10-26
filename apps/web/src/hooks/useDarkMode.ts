import { useEffect, useState } from 'react'
import { useAppSelector } from '@/store'
import { selectSettings } from '@/store/settingsSlice'

export const useDarkMode = (): boolean => {
  const settings = useAppSelector(selectSettings)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)

  useEffect(() => {
    // Gully Safe: dark theme by default, the user can still switch to light in Settings
    const isDark = settings.theme.darkMode ?? true

    setIsDarkMode(isDark)
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [settings.theme.darkMode])

  return isDarkMode
}
