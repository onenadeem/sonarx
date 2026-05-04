import { Component, useCallback, useMemo, useState, } from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { desc } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useRouter } from 'expo-router';
import { db } from '@/db/client';
import { conversations } from '@/db/schema';
import Button from '@/src/components/ui/Button';
import Header from '@/src/components/ui/Header';
import ListItem from '@/src/components/ui/ListItem';
import TextInput from '@/src/components/ui/TextInput';
import Avatar from '@/src/components/ui/Avatar';
import Badge from '@/src/components/ui/Badge';
import { useResponsive } from '@/src/hooks/useResponsive';
import { useScrollToTop } from '@/src/hooks/useScrollToTop';
import { useMessagesStore } from '@/src/store/messagesStore';
import { useTheme } from '@/src/theme/ThemeProvider';
import { spacing, typography } from '@/src/theme/tokens';
import { Strings } from '@/src/constants/strings';
import { formatMessageTime } from '@/src/utils/formatTime';
import SonarXLogo from '@/components/SonarXLogo';
import { CHAT_LIST_MAX_WIDTH } from '@/src/constants/layout';
import { ROUTES } from '@/src/constants/routes';
class ChatListErrorBoundary extends Component {
    state = { hasError: false };
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error, info) {
        console.error('[ChatListScreen]', error, info);
    }
    render() {
        if (this.state.hasError) {
            return (<View style={styles.errorContainer}>
          <Text style={styles.errorText}>{Strings.common.error}</Text>
        </View>);
        }
        return this.props.children;
    }
}
function SearchBar({ value, onChangeText, onClear, }) {
    const { colors } = useTheme();
    const searchInputWrapperThemeStyle = useMemo(() => ({
        backgroundColor: colors.surface,
        borderColor: colors.border,
    }), [colors.border, colors.surface]);
    return (<View style={styles.searchContainer}>
      <TextInput value={value} onChangeText={onChangeText} leftIcon="search-outline" rightIcon={value ? 'close-outline' : undefined} onRightIconPress={onClear} placeholder="Search chats, contacts..." containerStyle={styles.searchInputContainer} inputWrapperStyle={[
            styles.searchInputWrapper,
            styles.searchInputWrapperTheme,
            {
                borderRadius: 24,
                ...searchInputWrapperThemeStyle,
            },
        ]} inputStyle={styles.searchInput}/>
    </View>);
}
function ConversationRow({ item, onPress, }) {
    const { colors } = useTheme();
    const unreadCount = item.unreadCount ?? 0;
    const hasUnread = unreadCount > 0;
    const peerName = item.peer?.displayName ?? item.peerId;
    const timestampStyle = useMemo(() => ({
        color: hasUnread ? colors.accent : colors.textSecondary,
        fontFamily: hasUnread ? typography.fontFamily.semiBold : typography.fontFamily.regular,
    }), [colors.accent, colors.textSecondary, hasUnread]);
    const subtitleStyle = useMemo(() => ({
        color: hasUnread ? colors.textPrimary : colors.textSecondary,
        fontFamily: hasUnread ? typography.fontFamily.medium : typography.fontFamily.regular,
    }), [colors.textPrimary, colors.textSecondary, hasUnread]);
    return (<ListItem title={peerName} subtitle={Strings.chat.emptyChat} onPress={onPress} height={72} divider dividerInset={80} style={styles.listItemTransparent} accessibilityLabel={`Open chat with ${peerName}`} leading={<View>
          <Avatar uri={item.peer?.avatarUri} name={peerName} size="md" showOnlineBadge={false}/>
          {hasUnread ? (<Badge count={unreadCount} style={styles.floatingBadge}/>) : null}
        </View>} meta={item.lastMessageAt ? (<Text style={[
                styles.timestamp,
                timestampStyle,
            ]}>
            {formatMessageTime(item.lastMessageAt)}
          </Text>) : null} titleStyle={styles.conversationTitle} subtitleStyle={[
            styles.conversationSubtitle,
                subtitleStyle,
        ]}/>);
}
function EmptyState({ onPress }) {
    const { colors } = useTheme();
    const iconStyle = useMemo(() => ({
        backgroundColor: colors.surfaceMuted,
    }), [colors.surfaceMuted]);
    const titleStyle = useMemo(() => ({
        color: colors.textPrimary,
        fontFamily: typography.fontFamily.semiBold,
    }), [colors.textPrimary]);
    const subtitleStyle = useMemo(() => ({
        color: colors.textSecondary,
        fontFamily: typography.fontFamily.regular,
    }), [colors.textSecondary]);
    return (<View style={styles.emptyState}>
      <View style={[
            styles.emptyIcon,
            iconStyle,
        ]}>
        <Ionicons name="chatbubble-ellipses-outline" size={40} color={colors.textSecondary}/>
      </View>
      <Text style={[
            styles.emptyTitle,
            titleStyle,
        ]}>
        No chats yet
      </Text>
      <Text style={[
            styles.emptySubtitle,
            subtitleStyle,
        ]}>
        Add a contact to start a secure conversation.
      </Text>
      <Button text="Add chat" onPress={onPress} variant="primary" size="md" icon="add-outline"/>
    </View>);
}
function ChatListScreenInner() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { isDesktop, isTablet } = useResponsive();
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const listRef = useScrollToTop();
    const { data: liveConversations } = useLiveQuery(db.query.conversations.findMany({
        orderBy: desc(conversations.lastMessageAt),
        with: { peer: true },
    }));
    const storeChats = useMessagesStore((state) => state.chats);
    const allConversations = useMemo(() => {
        const base = (liveConversations ?? []);
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
                    lastMessageAt: chat.lastMessageAt ? new Date(chat.lastMessageAt) : null,
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
        return allConversations.filter((conversation) => conversation.peer?.displayName?.toLowerCase().includes(normalizedQuery) ||
            conversation.peerId.toLowerCase().includes(normalizedQuery));
    }, [allConversations, searchQuery]);
    const contentMaxWidth = isDesktop
        ? CHAT_LIST_MAX_WIDTH.desktop
        : isTablet
            ? CHAT_LIST_MAX_WIDTH.tablet
            : undefined;
    const navigateToContacts = useCallback(() => {
        router.push(ROUTES.TABS_CONTACTS);
    }, [router]);
    const renderItem = useCallback(({ item }) => (<ConversationRow item={item} onPress={() => router.push({
            pathname: '/chat/[peerId]',
            params: {
                peerId: item.peerId,
                conversationId: item.id,
                peerName: item.peer?.displayName ?? item.peerId,
                avatarUri: item.peer?.avatarUri ?? '',
            },
        })}/>), [router]);
    const listContentStyle = useMemo(() => ({
        paddingBottom: insets.bottom + spacing.xl,
    }), [insets.bottom]);
    const screenStyle = useMemo(() => ({
        backgroundColor: colors.background,
        paddingTop: insets.top,
    }), [colors.background, insets.top]);
    const contentShellStyle = useMemo(() => (contentMaxWidth
        ? [styles.contentShell, { maxWidth: contentMaxWidth }]
        : [styles.contentShell]), [contentMaxWidth]);
    return (<View style={[
            styles.screen,
            screenStyle,
        ]}>
      <View style={contentShellStyle}>
        <Header title="resonar" leftAccessory={<SonarXLogo size={33}/>} rightActions={[
            {
                icon: showSearch ? 'close-outline' : 'search-outline',
                onPress: () => {
                    if (showSearch) {
                        setSearchQuery('');
                    }
                    setShowSearch((prev) => !prev);
                },
                accessibilityLabel: showSearch ? 'Close search' : 'Search chats',
            },
        ]}/>

        {showSearch ? (<SearchBar value={searchQuery} onChangeText={setSearchQuery} onClear={() => setSearchQuery('')}/>) : null}

        {filteredConversations.length === 0 ? (<EmptyState onPress={navigateToContacts}/>) : (<FlatList ref={listRef} data={filteredConversations} keyExtractor={(item) => item.id} renderItem={renderItem} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={listContentStyle}/>)}
      </View>
    </View>);
}
export default function ChatListScreen() {
    return (<ChatListErrorBoundary>
      <ChatListScreenInner />
    </ChatListErrorBoundary>);
}
const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    contentShell: {
        flex: 1,
        width: '100%',
        alignSelf: 'center',
    },
    searchContainer: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
    },
    searchInputContainer: {
        marginBottom: 0,
    },
    searchInputWrapper: {
        minHeight: 44,
    },
    searchInput: {
        fontSize: 14,
    },
    searchInputWrapperTheme: {
        borderWidth: 1,
    },
    listItemTransparent: {
        backgroundColor: 'transparent',
    },
    conversationTitle: {
        fontSize: 16,
        lineHeight: 20,
    },
    conversationSubtitle: {
        fontSize: 13,
        lineHeight: 18,
    },
    timestamp: {
        ...typography.caption,
    },
    floatingBadge: {
        position: 'absolute',
        top: -2,
        right: -6,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xxxl,
        gap: spacing.md,
    },
    emptyIcon: {
        width: 88,
        height: 88,
        borderRadius: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        ...typography.h3,
        textAlign: 'center',
    },
    emptySubtitle: {
        ...typography.body,
        textAlign: 'center',
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        ...typography.body,
    },
});
