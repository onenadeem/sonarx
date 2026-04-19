import React, { type ReactNode } from 'react'
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/src/theme/ThemeProvider'
import { typography, spacing } from '@/src/theme/tokens'
import { HEADER_HEIGHT } from '@/src/constants/layout'
import AnimatedPressable from '../ui/Pressable'

interface HeaderProps {
  title: string
  subtitle?: string
  subtitleColor?: string
  leftElement?: ReactNode
  rightElements?: ReactNode[]
  showBack?: boolean
  onBackPress?: () => void
  style?: StyleProp<ViewStyle>
}

export default function Header({
  title,
  subtitle,
  subtitleColor,
  leftElement,
  rightElements,
  showBack = false,
  onBackPress,
  style,
}: HeaderProps) {
  const { colors } = useTheme()

  const renderLeft = () => {
    if (leftElement) return leftElement
    if (showBack) {
      return (
        <AnimatedPressable
          onPress={onBackPress}
          haptic
          hapticType="light"
          style={styles.backBtn}
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={colors.accent} />
        </AnimatedPressable>
      )
    }
    return <View style={styles.sidePlaceholder} />
  }

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.headerBackground,
          borderBottomColor: colors.borderMuted,
          height: HEADER_HEIGHT,
        },
        style,
      ]}
    >
      <View style={styles.left}>{renderLeft()}</View>

      <View style={styles.center}>
        <Text
          style={[
            styles.title,
            {
              color: colors.textPrimary,
              fontFamily: typography.fontFamily.semiBold,
            },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[
              styles.subtitle,
              {
                color: subtitleColor ?? colors.textSecondary,
                fontFamily: typography.fontFamily.regular,
              },
            ]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.right}>
        {rightElements?.map((el, idx) => (
          <React.Fragment key={idx}>{el}</React.Fragment>
        ))}
        {!rightElements?.length && <View style={styles.sidePlaceholder} />}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: {
    minWidth: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  right: {
    minWidth: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  backBtn: {
    padding: spacing.xxs,
  },
  sidePlaceholder: {
    width: 40,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
    marginTop: 1,
  },
})
