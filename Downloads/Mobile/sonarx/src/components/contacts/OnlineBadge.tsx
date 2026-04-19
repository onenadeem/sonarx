import React, { useEffect } from 'react'
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated'
import { useTheme } from '@/src/theme/ThemeProvider'

interface OnlineBadgeProps {
  isOnline: boolean
  size?: number
  style?: StyleProp<ViewStyle>
}

export default function OnlineBadge({
  isOnline,
  size = 10,
  style,
}: OnlineBadgeProps) {
  const { colors } = useTheme()
  const opacity = useSharedValue(1)

  useEffect(() => {
    if (isOnline) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 800 }),
          withTiming(1.0, { duration: 800 }),
        ),
        -1,
        false,
      )
    } else {
      opacity.value = 1
    }
  }, [isOnline])

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isOnline ? colors.online : colors.textDisabled,
        },
        animStyle,
        style,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  dot: {},
})
