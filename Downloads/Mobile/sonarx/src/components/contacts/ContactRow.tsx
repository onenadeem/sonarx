import React, { type ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/src/theme/ThemeProvider'
import { spacing, typography } from '@/src/theme/tokens'
import { formatMessageTime } from '@/src/utils/formatTime'
import { usePresenceStore } from '@/src/store/presenceStore'
import type { Contact } from '@/src/db/schema'
import Avatar from '@/src/components/ui/Avatar'
import Badge from '@/src/components/ui/Badge'
import AnimatedPressable from '@/src/components/ui/Pressable'

interface ContactRowProps {
  contact: Contact
  lastMessage?: string
  timestamp?: Date | number
  unreadCount?: number
  onPress: () => void
  onLongPress?: () => void
  showTimestamp?: boolean
  showUnreadBadge?: boolean
  rightElement?: ReactNode
}

export default function ContactRow({
  contact,
  lastMessage,
  timestamp,
  unreadCount = 0,
  onPress,
  onLongPress,
  showTimestamp = true,
  showUnreadBadge = true,
  rightElement,
}: ContactRowProps) {
  const { colors } = useTheme()
  const isOnline = usePresenceStore(
    (state) => state.onlineStatus[contact.id]?.isOnline ?? false,
  )

  const renderRightActions = () => (
    <View style={styles.swipeActions}>
      <AnimatedPressable
        onPress={() => {}}
        haptic
        style={[styles.swipeBtn, { backgroundColor: colors.accent }]}
        accessibilityLabel="Archive"
      >
        <Ionicons name="archive-outline" size={20} color="#ffffff" />
      </AnimatedPressable>
      <AnimatedPressable
        onPress={() => {}}
        haptic
        style={[styles.swipeBtn, { backgroundColor: colors.danger }]}
        accessibilityLabel="Delete"
      >
        <Ionicons name="trash-outline" size={20} color="#ffffff" />
      </AnimatedPressable>
    </View>
  )

  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      <AnimatedPressable
        onPress={onPress}
        onLongPress={onLongPress}
        haptic
        hapticType="light"
        style={[styles.row, { backgroundColor: colors.surface }]}
        accessibilityLabel={`Chat with ${contact.displayName}`}
      >
        <Avatar
          uri={contact.avatarUri}
          name={contact.displayName}
          size="md"
          showOnlineBadge
          isOnline={isOnline}
        />
        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text
              style={[
                styles.name,
                {
                  color: colors.textPrimary,
                  fontFamily: typography.fontFamily.semiBold,
                },
              ]}
              numberOfLines={1}
            >
              {contact.displayName}
            </Text>
            {showTimestamp && timestamp !== undefined && (
              <Text
                style={[
                  styles.timestamp,
                  {
                    color: colors.textDisabled,
                    fontFamily: typography.fontFamily.regular,
                  },
                ]}
              >
                {formatMessageTime(timestamp)}
              </Text>
            )}
          </View>
          <View style={styles.bottomRow}>
            {lastMessage !== undefined && (
              <Text
                style={[
                  styles.lastMessage,
                  {
                    color: colors.textSecondary,
                    fontFamily: typography.fontFamily.regular,
                  },
                ]}
                numberOfLines={1}
              >
                {lastMessage}
              </Text>
            )}
            <View style={styles.badgeWrapper}>
              {rightElement}
              {showUnreadBadge && unreadCount > 0 && (
                <Badge count={unreadCount} />
              )}
            </View>
          </View>
        </View>
      </AnimatedPressable>
    </Swipeable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  name: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  lastMessage: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
  },
  badgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  swipeBtn: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
