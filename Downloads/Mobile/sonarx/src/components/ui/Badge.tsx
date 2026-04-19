import React, { useEffect } from 'react'
import {
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native'
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from 'react-native-reanimated'
import { useTheme } from '@/src/theme/ThemeProvider'
import { typography, spacing, borderRadius } from '@/src/theme/tokens'

interface BadgeProps {
  count: number
  max?: number
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  animate?: boolean
}

export default function Badge({
  count,
  max = 99,
  style,
  textStyle,
  animate = true,
}: BadgeProps) {
  const { colors } = useTheme()
  const scale = useSharedValue(count > 0 ? 1 : 0)
  const prevCount = React.useRef(count)

  useEffect(() => {
    if (animate && prevCount.current === 0 && count > 0) {
      scale.value = 0
      scale.value = withSpring(1, { damping: 12, stiffness: 200 })
    } else if (count === 0) {
      scale.value = withSpring(0, { damping: 12, stiffness: 200 })
    } else {
      scale.value = 1
    }
    prevCount.current = count
  }, [count, animate])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  if (count === 0) return null

  const label = count > max ? `${max}+` : String(count)

  return (
    <Animated.View
      style={[
        styles.badge,
        { backgroundColor: colors.accent },
        animatedStyle,
        style,
      ]}
    >
      <Text style={[styles.text, { color: colors.accentForeground }, textStyle]}>
        {label}
      </Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.xxs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semiBold,
    fontWeight: typography.fontWeight.semiBold,
    lineHeight: 14,
  },
})
