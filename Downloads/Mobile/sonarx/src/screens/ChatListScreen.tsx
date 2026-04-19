import React, {
  Component,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react'
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { desc } from 'drizzle-orm'
import { useRouter } from 'expo-router'
import { useTheme } from '@/src/theme/ThemeProvider'
import { borderRadius, spacing, typography } from '@/src/theme/tokens'
import { Strings } from '@/src/constants/strings'
import { HEADER_HEIGHT, TAB_BAR_HEIGHT } from '@/src/constants/layout'
import { db } from '@/db/client'
import { conversations } from '@/db/schema'
import type { Conversation, Peer } from '@/db/schema'
import { useMessagesStore } from '@/src/store/messagesStore'
import AnimatedPressable from '@/src/components/ui/Pressable'
import Avatar from '@/src/components/ui/Avatar'
import Badge from '@/src/components/ui/Badge'
import { formatMessageTime } from '@/src/utils/formatTime'
import { usePresenceStore } from '@/src/store/presenceStore'

// ─── Error Boundary ───────────────────────────────────────────────────────────

class ChatListErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ChatListScreen]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{Strings.common.error}</Text>
        </View>
      )
    }
    return this.props.children
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ConversationWithPeer = Conversation & { peer: Peer | null }

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ConversationItemProps {
  item: ConversationWithPeer
  onPress: () => void
}

function ConversationItem({ item, onPress }: ConversationItemProps) {
  const { colors } = useTheme()
  const isOnline = usePresenceStore(
    (state) => state.onlineStatus[item.peerId]?.isOnline ?? false,
  )
  const unreadCount = item.unreadCount ?? 0
  const peerName = item.peer?.displayName ?? item.peerId
  const hasUnread = unreadCount > 0

  return (
    <AnimatedPressable
      onPress={onPress}
      haptic
      hapticType="light"
      style={[styles.conversationRow, { backgroundColor: colors.surface }]}
      accessibilityLabel={`Open chat with ${peerName}`}
    >
      <Avatar
        uri={item.peer?.avatarUri}
        name={peerName}
        size="md"
        showOnlineBadge
        isOnline={isOnline}
      />
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text
            style={[
              styles.peerName,
              {
                color: colors.textPrimary,
                fontFamily: typography.fontFamily.semiBold,
              },
            ]}
            numberOfLines={1}
          >
            {peerName}
          </Text>
          {item.lastMessageAt !== null && item.lastMessageAt !== undefined && (
            <Text
              style={[
                styles.timestamp,
                {
                  color: hasUnread ? colors.accent : colors.textSecondary,
                  fontFamily: hasUnread
                    ? typography.fontFamily.semiBold
                    : typography.fontFamily.regular,
                },
              ]}
            >
              {formatMessageTime(item.lastMessageAt)}
            </Text>
          )}
        </View>
        <View style={styles.rowBottom}>
          <Text
            style={[
              styles.lastMsg,
              {
                color: hasUnread ? colors.textPrimary : colors.textSecondary,
                fontFamily: hasUnread
                  ? typography.fontFamily.medium
                  : typography.fontFamily.regular,
              },
            ]}
            numberOfLines={1}
          >
            {Strings.chat.emptyChat}
          </Text>
          {hasUnread && <Badge count={unreadCount} />}
        </View>
      </View>
    </AnimatedPressable>
  )
}

