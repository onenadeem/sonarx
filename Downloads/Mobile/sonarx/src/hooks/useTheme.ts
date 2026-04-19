export { useTheme } from '@/src/theme/ThemeProvider'
import { useTheme } from '@/src/theme/ThemeProvider'
import type { ColorTokens } from '@/src/theme/tokens'

export function useColors(): ColorTokens {
  return useTheme().colors
}
