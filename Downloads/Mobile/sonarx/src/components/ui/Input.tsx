import React, { useState } from 'react'
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Pressable } from 'react-native'
import { useTheme } from '@/src/theme/ThemeProvider'
import { typography, spacing, borderRadius } from '@/src/theme/tokens'

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string
  hint?: string
  error?: string
  leftIcon?: string
  rightIcon?: string
  onRightIconPress?: () => void
  style?: StyleProp<ViewStyle>
  inputStyle?: StyleProp<TextStyle>
}

export default function Input({
  label,
  hint,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  inputStyle,
  ...textInputProps
}: InputProps) {
  const { colors } = useTheme()
  const [focused, setFocused] = useState(false)
  const focusAnim = useSharedValue(0)

  const handleFocus = () => {
    setFocused(true)
    focusAnim.value = withTiming(1, { duration: 150 })
    textInputProps.onFocus?.(undefined as never)
  }

  const handleBlur = () => {
    setFocused(false)
    focusAnim.value = withTiming(0, { duration: 150 })
    textInputProps.onBlur?.(undefined as never)
  }

  const borderAnimStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusAnim.value,
      [0, 1],
      [error ? colors.danger : colors.border, error ? colors.danger : colors.accent],
    )
    return { borderColor }
  })

  return (
    <View style={[styles.wrapper, style]}>
      {label ? (
        <Text
          style={[
            styles.label,
            { color: colors.textSecondary, fontFamily: typography.fontFamily.medium },
          ]}
        >
          {label}
        </Text>
      ) : null}

      <Animated.View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.inputBackground,
            borderRadius: borderRadius.sm,
          },
          borderAnimStyle,
        ]}
      >
        {leftIcon ? (
          <Ionicons
            name={leftIcon as never}
            size={16}
            color={focused ? colors.accent : colors.textSecondary}
            style={styles.leftIcon}
          />
        ) : null}

        <TextInput
          {...textInputProps}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={colors.textDisabled}
          style={[
            styles.input,
            {
              color: colors.textPrimary,
              fontFamily: typography.fontFamily.regular,
              fontSize: typography.fontSize.md,
              paddingLeft: leftIcon ? 0 : spacing.sm,
              paddingRight: rightIcon ? 0 : spacing.sm,
            },
            inputStyle,
          ]}
        />

        {rightIcon ? (
          <Pressable onPress={onRightIconPress} style={styles.rightIconBtn}>
            <Ionicons
              name={rightIcon as never}
              size={16}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </Animated.View>

      {error ? (
        <Text
          style={[
            styles.hintText,
            { color: colors.danger, fontFamily: typography.fontFamily.regular },
          ]}
        >
          {error}
        </Text>
      ) : hint ? (
        <Text
          style={[
            styles.hintText,
            { color: colors.textSecondary, fontFamily: typography.fontFamily.regular },
          ]}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xxs,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 40,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.xs,
    includeFontPadding: false,
  },
  leftIcon: {
    marginLeft: spacing.sm,
    marginRight: spacing.xs,
  },
  rightIconBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  hintText: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
})
