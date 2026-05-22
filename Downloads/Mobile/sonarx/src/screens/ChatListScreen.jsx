import { Component, useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { desc } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useRouter } from "expo-router";
import { db } from "@/db/client";
import { conversations } from "@/db/schema";
import Button from "@/src/components/ui/Button";
import Header from "@/src/components/ui/Header";
import ListItem from "@/src/components/ui/ListItem";
import Avatar from "@/src/components/ui/Avatar";
import Badge from "@/src/components/ui/Badge";
import { useResponsive } from "@/src/hooks/useResponsive";
import { useScrollToTop } from "@/src/hooks/useScrollToTop";
import { useMessagesStore } from "@/src/store/messagesStore";
import { useIdentityStore } from "@/src/store/identityStore";
import { useTheme } from "@/src/theme/ThemeProvider";
import { spacing, typography } from "@/src/theme/tokens";
import { Strings } from "@/src/constants/strings";
import { formatMessageTime } from "@/src/utils/formatTime";
import SonarXLogo from "@/components/SonarXLogo";
import { CHAT_LIST_MAX_WIDTH } from "@/src/constants/layout";
import { ROUTES } from "@/src/constants/routes";
import AddContactSheet from "@/src/components/contacts/AddContactSheet";
import emptyChatsDark from "@/assets/images/empty-chats-dark.png";
import emptyChatsLight from "@/assets/images/empty-chats-light.png";
class ChatListErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("[ChatListScreen]", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{Strings.common.error}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}
function SearchBar({ value, onChangeText, onClear, style }) {
  const { colors } = useTheme();
  const searchWrapperThemeStyle = useMemo(
    () => ({
      backgroundColor: colors.surface,
      borderColor: colors.border,
    }),
    [colors.border, colors.surface],
  );
  return (
    <View style={[styles.searchContainer, { ...searchWrapperThemeStyle }, style]}>
      <Ionicons
        name="search-outline"
        size={16}
        color={colors.textSecondary}
        style={styles.searchIcon}
      />
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search chats, contacts..."
        placeholderTextColor={colors.textSecondary}
        style={[styles.searchInput, { color: colors.textPrimary }]}
      />
      {value ? (
        <Pressable onPress={onClear} style={styles.searchClearButton}>
          <Ionicons name="close-outline" size={16} color={colors.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}
function ConversationRow({ item, onPress }) {
  const { colors } = useTheme();
  const unreadCount = item.unreadCount ?? 0;
  const hasUnread = unreadCount > 0;
  const peerName = item.peer?.displayName ?? item.peerId;
  const timestampStyle = useMemo(
    () => ({
      color: hasUnread ? colors.accent : colors.textSecondary,
      fontFamily: hasUnread
        ? typography.fontFamily.semiBold
        : typography.fontFamily.regular,
    }),
    [colors.accent, colors.textSecondary, hasUnread],
  );
  const subtitleStyle = useMemo(
    () => ({
      color: hasUnread ? colors.textPrimary : colors.textSecondary,
      fontFamily: hasUnread
        ? typography.fontFamily.medium
        : typography.fontFamily.regular,
    }),
    [colors.textPrimary, colors.textSecondary, hasUnread],
  );
  return (
    <ListItem
      title={peerName}
      subtitle={Strings.chat.emptyChat}
      onPress={onPress}
      height={72}
      divider
      dividerInset={80}
      style={styles.listItemTransparent}
      accessibilityLabel={`Open chat with ${peerName}`}
      leading={
        <View>
          <Avatar
            uri={item.peer?.avatarUri}
            name={peerName}
            size="md"
            showOnlineBadge={false}
          />
          {hasUnread ? (
            <Badge count={unreadCount} style={styles.floatingBadge} />
          ) : null}
        </View>
      }
      meta={
        item.lastMessageAt ? (
          <Text style={[styles.timestamp, timestampStyle]}>
            {formatMessageTime(item.lastMessageAt)}
          </Text>
        ) : null
      }
      titleStyle={styles.conversationTitle}
      subtitleStyle={[styles.conversationSubtitle, subtitleStyle]}
    />
  );
}
function EmptyState({ onPress }) {
  const { colors, isDark } = useTheme();
  const titleStyle = useMemo(
    () => ({
      color: colors.textPrimary,
      fontFamily: typography.fontFamily.semiBold,
    }),
    [colors.textPrimary],
  );
  const subtitleStyle = useMemo(
    () => ({
      color: colors.textSecondary,
      fontFamily: typography.fontFamily.regular,
    }),
    [colors.textSecondary],
  );
  return (
    <View style={styles.emptyState}>
      <Image
        source={isDark ? emptyChatsDark : emptyChatsLight}
        resizeMode="contain"
        style={styles.emptyImage}
      />
      <Text style={[styles.emptyTitle, titleStyle]}>No chats yet</Text>
      <Text style={[styles.emptySubtitle, subtitleStyle]} numberOfLines={2}>
        Add a contact to start a secure conversation.
      </Text>
      <Button
        text="Add chat"
        onPress={onPress}
        variant="primary"
        size="md"
        icon="add-outline"
        fullWidth
      />
    </View>
  );
}
function ChatListScreenInner() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDesktop, isTablet } = useResponsive();
  const [searchQuery, setSearchQuery] = useState("");
  const listRef = useScrollToTop();
  const addContactSheetRef = useRef(null);
  const identity = useIdentityStore((state) => state.identity);
  const userAvatarUri = identity?.avatarUri ?? "";
  const headerTitleStyle = useMemo(
    () => ({
      color: colors.textPrimary,
      fontFamily: typography.fontFamily.semiBold,
      fontSize: typography.fontSize.md,
      lineHeight: typography.fontSize.md,
      marginTop: -1,
    }),
    [colors.textPrimary],
  );
  const headerStatusStyle = useMemo(
    () => ({
      color: colors.textSecondary,
      fontFamily: typography.fontFamily.regular,
      fontSize: 10,
      lineHeight: 10,
      marginTop: -1,
    }),
    [colors.textSecondary],
  );
  const headerAddPillStyle = useMemo(
    () => ({
      backgroundColor: colors.surface,
      borderColor: colors.border,
    }),
    [colors.surface, colors.border],
  );
  const headerAddLabelStyle = useMemo(
    () => ({
      color: colors.textPrimary,
    }),
    [colors.textPrimary],
  );
  const headerAddIconStyle = useMemo(
    () => ({
      color: colors.textSecondary,
    }),
    [colors.textSecondary],
  );
  const conversationsQuery = useMemo(
    () =>
      db.query.conversations.findMany({
        orderBy: desc(conversations.lastMessageAt),
        with: { peer: true },
      }),
    [],
  );
  const { data: liveConversations } = useLiveQuery(conversationsQuery);
  const storeChats = useMessagesStore((state) => state.chats);
  const allConversations = useMemo(() => {
    const base = liveConversations ?? [];
    if (storeChats.length === 0) {
      return base;
    }
    const merged = [...base];
    storeChats.forEach((chat) => {
      const exists = merged.some((conversation) => conversation.id === chat.id);
      if (!exists) {
        merged.push({
          id: chat.id,
          peerId: chat.contactId,
          lastMessageId: chat.lastMessageId ?? null,
          lastMessageAt: chat.lastMessageAt
            ? new Date(chat.lastMessageAt)
            : null,
          unreadCount: chat.unreadCount,
          isPinned: false,
          isMuted: false,
          disappearingMessages: null,
          peer: null,
        });
      }
    });
    return merged.sort((a, b) => {
      const left = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const right = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return right - left;
    });
  }, [liveConversations, storeChats]);
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return allConversations;
    }
    const normalizedQuery = searchQuery.toLowerCase();
    return allConversations.filter(
      (conversation) =>
        conversation.peer?.displayName
          ?.toLowerCase()
          .includes(normalizedQuery) ||
        conversation.peerId.toLowerCase().includes(normalizedQuery),
    );
  }, [allConversations, searchQuery]);
  const contentMaxWidth = isDesktop
    ? CHAT_LIST_MAX_WIDTH.desktop
    : isTablet
      ? CHAT_LIST_MAX_WIDTH.tablet
      : undefined;
  const navigateToContacts = useCallback(() => {
    router.push(ROUTES.TABS_CONTACTS);
  }, [router]);
  const renderItem = useCallback(
    ({ item }) => (
      <ConversationRow
        item={item}
        onPress={() =>
          router.push({
            pathname: "/chat/[peerId]",
            params: {
              peerId: item.peerId,
              conversationId: item.id,
              peerName: item.peer?.displayName ?? item.peerId,
              avatarUri: item.peer?.avatarUri ?? "",
            },
          })
        }
      />
    ),
    [router],
  );
  const listContentStyle = useMemo(
    () => ({
      paddingBottom: insets.bottom + spacing.xl,
    }),
    [insets.bottom],
  );
  const screenStyle = useMemo(
    () => ({
      backgroundColor: colors.background,
      paddingTop: insets.top,
    }),
    [colors.background, insets.top],
  );
  const contentShellStyle = useMemo(
    () =>
      contentMaxWidth
        ? [styles.contentShell, { maxWidth: contentMaxWidth }]
        : [styles.contentShell],
    [contentMaxWidth],
  );
  return (
    <View style={[styles.screen, screenStyle]}>
      <View style={contentShellStyle}>
        <Header
          title=""
          titleAlign="start"
          style={styles.headerContainer}
          leftAccessory={
            <View style={styles.headerLeftSection}>
              <View style={styles.headerTopRow}>
                <View style={styles.headerBrandRow}>
                  <SonarXLogo size={40} />
                  <View style={styles.headerTextBlock}>
                    <Text style={headerTitleStyle}>resonar</Text>
                    <Text style={headerStatusStyle}>Encrypted</Text>
                  </View>
                </View>
                <View style={styles.headerRightAccessory}>
                  <Pressable
                    onPress={() => addContactSheetRef.current?.present()}
                    style={[styles.headerAddPill, headerAddPillStyle]}
                    accessibilityLabel="Add"
                  >
                    <Ionicons
                      name="add"
                      size={15}
                      color={headerAddIconStyle.color}
                    />
                    <Text
                      style={[
                        styles.headerAddLabel,
                        { marginRight: 5 },
                        headerAddLabelStyle,
                      ]}
                    >
                      Add
                    </Text>
                  </Pressable>
                  <Avatar
                    name={identity?.displayName ?? "User"}
                    uri={userAvatarUri}
                    size={32}
                    showOnlineBadge={false}
                    style={styles.headerAvatar}
                  />
                </View>
              </View>
              <SearchBar
                style={styles.headerSearchBar}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onClear={() => setSearchQuery("")}
              />
            </View>
          }
        />
 
        {filteredConversations.length === 0 ? (
          <EmptyState onPress={navigateToContacts} />
        ) : (
          <FlatList
            ref={listRef}
            data={filteredConversations}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={listContentStyle}
          />
        )}
      </View>
      <AddContactSheet ref={addContactSheetRef} />
    </View>
  );
}
export default function ChatListScreen() {
  return (
    <ChatListErrorBoundary>
      <ChatListScreenInner />
    </ChatListErrorBoundary>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  contentShell: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
  },
  headerContainer: {
    alignItems: "flex-start",
    paddingTop: spacing.xxxl,
  },
  searchContainer: {
    width: "auto",
    height: 44,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.xxs,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    paddingTop: 3,
    paddingBottom: 3,
    paddingRight: 0,
  },
  searchIcon: {
    marginLeft: 2,
  },
  searchClearButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  listItemTransparent: {
    backgroundColor: "transparent",
  },
  conversationTitle: {
    fontSize: 16,
  },
  conversationSubtitle: {
    fontSize: 12,
  },
  timestamp: {
    ...typography.caption,
  },
  floatingBadge: {
    position: "absolute",
    top: -2,
    right: -6,
  },
  headerLeftSection: {
    flexDirection: "column",
    width: "100%",
    alignItems: "stretch",
    justifyContent: "center",
    gap: spacing.sm,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginLeft: -spacing.xs,
  },
  headerRightAccessory: {
    marginRight: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerAddPill: {
    minWidth: 66,
    height: 35,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: spacing.xs,
  },
  headerAddLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
  },
  headerSearchBar: {
    alignSelf: "stretch",
    marginBottom: 10,
  },
  headerAvatar: {
    marginTop: 0,
    alignSelf: "center",
    marginRight: -spacing.xxs,
  },
  headerTextBlock: {
    minWidth: 0,
    flexShrink: 0,
    overflow: "hidden",
    justifyContent: "center",
    gap: 0,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emptyImage: {
    width: 260,
    height: 260,
    alignSelf: "center",
  },
  emptyTitle: {
    ...typography.h3,
    textAlign: "center",
  },
  emptySubtitle: {
    ...typography.body,
    textAlign: "center",
    marginTop: -spacing.xs,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    ...typography.body,
  },
});
