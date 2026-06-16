/**
 * useTheme.ts — Dark/Light mode toggle.
 *
 * Persists the user's choice in localStorage and applies it via a
 * `data-theme` attribute on <html>, which index.css uses to switch
 * all CSS variables (and therefore every Tailwind color class, since
 * tailwind.config.js maps colors to those variables).
 */

import { useEffect, useState, useCallback } from 'react'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'iranza-theme'

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  // Default to dark regardless of system preference — this app's brand
  // identity (landing page, dashboard) is designed dark-first.
  return 'dark'
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  return { theme, setTheme, toggleTheme }
}
