import React from 'react'
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { Image } from 'expo-image'
import Animated, {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated'
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
  '#0969da',
  '#1a7f37',
  '#9a6700',
  '#cf222e',
  '#8250df',
  '#0550ae',
  '#116329',
  '#bc4c00',
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
  return name.trim().charAt(0).toUpperCase()
}

const BADGE_SIZE = 10
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

  const pulseOpacity = useSharedValue(1)

  React.useEffect(() => {
    if (isOnline && showOnlineBadge) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 800 }),
          withTiming(1, { duration: 800 }),
        ),
        -1,
        false,
      )
    } else {
      pulseOpacity.value = 1
    }
  }, [isOnline, showOnlineBadge])

  const badgeAnimStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }))

  const avatarStyle = {
    width: dim,
    height: dim,
    borderRadius: dim / 2,
  }

  const fallbackFontSize =
    size === 'sm' ? typography.fontSize.xs
    : size === 'lg' ? typography.fontSize.lg
    : size === 'xl' ? typography.fontSize.xl
    : typography.fontSize.md

  return (
    <View style={[styles.container, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.image, avatarStyle]}
          contentFit="cover"
          transition={200}
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
        <Animated.View
          style={[
            styles.badge,
            {
              backgroundColor: isOnline ? colors.online : colors.textDisabled,
              borderColor: colors.surface,
            },
            badgeAnimStyle,
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
    backgroundColor: '#e0e0e0',
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
    bottom: 0,
    right: 0,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    borderWidth: BADGE_BORDER,
  },
})
