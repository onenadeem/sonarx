import React, { type ReactNode } from 'react'
import {
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from 'react-native-reanimated'
import * as Haptics from '@/src/utils/haptics'

interface AnimatedPressableProps {
  onPress?: () => void
  onLongPress?: () => void
  haptic?: boolean
  hapticType?: 'light' | 'medium' | 'heavy' | 'selection'
  scaleOnPress?: boolean
  style?: StyleProp<ViewStyle>
  children: ReactNode
  disabled?: boolean
  hitSlop?: number
  accessibilityLabel?: string
}

const HAPTIC_MAP = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
}

export default function AnimatedPressable({
  onPress,
  onLongPress,
  haptic = false,
  hapticType = 'light',
  scaleOnPress = true,
  style,
  children,
  disabled = false,
  hitSlop,
  accessibilityLabel,
}: AnimatedPressableProps) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    if (scaleOnPress) {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 300 })
    }
  }

  const handlePressOut = () => {
    if (scaleOnPress) {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 })
    }
  }

  const handlePress = () => {
    if (haptic) {
      if (hapticType === 'selection') {
        Haptics.selectionAsync()
      } else {
        Haptics.impactAsync(HAPTIC_MAP[hapticType])
      }
    }
    onPress?.()
  }

  const handleLongPress = () => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    }
    onLongPress?.()
  }

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress ? handleLongPress : undefined}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityLabel={accessibilityLabel}
      style={styles.pressable}
    >
      <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pressable: {
    // Pressable itself carries no visual style; the Animated.View handles layout
  },
})
