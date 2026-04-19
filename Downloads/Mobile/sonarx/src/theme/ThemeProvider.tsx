import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useColorScheme } from 'react-native'
import { createMMKV } from 'react-native-mmkv'
import { lightColors, darkColors, type ColorTokens } from './tokens'

export const THEME_STORAGE_KEY = 'sonarx-theme-mode'

type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  colors: ColorTokens
  mode: ThemeMode
  isDark: boolean
  setMode: (mode: ThemeMode) => void
}

const storage = createMMKV({ id: 'theme-storage' })

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({
  children,
  initialMode,
}: {
  children: ReactNode
  initialMode?: ThemeMode
}) {
  const systemScheme = useColorScheme()

  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (initialMode) return initialMode
    const stored = storage.getString(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored
    }
    return 'system'
  })

  const setMode = (newMode: ThemeMode) => {
    storage.set(THEME_STORAGE_KEY, newMode)
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
