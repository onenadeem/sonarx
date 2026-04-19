import React, {
  Component,
  useCallback,
  useEffect,
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
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { desc } from 'drizzle-orm'
import { useRouter } from 'expo-router'
import { useTheme } from '@/src/theme/ThemeProvider'
import { borderRadius, shadows, spacing, typography } from '@/src/theme/tokens'
import { Strings } from '@/src/constants/strings'
import { HEADER_HEIGHT, SCREEN_WIDTH, TAB_BAR_HEIGHT } from '@/src/constants/layout'
import { db } from '@/db/client'
import { conversations } from '@/db/schema'
import type { Conversation, Peer } from '@/db/schema'
import { useMessagesStore } from '@/src/store/messagesStore'
import AnimatedPressable from '@/src/components/ui/Pressable'
import Avatar from '@/src/components/ui/Avatar'
import Badge from '@/src/components/ui/Badge'
import Divider from '@/src/components/ui/Divider'
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
                  color: colors.textDisabled,
                  fontFamily: typography.fontFamily.regular,
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
                color: unreadCount > 0 ? colors.textPrimary : colors.textSecondary,
                fontFamily:
                  unreadCount > 0
                    ? typography.fontFamily.medium
                    : typography.fontFamily.regular,
              },
            ]}
            numberOfLines={1}
          >
            {Strings.chat.emptyChat}
          </Text>
          {unreadCount > 0 && <Badge count={unreadCount} />}
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
        style={[styles.emptyIllustration, { backgroundColor: colors.accentMuted }]}
      >
        <Ionicons name="chatbubbles-outline" size={48} color={colors.accent} />
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
  const [searchVisible, setSearchVisible] = useState(false)
  const searchInputRef = useRef<TextInput>(null)
  const searchWidth = useSharedValue(0)
  const fabScale = useSharedValue(1)

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

  const openSearch = useCallback(() => {
    setSearchVisible(true)
    searchWidth.value = withTiming(SCREEN_WIDTH - spacing.md * 2 - 40, {
      duration: 250,
    })
    setTimeout(() => searchInputRef.current?.focus(), 100)
  }, [])

  const closeSearch = useCallback(() => {
    setSearchQuery('')
    setSearchVisible(false)
    searchWidth.value = withTiming(0, { duration: 200 })
    searchInputRef.current?.blur()
  }, [])

  useEffect(() => {
    fabScale.value = withSpring(
      filteredConversations.length > 0 ? 1 : 0,
      { damping: 14, stiffness: 200 },
    )
  }, [filteredConversations.length])

  const searchStyle = useAnimatedStyle(() => ({
    width: searchWidth.value,
    opacity: searchWidth.value > 0 ? 1 : 0,
  }))

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }))

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

  const ItemSeparator = useCallback(
    () => <Divider />,
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
        {searchVisible ? (
          <Animated.View style={[styles.searchBar, searchStyle]}>
            <Ionicons name="search" size={16} color={colors.textSecondary} />
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
            />
            <AnimatedPressable onPress={closeSearch} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textDisabled} />
            </AnimatedPressable>
          </Animated.View>
        ) : (
          <Text
            style={[
              styles.headerTitle,
              { color: colors.textPrimary, fontFamily: typography.fontFamily.bold },
            ]}
          >
            {Strings.app.name}
          </Text>
        )}

        {!searchVisible && (
          <View style={styles.headerRight}>
            <AnimatedPressable onPress={openSearch} haptic hitSlop={8} accessibilityLabel="Search">
              <Ionicons name="search-outline" size={22} color={colors.textPrimary} />
            </AnimatedPressable>
            <AnimatedPressable
              onPress={() => router.push('/chat/new' as Parameters<typeof router.push>[0])}
              haptic
              hitSlop={8}
              accessibilityLabel="New message"
            >
              <Ionicons name="create-outline" size={22} color={colors.textPrimary} />
            </AnimatedPressable>
          </View>
        )}
      </View>

      {/* List */}
      {filteredConversations.length === 0 ? (
        searchQuery.trim() ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
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
          ItemSeparatorComponent={ItemSeparator}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + spacing.xxl }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      )}

      {/* FAB */}
      {filteredConversations.length > 0 && (
        <Animated.View
          style={[
            styles.fab,
            { bottom: insets.bottom + TAB_BAR_HEIGHT + spacing.md },
            shadows.lg,
            fabStyle,
          ]}
        >
          <AnimatedPressable
            onPress={() => router.push('/(tabs)/contacts' as Parameters<typeof router.push>[0])}
            haptic
            hapticType="medium"
            style={[styles.fabInner, { backgroundColor: colors.accent }]}
            accessibilityLabel={Strings.chatList.newMessage}
          >
            <Ionicons name="create-outline" size={18} color={colors.accentForeground} />
            <Text
              style={[
                styles.fabLabel,
                { color: colors.accentForeground, fontFamily: typography.fontFamily.semiBold },
              ]}
            >
              {Strings.chatList.newMessage}
            </Text>
          </AnimatedPressable>
        </Animated.View>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.regular,
    paddingVertical: Platform.OS === 'ios' ? spacing.xxs : 0,
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  rowContent: {
    flex: 1,
    gap: 2,
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
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
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
    fontWeight: typography.fontWeight.regular,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  emptyIllustration: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semiBold,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.regular,
    textAlign: 'center',
    lineHeight: typography.fontSize.md * 1.5,
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
  fab: {
    position: 'absolute',
    alignSelf: 'center',
  },
  fabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
  },
  fabLabel: {
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
