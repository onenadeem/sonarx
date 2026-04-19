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

interface SkeletonProps {
  width?: number | string
  height?: number
  borderRadius?: number
  style?: StyleProp<ViewStyle>
}

export default function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 6,
  style,
}: SkeletonProps) {
  const { colors } = useTheme()
  const opacity = useSharedValue(0.9)

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 700 }),
        withTiming(0.9, { duration: 700 }),
      ),
      -1,
      false,
    )
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: colors.surface,
        },
        animatedStyle,
        style,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  skeleton: {},
})
