// ─── Claude-inspired warm design palette ──────────────────────────────────────

export const extractedLightPalette = {
  // Warm near-black (deep charcoal with hint of brown)
  primary: '#1A1917',
  // Warm secondary surface (light cream)
  secondary: '#F0ECE6',
  // Signature warm orange / terra-cotta (Claude's brand accent)
  accent: '#D4722A',
  // Warm cream background
  background: '#FAF9F7',
  // Pure white surface for cards and inputs
  surface: '#FFFFFF',
  textPrimary: '#1A1917',
  // Warm medium gray
  textSecondary: '#857E75',
  // Warm light border
  border: '#E5E1DB',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  disabled: '#C4BFB9',
} as const

export const extractedDarkPalette = {
  primary: '#F5F2EC',
  secondary: '#2E2B27',
  // Slightly brighter orange for dark mode
  accent: '#E0834A',
  // Very dark warm brown-black
  background: '#1A1917',
  surface: '#252220',
  textPrimary: '#F5F2EC',
  textSecondary: '#9E9891',
  border: '#3A3733',
  success: '#4ade80',
  error: '#f87171',
  warning: '#fbbf24',
  disabled: '#6E6A64',
} as const

export const extractedPalette = {
  light: extractedLightPalette,
  dark: extractedDarkPalette,
} as const

export const lightTheme = {
  ...extractedLightPalette,
  primaryForeground: '#FFFFFF',
  secondaryForeground: '#1A1917',
  accentForeground: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#F0ECE6',
  // Slightly darker warm cream for the chat messages area
  chatBackground: '#EDE9E2',
  borderMuted: '#EDE9E4',
  danger: extractedLightPalette.error,
  dangerMuted: '#FEF2F2',
  successMuted: '#F0FDF4',
  warningMuted: '#FFFBEB',
  bubble: {
    outgoing: '#D4722A',
    outgoingText: '#FFFFFF',
    incoming: '#FFFFFF',
    incomingText: '#1A1917',
    incomingBorder: '#E5E1DB',
  },
  online: extractedLightPalette.success,
  typing: extractedLightPalette.textSecondary,
  overlay: 'rgba(26, 25, 23, 0.28)',
  inputBackground: '#FFFFFF',
  tabBar: '#FFFFFF',
  tabBarActive: '#D4722A',
  tabBarInactive: '#C4BFB9',
  // Light header — warm cream, blends with body
  headerBackground: '#FAF9F7',
  // Dark status-bar icons (light header needs dark icons)
  statusBarStyle: 'dark' as const,
} as const

export const darkTheme = {
  ...extractedDarkPalette,
  primaryForeground: '#1A1917',
  secondaryForeground: '#F5F2EC',
  accentForeground: '#FFFFFF',
  surfaceElevated: '#2E2B27',
  surfaceMuted: '#2E2B27',
  chatBackground: '#141210',
  borderMuted: '#302D2A',
  danger: extractedDarkPalette.error,
  dangerMuted: '#2F1517',
  successMuted: '#052E16',
  warningMuted: '#2A2209',
  bubble: {
    outgoing: '#E0834A',
    outgoingText: '#FFFFFF',
    incoming: '#2E2B27',
    incomingText: '#F5F2EC',
    incomingBorder: '#3A3733',
  },
  online: extractedDarkPalette.success,
  typing: extractedDarkPalette.textSecondary,
  overlay: 'rgba(0, 0, 0, 0.56)',
  inputBackground: '#252220',
  tabBar: '#1A1917',
  tabBarActive: '#E0834A',
  tabBarInactive: '#6E6A64',
  headerBackground: '#1A1917',
  statusBarStyle: 'light' as const,
} as const

export type ExtractedPalette = typeof extractedLightPalette
export type ThemeColors = typeof lightTheme