function EmptyState({ onNewMessage }: { onNewMessage: () => void }) {
  const { colors } = useTheme()
  return (
    <View style={styles.emptyContainer}>
      <View
        style={[styles.emptyIllustration, { backgroundColor: colors.surfaceMuted }]}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={44} color={colors.textSecondary} />
      </View>
      <Text
        style={[
          styles.emptyTitle,
          { color: colors.textPrimary, fontFamily: typography.fontFamily.semiBold },
        ]}
      >
        {Strings.chatList.emptyTitle}
      </Text>
      <Text
        style={[
          styles.emptySub,
          { color: colors.textSecondary, fontFamily: typography.fontFamily.regular },
        ]}
      >
        {Strings.chatList.emptySub}
      </Text>
      <AnimatedPressable
        onPress={onNewMessage}
        haptic
        style={[styles.emptyBtn, { backgroundColor: colors.accent }]}
        accessibilityLabel={Strings.chatList.newMessage}
      >
        <Text
          style={[
            styles.emptyBtnText,
            { color: colors.accentForeground, fontFamily: typography.fontFamily.semiBold },
          ]}
        >
          {Strings.chatList.newMessage}
        </Text>
      </AnimatedPressable>
    </View>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

function ChatListScreenInner() {
  const { colors } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<TextInput>(null)

  const { data: liveConversations } = useLiveQuery(
    db.query.conversations.findMany({
      orderBy: desc(conversations.lastMessageAt),
      with: { peer: true },
    }),
  )

  const storeChats = useMessagesStore((state) => state.chats)

  const allConversations = useMemo<ConversationWithPeer[]>(() => {
    const base: ConversationWithPeer[] = (liveConversations ?? []) as ConversationWithPeer[]
    if (storeChats.length === 0) return base

    const merged = [...base]
    storeChats.forEach((chat) => {
      const exists = merged.some((c) => c.id === chat.id)
      if (!exists) {
        merged.push({
          id: chat.id,
          peerId: chat.contactId,
          lastMessageId: chat.lastMessageId ?? null,
          lastMessageAt: chat.lastMessageAt ? new Date(chat.lastMessageAt) : null,
          unreadCount: chat.unreadCount,
          isPinned: false,
          isMuted: false,
          disappearingMessages: null,
          peer: null,
        })
      }
    })
    return merged.sort((a, b) => {
      const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
      const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
      return tb - ta
    })
  }, [liveConversations, storeChats])

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return allConversations
    const lower = searchQuery.toLowerCase()
    return allConversations.filter(
      (c) =>
        c.peer?.displayName?.toLowerCase().includes(lower) ||
        c.peerId.toLowerCase().includes(lower),
    )
  }, [allConversations, searchQuery])

  const navigateToChat = useCallback(
    (peerId: string) => {
      router.push(`/chat/${peerId}`)
    },
    [router],
  )

  const renderItem = useCallback(
    ({ item }: { item: ConversationWithPeer }) => (
      <ConversationItem
        item={item}
        onPress={() => navigateToChat(item.peerId)}
      />
    ),
    [navigateToChat],
  )

  const keyExtractor = useCallback(
    (item: ConversationWithPeer) => item.id,
    [],
  )

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.headerBackground,
            borderBottomColor: colors.borderMuted,
            height: HEADER_HEIGHT,
          },
        ]}
      >
        <Text
          style={[
            styles.headerTitle,
            { color: colors.textPrimary, fontFamily: typography.fontFamily.bold },
          ]}
        >
          {Strings.app.name}
        </Text>
        <View style={styles.headerRight}>
          <AnimatedPressable
            onPress={() => router.push('/(tabs)/contacts' as Parameters<typeof router.push>[0])}
            haptic
            hapticType="medium"
            hitSlop={8}
            accessibilityLabel="New message"
            style={[styles.headerIconBtn, { backgroundColor: colors.surfaceMuted }]}
          >
            <Ionicons name="create-outline" size={18} color={colors.accent} />
          </AnimatedPressable>
        </View>
      </View>

      {/* Search bar — always visible, WhatsApp-style */}
      <View
        style={[
          styles.searchWrapper,
          { backgroundColor: colors.headerBackground, borderBottomColor: colors.borderMuted },
        ]}
      >
        <View style={[styles.searchBar, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons name="search" size={15} color={colors.textSecondary} />
          <TextInput
            ref={searchInputRef}
            style={[
              styles.searchInput,
              { color: colors.textPrimary, fontFamily: typography.fontFamily.regular },
            ]}
            placeholder={Strings.chatList.searchPlaceholder}
            placeholderTextColor={colors.textDisabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* List */}
      {filteredConversations.length === 0 ? (
        searchQuery.trim() ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={40} color={colors.textDisabled} style={{ marginBottom: spacing.sm }} />
            <Text style={[styles.emptySub, { color: colors.textSecondary, fontFamily: typography.fontFamily.regular }]}>
              {Strings.chatList.noResults(searchQuery)}
            </Text>
          </View>
        ) : (
          <EmptyState onNewMessage={() => router.push('/(tabs)/contacts' as Parameters<typeof router.push>[0])} />
        )
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + spacing.xxl }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      )}
    </View>
  )
}

export default function ChatListScreen() {
  return (
    <ChatListErrorBoundary>
      <ChatListScreenInner />
    </ChatListErrorBoundary>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 0,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrapper: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    paddingTop: spacing.xxs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? spacing.xs : spacing.xxs,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    paddingVertical: 0,
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowContent: {
    flex: 1,
    gap: 3,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  peerName: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    letterSpacing: -0.1,
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  lastMsg: {
    flex: 1,
    fontSize: typography.fontSize.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.sm,
  },
  emptyIllustration: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  emptySub: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * 1.5,
  },
  emptyBtn: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
  },
  emptyBtnText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: typography.fontSize.md,
  },
})

