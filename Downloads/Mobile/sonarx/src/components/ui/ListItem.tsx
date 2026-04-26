import React, { type ReactNode } from 'react'
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { useTheme } from '@/src/theme/ThemeProvider'
import { spacing, typography } from '@/src/theme/tokens'
import AnimatedPressable from './Pressable'

interface ListItemProps {
  title: ReactNode
  subtitle?: ReactNode
  meta?: ReactNode
  leading?: ReactNode
  trailing?: ReactNode
  onPress?: () => void
  onLongPress?: () => void
  height?: number
  divider?: boolean
  dividerInset?: number
  style?: StyleProp<ViewStyle>
  titleStyle?: StyleProp<TextStyle>
  subtitleStyle?: StyleProp<TextStyle>
  accessibilityLabel?: string
}

export default function ListItem({
  title,
  subtitle,
  meta,
  leading,
  trailing,
  onPress,
  onLongPress,
  height = 64,
  divider = true,
  dividerInset = 64,
  style,
  titleStyle,
  subtitleStyle,
  accessibilityLabel,
}: ListItemProps) {
  const { colors } = useTheme()

  const content = (
    <View
      style={[
        styles.row,
        { minHeight: height, backgroundColor: colors.surface },
        style,
      ]}
    >
      {leading ? <View style={styles.leading}>{leading}</View> : null}

      <View style={styles.content}>
        <View style={styles.primaryRow}>
          {typeof title === 'string' ? (
            <Text
              style={[
                styles.title,
                {
                  color: colors.textPrimary,
                  fontFamily: typography.fontFamily.semiBold,
                },
                titleStyle,
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
          ) : (
            <View style={styles.titleWrapper}>{title}</View>
          )}
          {meta ? <View style={styles.meta}>{meta}</View> : null}
        </View>

        {subtitle ? (
          typeof subtitle === 'string' || typeof subtitle === 'number' ? (
            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textSecondary,
                  fontFamily: typography.fontFamily.regular,
                },
                subtitleStyle,
              ]}
              numberOfLines={1}
            >
              {String(subtitle)}
            </Text>
          ) : (
            <View>{subtitle}</View>
          )
        ) : null}
      </View>

      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}

      {divider ? (
        <View
          style={[
            styles.divider,
            {
              backgroundColor: colors.border,
              left: dividerInset,
            },
          ]}
        />
      ) : null}
    </View>
  )

  if (!onPress && !onLongPress) {
    return content
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityLabel={accessibilityLabel}
      style={styles.pressable}
    >
      {content}
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  leading: {
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyBold,
    flex: 1,
  },
  titleWrapper: {
    flex: 1,
  },
  subtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  meta: {
    alignItems: 'flex-end',
  },
  trailing: {
    marginLeft: spacing.md,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  divider: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
})
