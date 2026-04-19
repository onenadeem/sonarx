import React from 'react'
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { Image } from 'expo-image'
import { useTheme } from '@/src/theme/ThemeProvider'
import { AVATAR_SIZE } from '@/src/constants/layout'
import { typography } from '@/src/theme/tokens'

interface AvatarProps {
  uri?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showOnlineBadge?: boolean
  isOnline?: boolean
  style?: StyleProp<ViewStyle>
}

const FALLBACK_COLORS = [
  '#3f3f46', // zinc-700
  '#52525b', // zinc-600
  '#71717a', // zinc-500
  '#18181b', // zinc-900
  '#27272a', // zinc-800
]

function getColorFromName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash & hash
  }
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length]
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.trim().charAt(0).toUpperCase()
}

const BADGE_SIZE = 11
const BADGE_BORDER = 2

export default function Avatar({
  uri,
  name,
  size = 'md',
  showOnlineBadge = false,
  isOnline = false,
  style,
}: AvatarProps) {
  const { colors } = useTheme()
  const dim = AVATAR_SIZE[size]
  const initials = getInitials(name)
  const fallbackColor = getColorFromName(name)

  const avatarStyle = {
    width: dim,
    height: dim,
    borderRadius: dim / 2,
  }

  const fallbackFontSize =
    size === 'sm' ? typography.fontSize.xs
    : size === 'lg' ? typography.fontSize.lg
    : size === 'xl' ? typography.fontSize.xl
    : typography.fontSize.sm

  return (
    <View style={[styles.container, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.image, avatarStyle]}
          contentFit="cover"
        />
      ) : (
        <View
          style={[
            styles.fallback,
            avatarStyle,
            { backgroundColor: fallbackColor },
          ]}
        >
          <Text
            style={[
              styles.initials,
              { fontSize: fallbackFontSize, color: '#ffffff' },
            ]}
          >
            {initials}
          </Text>
        </View>
      )}

      {showOnlineBadge && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: isOnline ? colors.online : colors.border,
              borderColor: colors.surface,
            },
          ]}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  image: {
    backgroundColor: '#E5E5EA',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: typography.fontFamily.semiBold,
    fontWeight: typography.fontWeight.semiBold,
    color: '#ffffff',
  },
  badge: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    borderWidth: BADGE_BORDER,
  },
})
