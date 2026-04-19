import React from 'react'
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native'
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
}: BadgeProps) {
  const { colors } = useTheme()

  if (count === 0) return null

  const label = count > max ? `${max}+` : String(count)

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.accent },
        style,
      ]}
    >
      <Text style={[styles.text, { color: colors.accentForeground }, textStyle]}>
        {label}
      </Text>
    </View>
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
