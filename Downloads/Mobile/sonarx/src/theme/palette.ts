// ─── SonarX palette ───────────────────────────────────────────────────────────

export const extractedLightPalette = {
  // Near-black warm brown — primary text / icon color
  primary: '#25211E',
  // Soft warm cream — secondary surface
  secondary: '#EDE8DF',
  // SonarX signature blue accent
  accent: '#B4CEE7',
  // Off-white warm base background
  background: '#FAF9F4',
  // Pure white card / input surface
  surface: '#FFFFFF',
  textPrimary: '#25211E',
  // Muted warm mid-tone
  textSecondary: '#7A736A',
  // Subtle warm border
  border: '#E0DAD1',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  disabled: '#BCB6AE',
} as const

export const extractedDarkPalette = {
  // Warm off-white — primary text / icon color
  primary: '#FAF9F4',
  // Dark warm surface
  secondary: '#302C29',
  // Slightly brighter blue for dark mode
  accent: '#C8DDF0',
  // Deep warm brown-black base background
  background: '#25211E',
  // One step lighter than background for cards / inputs
  surface: '#302C29',
  textPrimary: '#FAF9F4',
  // Muted warm gray
  textSecondary: '#9E9790',
  // Subtle dark border
  border: '#3D3835',
  success: '#4ade80',
  error: '#f87171',
  warning: '#fbbf24',
  disabled: '#6A6560',
} as const

export const extractedPalette = {
  light: extractedLightPalette,
  dark: extractedDarkPalette,
} as const

export const lightTheme = {
  ...extractedLightPalette,
  primaryForeground: '#FFFFFF',
  secondaryForeground: '#25211E',
  accentForeground: '#25211E',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#EDE8DF',
  chatBackground: '#E7E1D7',
  borderMuted: '#E8E2D9',
  danger: extractedLightPalette.error,
  dangerMuted: '#FEF2F2',
  successMuted: '#F0FDF4',
  warningMuted: '#FFFBEB',
  bubble: {
    outgoing: '#B4CEE7',
    outgoingText: '#25211E',
    incoming: '#FFFFFF',
    incomingText: '#25211E',
    incomingBorder: '#E0DAD1',
  },
  online: extractedLightPalette.success,
  typing: extractedLightPalette.textSecondary,
  overlay: 'rgba(37, 33, 30, 0.28)',
  inputBackground: '#FFFFFF',
  tabBar: '#FAF9F4',
  tabBarActive: '#7AAEC8',
  tabBarInactive: '#BCB6AE',
  headerBackground: '#FAF9F4',
  statusBarStyle: 'dark' as const,
} as const

export const darkTheme = {
  ...extractedDarkPalette,
  primaryForeground: '#25211E',
  secondaryForeground: '#FAF9F4',
  accentForeground: '#25211E',
  surfaceElevated: '#3A3633',
  surfaceMuted: '#302C29',
  chatBackground: '#1C1917',
  borderMuted: '#312D2A',
  danger: extractedDarkPalette.error,
  dangerMuted: '#2F1517',
  successMuted: '#052E16',
  warningMuted: '#2A2209',
  bubble: {
    outgoing: '#C8DDF0',
    outgoingText: '#25211E',
    incoming: '#302C29',
    incomingText: '#FAF9F4',
    incomingBorder: '#3D3835',
  },
  online: extractedDarkPalette.success,
  typing: extractedDarkPalette.textSecondary,
  overlay: 'rgba(0, 0, 0, 0.56)',
  inputBackground: '#302C29',
  tabBar: '#25211E',
  tabBarActive: '#B4CEE7',
  tabBarInactive: '#6A6560',
  headerBackground: '#25211E',
  statusBarStyle: 'light' as const,
} as const

export type ExtractedPalette = typeof extractedLightPalette
export type ThemeColors = typeof lightTheme
