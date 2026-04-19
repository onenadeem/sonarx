import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { lightColors, darkColors, type ColorTokens } from './tokens'

export const THEME_STORAGE_KEY = 'sonarx-theme-mode'

type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  colors: ColorTokens
  mode: ThemeMode
  isDark: boolean
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({
  children,
  initialMode,
}: {
  children: ReactNode
  initialMode?: ThemeMode
}) {
  const systemScheme = useColorScheme()

  const [mode, setModeState] = useState<ThemeMode>(initialMode ?? 'system')

  // Load persisted preference async on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setModeState(saved)
      }
    }).catch(() => {/* ignore */})
  }, [])

  const setMode = (newMode: ThemeMode) => {
    AsyncStorage.setItem(THEME_STORAGE_KEY, newMode).catch(console.error)
    setModeState(newMode)
  }

  const isDark = useMemo(() => {
    if (mode === 'system') return systemScheme === 'dark'
    return mode === 'dark'
  }, [mode, systemScheme])

  const colors: ColorTokens = useMemo(
    () => (isDark ? darkColors : lightColors),
    [isDark],
  )

  const value = useMemo<ThemeContextValue>(
    () => ({ colors, mode, isDark, setMode }),
    [colors, mode, isDark],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return ctx
}
