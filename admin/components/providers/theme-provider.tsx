'use client'

import * as React from 'react'
import { useThemeStore } from '@/store'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore()
  const [mounted, setMounted] = React.useState(false)

  // Set mounted state
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Apply theme to document
  React.useEffect(() => {
    if (!mounted) return

    const root = window.document.documentElement

    // Remove all theme classes
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }

    // Also set data attribute for additional styling support
    root.setAttribute('data-theme', theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme
    )
  }, [theme, mounted])

  // Prevent flash of wrong theme
  if (!mounted) {
    return <>{children}</>
  }

  return <>{children}</>
}
