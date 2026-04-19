import React from 'react'
import {
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

interface ChipProps {
  label: string
  onPress?: () => void
  selected?: boolean
  icon?: string
  style?: StyleProp<ViewStyle>
}

export default function Chip({
  label,
  onPress,
  selected = false,
  icon,
  style,
}: ChipProps) {
  const { colors } = useTheme()

  const content = (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.accentMuted : colors.surface,
          borderColor: selected ? colors.accent : colors.border,
        },
        style,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon as never}
          size={14}
          color={selected ? colors.accent : colors.textSecondary}
          style={styles.icon}
        />
      ) : null}
      <Text
        style={[
          styles.label,
          {
            color: selected ? colors.accent : colors.textSecondary,
            fontFamily: typography.fontFamily.medium,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  )

  if (onPress) {
    return (
      <AnimatedPressable onPress={onPress} haptic hapticType="selection">
        {content}
      </AnimatedPressable>
    )
  }

  return content
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: spacing.xxs,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
})
