import React from 'react'
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { Image } from 'expo-image'
import { useTheme } from '@/src/theme/ThemeProvider'
import { typography } from '@/src/theme/tokens'

interface AvatarProps {
  uri?: string | null
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number
  showOnlineBadge?: boolean
  isOnline?: boolean
  selected?: boolean
  style?: StyleProp<ViewStyle>
}

const SIZE_MAP = {
  xs: 32,
  sm: 40,
  md: 48,
  lg: 56,
  xl: 64,
} as const

const FALLBACK_COLORS = ['#D4722A', '#C06020', '#B85030', '#A84820', '#E09050']

function getColorFromName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
    hash &= hash
  }

  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length]
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

  return name.trim().charAt(0).toUpperCase()
}

export default function Avatar({
  uri,
  name,
  size = 'md',
  showOnlineBadge = false,
  isOnline = false,
  selected = false,
  style,
}: AvatarProps) {
  const { colors } = useTheme()
  const dimension = typeof size === 'number' ? size : SIZE_MAP[size]
  const initials = getInitials(name)
  const badgeSize = Math.max(8, Math.round(dimension * 0.25))

  return (
    <View style={[styles.container, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[
            styles.avatar,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
              borderColor: selected ? colors.accent : 'transparent',
              borderWidth: selected ? 2 : 0,
            },
          ]}
          contentFit="cover"
        />
      ) : (
        <View
          style={[
            styles.avatar,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
              backgroundColor: getColorFromName(name),
              borderColor: selected ? colors.accent : 'transparent',
              borderWidth: selected ? 2 : 0,
            },
          ]}
        >
          <Text
            style={[
              styles.initials,
              {
                fontSize: Math.max(12, Math.round(dimension * 0.34)),
              },
            ]}
          >
            {initials}
          </Text>
        </View>
      )}

      {showOnlineBadge ? (
        <View
          style={[
            styles.badge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: isOnline ? colors.online : colors.border,
              borderColor: colors.background,
            },
          ]}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  initials: {
    color: '#ffffff',
    fontFamily: typography.fontFamily.semiBold,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    borderWidth: 2,
  },
})
