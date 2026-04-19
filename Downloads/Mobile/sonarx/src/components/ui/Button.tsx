import React from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/src/theme/ThemeProvider'
import { typography, spacing, borderRadius } from '@/src/theme/tokens'
import AnimatedPressable from './Pressable'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  label: string
  onPress: () => void
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: string
  iconPosition?: 'left' | 'right'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  style?: StyleProp<ViewStyle>
}

const SIZE_CONFIG = {
  sm: { height: 32, paddingH: spacing.sm, fontSize: typography.fontSize.sm, iconSize: 14 },
  md: { height: 40, paddingH: spacing.md, fontSize: typography.fontSize.md, iconSize: 16 },
  lg: { height: 48, paddingH: spacing.xl, fontSize: typography.fontSize.lg, iconSize: 18 },
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const { colors } = useTheme()
  const config = SIZE_CONFIG[size]
  const isDisabled = disabled || loading

  const variantStyles = {
    primary: {
      backgroundColor: colors.accent,
      borderColor: 'transparent',
      textColor: colors.accentForeground,
      iconColor: colors.accentForeground,
    },
    secondary: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      textColor: colors.textPrimary,
      iconColor: colors.textSecondary,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      textColor: colors.accent,
      iconColor: colors.accent,
    },
    danger: {
      backgroundColor: colors.danger,
      borderColor: 'transparent',
      textColor: '#ffffff',
      iconColor: '#ffffff',
    },
  }

  const vs = variantStyles[variant]

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={isDisabled}
      haptic
      hapticType="light"
      style={[
        styles.base,
        {
          height: config.height,
          paddingHorizontal: config.paddingH,
          backgroundColor: vs.backgroundColor,
          borderColor: vs.borderColor,
          borderRadius: borderRadius.sm,
          opacity: isDisabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={vs.textColor}
            style={styles.spinner}
          />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <Ionicons
                name={icon as never}
                size={config.iconSize}
                color={vs.iconColor}
                style={styles.iconLeft}
              />
            )}
            <Text
              style={[
                styles.label,
                {
                  fontSize: config.fontSize,
                  color: vs.textColor,
                  fontFamily: typography.fontFamily.semiBold,
                  fontWeight: typography.fontWeight.semiBold,
                },
              ]}
            >
              {label}
            </Text>
            {icon && iconPosition === 'right' && (
              <Ionicons
                name={icon as never}
                size={config.iconSize}
                color={vs.iconColor}
                style={styles.iconRight}
              />
            )}
          </>
        )}
      </View>
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    includeFontPadding: false,
  },
  iconLeft: {
    marginRight: spacing.xxs,
  },
  iconRight: {
    marginLeft: spacing.xxs,
  },
  spinner: {
    marginHorizontal: spacing.xs,
  },
})
