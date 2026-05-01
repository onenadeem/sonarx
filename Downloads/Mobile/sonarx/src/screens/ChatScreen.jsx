import { useCallback, useEffect, useMemo, useRef, useState, } from 'react'
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable as RNPressable, StyleSheet, Text, TouchableWithoutFeedback, View, } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import * as SecureStore from 'expo-secure-store';
import { decodeBase64 } from 'tweetnacl-util';
import { and, eq, ne } from 'drizzle-orm';
import { db } from '@/db/client';
import { messages as messagesTable } from '@/db/schema';
import { insertMessage } from '@/db/queries';
import { getOrCreateConversation } from '@/db/queries';
import { useMessages } from '@/lib/hooks/useMessages';
import { useIdentityStore } from '@/stores/identity.store';
import { sendGunMessage } from '@/lib/p2p/messaging';
import Header from '@/src/components/ui/Header';
import { useTheme } from '@/src/theme/ThemeProvider';
import { borderRadius, shadows, spacing, typography } from '@/src/theme/tokens';
import { Strings } from '@/src/constants/strings';
import { HEADER_HEIGHT, NEAR_BOTTOM_THRESHOLD, } from '@/src/constants/layout';
import { formatMessageTime } from '@/src/utils/formatTime';
import { groupMessagesByDate } from '@/src/utils/groupMessages';
import Avatar from '@/src/components/ui/Avatar';
import AppChatBubble from '@/src/components/ui/ChatBubble';
import AppMessageInput from '@/src/components/ui/MessageInput';
import AnimatedPressable from '@/src/components/ui/Pressable';
import MessageStatus from '@/src/components/chat/MessageStatus';
import TypingIndicator from '@/src/components/chat/TypingIndicator';
import ReactionBar from '@/src/components/chat/ReactionBar';
import AttachmentPreview from '@/src/components/chat/AttachmentPreview';
import { usePresence } from '@/src/hooks/usePresence';
import { useResponsive } from '@/src/hooks/useResponsive';
import { useSendTypingIndicator, useTypingIndicator, } from '@/src/hooks/useTypingIndicator';
// ─── Constants ────────────────────────────────────────────────────────────────
const SECRET_KEY_STORE_KEY = 'sonarx-secret-keys';
// ─── DateSeparator ────────────────────────────────────────────────────────────
function DateSeparator({ label }) {
    const { colors } = useTheme();
    return (<View style={styles.separatorRow}>
      <View style={[
            styles.separatorPill,
            { backgroundColor: colors.surfaceMuted },
        ]}>
        <Text style={[
            styles.separatorText,
            {
                color: colors.textSecondary,
                fontFamily: typography.fontFamily.medium,
            },
        ]}>
          {label}
        </Text>
      </View>
    </View>);
}
// ─── NewMessagesDivider ───────────────────────────────────────────────────────
function NewMessagesDivider() {
    const { colors } = useTheme();
    return (<View style={styles.newMsgDividerRow}>
      <View style={[styles.newMsgDividerLine, { backgroundColor: colors.accent }]}/>
      <Text style={[
            styles.newMsgDividerLabel,
            { color: colors.accent, fontFamily: typography.fontFamily.semiBold },
        ]}>
        {Strings.chat.newMessages}
      </Text>
      <View style={[styles.newMsgDividerLine, { backgroundColor: colors.accent }]}/>
    </View>);
}
// ─── ChatBubble ───────────────────────────────────────────────────────────────
function ChatBubble({ message, isFromMe, onLongPress, replyToMessage, onReplyTap, groupedWithPrevious = false, groupedWithNext = false, }) {
    const handleLongPress = useCallback((e) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onLongPress(message.id, {
            x: e.nativeEvent.pageX,
            y: e.nativeEvent.pageY,
        });
    }, [message.id, onLongPress]);
    if (message.isDeleted) {
        return (<AppChatBubble fromMe={isFromMe} text="This message was deleted" deleted onLongPress={handleLongPress} groupedWithPrevious={groupedWithPrevious} groupedWithNext={groupedWithNext}/>);
    }
    const displayStatus = message.status === 'failed' ? 'sent' : message.status;
    return (<AppChatBubble fromMe={isFromMe} text={message.body ?? ''} timestamp={formatMessageTime(message.sentAt)} onLongPress={handleLongPress} groupedWithPrevious={groupedWithPrevious} groupedWithNext={groupedWithNext} replyPreview={replyToMessage != null
            ? {
                text: replyToMessage.body ?? '',
                onPress: () => onReplyTap?.(replyToMessage.id),
            }
            : undefined} footer={isFromMe ? <MessageStatus status={displayStatus} size={12}/> : null}/>);
}
function InputBar({ onSend, onAttachmentPress, disabled = false, onTypingChange, replyTo, onCancelReply, }) {
    const [text, setText] = useState('');
    const handleSend = useCallback(() => {
        const trimmed = text.trim();
        if (!trimmed || disabled)
            return;
        onSend(trimmed);
        setText('');
    }, [text, disabled, onSend]);
    return (<AppMessageInput value={text} onChangeText={(value) => {
            setText(value);
            onTypingChange();
        }} onSend={handleSend} onAttachmentPress={onAttachmentPress} disabled={disabled} placeholder={Strings.chat.placeholder} replyText={replyTo?.body ?? null} onCancelReply={onCancelReply}/>);
}
function ContextMenu({ state, onCopy, onReply, onDelete, onDismiss, }) {
    const { colors } = useTheme();
    if (!state.visible)
        return null;
    const actions = [
        {
            label: Strings.common.copy,
            icon: 'copy-outline',
            onPress: onCopy,
        },
        {
            label: Strings.common.reply,
            icon: 'arrow-undo-outline',
            onPress: onReply,
        },
        ...(state.isFromMe
            ? [
                {
                    label: Strings.common.delete,
                    icon: 'trash-outline',
                    onPress: onDelete,
                    destructive: true,
                },
            ]
            : []),
    ];
    return (<Modal transparent animationType="fade" visible={state.visible} onRequestClose={onDismiss} statusBarTranslucent>
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={[styles.ctxOverlay, { backgroundColor: colors.overlay }]}>
          <TouchableWithoutFeedback>
            <View style={[
            styles.ctxMenu,
            {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
            },
        ]}>
              {actions.map((action, idx) => (<RNPressable key={action.label} onPress={() => {
                onDismiss();
                action.onPress();
            }} style={({ pressed }) => [
                styles.ctxItem,
                idx < actions.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                },
                pressed && { backgroundColor: colors.surfaceMuted },
            ]}>
                  <Ionicons name={action.icon} size={18} color={action.destructive ? colors.danger : colors.textPrimary}/>
                  <Text style={[
                styles.ctxLabel,
                {
                    color: action.destructive
                        ? colors.danger
                        : colors.textPrimary,
                    fontFamily: typography.fontFamily.medium,
                },
            ]}>
                    {action.label}
                  </Text>
                </RNPressable>))}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>);
}
function NewMessagePill({ visible, onPress }) {
    const { colors } = useTheme();
    if (!visible)
        return null;
    return (<View style={styles.newMsgPillWrapper}>
      <AnimatedPressable onPress={onPress} haptic style={[styles.newMsgPill, { backgroundColor: colors.accent }]}>
        <Text style={[
            styles.newMsgPillText,
            { fontFamily: typography.fontFamily.semiBold },
        ]}>
          {Strings.chat.newMessagePill}
        </Text>
      </AnimatedPressable>
    </View>);
}
// ─── ChatScreen ───────────────────────────────────────────────────────────────
export default function ChatScreen() {
    const { peerId } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const { isDesktop, isTablet } = useResponsive();
    const identity = useIdentityStore((state) => state.identity);
    // ── State ─────────────────────────────────────────────────────────────────
    const [conversationId, setConversationId] = useState(null);
    const [peer, setPeer] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [replyToMessage, setReplyToMessage] = useState(null);
    const [pendingAttachments, setPendingAttachments] = useState([]);
    const [showNewMessagePill, setShowNewMessagePill] = useState(false);
    const [lastSeenTimestamp, setLastSeenTimestamp] = useState(null);
    const [reactionTarget, setReactionTarget] = useState(null);
    const [reactionPosition] = useState({ x: 0, y: 0 });
    const [contextMenu, setContextMenu] = useState({
        visible: false,
        messageId: '',
        messageBody: '',
        position: { x: 0, y: 0 },
        isFromMe: false,
    });
    // ── Refs ──────────────────────────────────────────────────────────────────
    const flashListRef = useRef(null);
    const isAtBottomRef = useRef(true);
    const prevMsgCountRef = useRef(0);
    // ── Data ──────────────────────────────────────────────────────────────────
    const { messages } = useMessages(conversationId);
    const { isOnline, statusText } = usePresence(peerId);
    const { isTyping } = useTypingIndicator(peerId);
    const { onTypingStart } = useSendTypingIndicator(peerId);
    // ── Init conversation & peer ──────────────────────────────────────────────
    useEffect(() => {
        if (!peerId)
            return;
        getOrCreateConversation(peerId)
            .then((conv) => setConversationId(conv.id))
            .catch(console.error);
        db.query.peers
            .findFirst({ where: (p, { eq }) => eq(p.id, peerId) })
            .then((p) => setPeer(p ?? null))
            .catch(console.error);
    }, [peerId]);
    // ── Mark messages as read on focus ────────────────────────────────────────
    useFocusEffect(useCallback(() => {
        if (!conversationId || !identity?.phoneNumber)
            return;
        db.update(messagesTable)
            .set({ status: 'read', readAt: new Date() })
            .where(and(eq(messagesTable.conversationId, conversationId), ne(messagesTable.peerId, identity.phoneNumber), ne(messagesTable.status, 'read')))
            .catch(console.error);
    }, [conversationId, identity?.phoneNumber]));
    // ── New message pill detection ────────────────────────────────────────────
    useEffect(() => {
        const curr = messages.length;
        if (curr > prevMsgCountRef.current && !isAtBottomRef.current) {
            if (lastSeenTimestamp === null && messages[0]) {
                setLastSeenTimestamp(messages[0].sentAt);
            }
            setShowNewMessagePill(true);
        }
        prevMsgCountRef.current = curr;
    }, [messages]);
    // ── Scroll to bottom on initial load ─────────────────────────────────────
    useEffect(() => {
        if (messages.length > 0 && conversationId) {
            setTimeout(() => {
                flashListRef.current?.scrollToOffset({ offset: 0, animated: false });
            }, 100);
        }
    }, [conversationId]);
    // ── List items ───────────────────────────────────────────────────────────
    const listItems = useMemo(() => {
        if (messages.length === 0)
            return [];
        const groups = groupMessagesByDate(messages);
        const items = [];
        let dividerInserted = false;
        for (const group of groups) {
            for (const msg of group.messages) {
                if (showNewMessagePill &&
                    !dividerInserted &&
                    lastSeenTimestamp !== null &&
                    msg.sentAt <= lastSeenTimestamp) {
                    items.push({ kind: 'newMessageDivider', id: 'new-msg-divider' });
                    dividerInserted = true;
                }
                items.push({ kind: 'message', message: msg, id: msg.id });
            }
            items.push({
                kind: 'separator',
                label: group.dateLabel,
                id: `sep-${group.dateLabel}-${group.date.getTime()}`,
            });
        }
        return items;
    }, [messages, showNewMessagePill, lastSeenTimestamp]);
    // ── Messages by ID map ────────────────────────────────────────────────────
    const messagesById = useMemo(() => {
        const map = new Map();
        messages.forEach((m) => map.set(m.id, m));
        return map;
    }, [messages]);
    // ── Handlers ─────────────────────────────────────────────────────────────
    const scrollToBottom = useCallback(() => {
        flashListRef.current?.scrollToOffset({ offset: 0, animated: true });
        setShowNewMessagePill(false);
        setLastSeenTimestamp(null);
    }, []);
    const handleScroll = useCallback((e) => {
        const y = e.nativeEvent.contentOffset.y;
        isAtBottomRef.current = y < NEAR_BOTTOM_THRESHOLD;
        if (isAtBottomRef.current) {
            setShowNewMessagePill(false);
            setLastSeenTimestamp(null);
        }
    }, []);
    const handleSend = useCallback(async (text) => {
        if (!identity || !conversationId || !peerId)
            return;
        setIsSending(true);
        try {
            const msgId = crypto.randomUUID();
            await insertMessage({
                id: msgId,
                conversationId,
                peerId: identity.phoneNumber,
                type: 'text',
                body: text,
                status: 'sending',
                replyToId: replyToMessage?.id ?? null,
            });
            const peerRow = await db.query.peers.findFirst({
                where: (p, { eq }) => eq(p.id, peerId),
            });
            if (peerRow) {
                const secretKeyStr = await SecureStore.getItemAsync(SECRET_KEY_STORE_KEY);
                if (secretKeyStr) {
                    const mySecretKey = decodeBase64(secretKeyStr);
                    const peerPublicKey = decodeBase64(peerRow.publicKey);
                    await sendGunMessage(peerId, msgId, text, peerPublicKey, mySecretKey, identity.phoneNumber);
                    await db
                        .update(messagesTable)
                        .set({ status: 'sent' })
                        .where(eq(messagesTable.id, msgId));
                }
            }
            setReplyToMessage(null);
            if (pendingAttachments.length > 0)
                setPendingAttachments([]);
            setTimeout(() => flashListRef.current?.scrollToOffset({ offset: 0, animated: true }), 50);
        }
        catch (e) {
            console.error('[ChatScreen] handleSend error:', e);
        }
        finally {
            setIsSending(false);
        }
    }, [identity, conversationId, peerId, replyToMessage, pendingAttachments]);
    const handleBubbleLongPress = useCallback((messageId, position) => {
        const msg = messagesById.get(messageId);
        if (!msg)
            return;
        const fromMe = msg.peerId === identity?.phoneNumber;
        setContextMenu({
            visible: true,
            messageId,
            messageBody: msg.body ?? '',
            position,
            isFromMe: fromMe,
        });
    }, [messagesById, identity?.phoneNumber]);
    const handleContextCopy = useCallback(async () => {
        await Clipboard.setStringAsync(contextMenu.messageBody);
    }, [contextMenu.messageBody]);
    const handleContextReply = useCallback(() => {
        const msg = messagesById.get(contextMenu.messageId);
        if (msg)
            setReplyToMessage(msg);
    }, [contextMenu.messageId, messagesById]);
    const handleContextDelete = useCallback(async () => {
        if (!conversationId)
            return;
        await db
            .update(messagesTable)
            .set({ isDeleted: true, body: null })
            .where(eq(messagesTable.id, contextMenu.messageId))
            .catch(console.error);
    }, [contextMenu.messageId, conversationId]);
    const handleReplyTap = useCallback((messageId) => {
        const idx = listItems.findIndex((item) => item.kind === 'message' && item.message.id === messageId);
        if (idx >= 0) {
            flashListRef.current?.scrollToIndex({ index: idx, animated: true });
        }
    }, [listItems]);
    const handleCamera = useCallback(async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'Camera access is needed.');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images', 'videos'],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            setPendingAttachments((prev) => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    uri: asset.uri,
                    type: 'image',
                    name: asset.fileName ?? 'photo',
                },
            ]);
        }
    }, []);
    const handlePhotoLibrary = useCallback(async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'Photo library access is needed.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsMultipleSelection: true,
            quality: 0.8,
        });
        if (!result.canceled) {
            const newItems = result.assets.map((asset) => ({
                id: crypto.randomUUID(),
                uri: asset.uri,
                type: 'image',
                name: asset.fileName ?? 'photo',
                size: asset.fileSize,
            }));
            setPendingAttachments((prev) => [...prev, ...newItems]);
        }
    }, []);
    const handleDocument = useCallback(async () => {
        const result = await DocumentPicker.getDocumentAsync({
            copyToCacheDirectory: true,
            multiple: false,
        });
        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            setPendingAttachments((prev) => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    uri: asset.uri,
                    type: 'document',
                    name: asset.name,
                    size: asset.size,
                },
            ]);
        }
    }, []);
    const handleAttachmentPress = useCallback(() => {
        Alert.alert('Add Attachment', undefined, [
            { text: Strings.attachments.camera, onPress: handleCamera },
            { text: Strings.attachments.photoLibrary, onPress: handlePhotoLibrary },
            { text: Strings.attachments.document, onPress: handleDocument },
            { text: Strings.attachments.audio, onPress: () => { } },
            { text: Strings.common.cancel, style: 'cancel' },
        ]);
    }, [handleCamera, handlePhotoLibrary, handleDocument]);
    // ── Render helpers ────────────────────────────────────────────────────────
    const keyExtractor = useCallback((item) => item.id, []);
    const renderItem = useCallback(({ item, index }) => {
        if (item.kind === 'separator') {
            return <DateSeparator label={item.label}/>;
        }
        if (item.kind === 'newMessageDivider') {
            return <NewMessagesDivider />;
        }
        const msg = item.message;
        const fromMe = msg.peerId === identity?.phoneNumber;
        const replyTo = msg.replyToId
            ? (messagesById.get(msg.replyToId) ?? null)
            : null;
        const previousItem = listItems[index - 1];
        const nextItem = listItems[index + 1];
        const previousMessage = previousItem?.kind === 'message' ? previousItem.message : null;
        const nextMessage = nextItem?.kind === 'message' ? nextItem.message : null;
        return (<ChatBubble message={msg} isFromMe={fromMe} onLongPress={handleBubbleLongPress} replyToMessage={replyTo} onReplyTap={handleReplyTap} groupedWithPrevious={previousMessage?.peerId === msg.peerId} groupedWithNext={nextMessage?.peerId === msg.peerId}/>);
    }, [
        identity?.phoneNumber,
        listItems,
        messagesById,
        handleBubbleLongPress,
        handleReplyTap,
    ]);
    const EmptyComponent = useMemo(() => (<View style={styles.emptyWrapper}>
        <Text style={[
            styles.emptyTitle,
            {
                color: colors.textSecondary,
                fontFamily: typography.fontFamily.medium,
            },
        ]}>
          {Strings.chat.emptyChat}
        </Text>
        <Text style={[
            styles.emptySub,
            {
                color: colors.textDisabled,
                fontFamily: typography.fontFamily.regular,
            },
        ]}>
          {Strings.chat.emptyChatSub}
        </Text>
      </View>), [colors]);
    const contentMaxWidth = isDesktop ? 960 : isTablet ? 680 : undefined;
    // ── Render ────────────────────────────────────────────────────────────────
    return (<View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[
            styles.contentShell,
            contentMaxWidth ? { maxWidth: contentMaxWidth } : null,
        ]}>
        <View style={{ height: insets.top, backgroundColor: colors.headerBackground }}/>

        <Header title={peer?.displayName ?? peerId ?? 'Chat'} subtitle={statusText} leftAccessory={<View style={styles.headerLead}>
              <AnimatedPressable onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Go back">
                <Ionicons name="chevron-back" size={22} color={colors.textPrimary}/>
              </AnimatedPressable>
              <Avatar name={peer?.displayName ?? peerId ?? '?'} uri={peer?.avatarUri} size="xs" showOnlineBadge isOnline={isOnline}/>
            </View>} rightActions={[
            {
                icon: 'videocam-outline',
                onPress: () => router.push(`/call/${peerId}?video=true`),
                accessibilityLabel: 'Video call',
            },
            {
                icon: 'call-outline',
                onPress: () => router.push(`/call/${peerId}`),
                accessibilityLabel: 'Voice call',
            },
        ]}/>

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + HEADER_HEIGHT : 0}>
          <View style={[styles.flex, { backgroundColor: colors.chatBackground }]}>
            <FlatList ref={flashListRef} data={listItems} keyExtractor={keyExtractor} renderItem={renderItem} inverted overScrollMode="never" onScroll={handleScroll} scrollEventThrottle={16} contentContainerStyle={styles.listContent} ListEmptyComponent={EmptyComponent} ListFooterComponent={<TypingIndicator visible={isTyping}/>} removeClippedSubviews={Platform.OS === 'android'} maxToRenderPerBatch={20} windowSize={10}/>

            <NewMessagePill visible={showNewMessagePill} onPress={scrollToBottom}/>
          </View>

          <AttachmentPreview attachments={pendingAttachments} onRemove={(id) => setPendingAttachments((prev) => prev.filter((attachment) => attachment.id !== id))}/>

          <View style={{ paddingBottom: insets.bottom }}>
            <InputBar onSend={handleSend} onAttachmentPress={handleAttachmentPress} disabled={isSending || !conversationId} onTypingChange={onTypingStart} replyTo={replyToMessage} onCancelReply={() => setReplyToMessage(null)}/>
          </View>
        </KeyboardAvoidingView>
      </View>

      {/* Reaction bar */}
      <ReactionBar messageId={reactionTarget ?? ''} visible={reactionTarget !== null} onReact={(emoji) => {
            console.log('React:', reactionTarget, emoji);
            setReactionTarget(null);
        }} onDismiss={() => setReactionTarget(null)} position={reactionPosition}/>

      {/* Context menu */}
      <ContextMenu state={contextMenu} onCopy={handleContextCopy} onReply={handleContextReply} onDelete={handleContextDelete} onDismiss={() => setContextMenu((prev) => ({ ...prev, visible: false }))}/>
    </View>);
}
// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    contentShell: {
        flex: 1,
        width: '100%',
        alignSelf: 'center',
    },
    flex: {
        flex: 1,
    },
    headerLead: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    backButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Header
    header: {
        height: HEADER_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.xs,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backBtn: {
        paddingHorizontal: spacing.xs,
        paddingVertical: spacing.xxs,
    },
    headerCenter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        overflow: 'hidden',
        marginLeft: spacing.xs,
    },
    headerTitles: {
        flex: 1,
        overflow: 'hidden',
    },
    headerName: {
        fontSize: typography.fontSize.md,
        fontWeight: typography.fontWeight.semiBold,
        letterSpacing: -0.1,
    },
    headerSub: {
        fontSize: typography.fontSize.xs,
        marginTop: 1,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingRight: spacing.xs,
    },
    headerActionBtn: {
        padding: spacing.xs,
    },
    // Message list
    listContent: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.xs,
        paddingBottom: spacing.md,
    },
    // Empty state
    emptyWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xxl,
        paddingTop: spacing.xxl,
    },
    emptyTitle: {
        fontSize: typography.fontSize.md,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    emptySub: {
        fontSize: typography.fontSize.sm,
        textAlign: 'center',
        lineHeight: typography.fontSize.sm * 1.5,
    },
    // Date separator
    separatorRow: {
        alignItems: 'center',
        marginVertical: spacing.sm,
    },
    separatorPill: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xxs,
        borderRadius: borderRadius.pill,
    },
    separatorText: {
        fontSize: typography.fontSize.xs,
    },
    // New messages divider
    newMsgDividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        gap: spacing.xs,
    },
    newMsgDividerLine: {
        flex: 1,
        height: StyleSheet.hairlineWidth,
        opacity: 0.6,
    },
    newMsgDividerLabel: {
        fontSize: typography.fontSize.xs,
    },
    // Bubble
    bubbleWrapper: {
        marginVertical: 2,
        maxWidth: '85%',
        paddingHorizontal: spacing.xxs,
    },
    wrapperRight: {
        alignSelf: 'flex-end',
    },
    wrapperLeft: {
        alignSelf: 'flex-start',
    },
    bubble: {
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 6,
        borderRadius: 18,
    },
    bubbleOutgoing: {
        borderBottomRightRadius: 6,
    },
    bubbleIncoming: {
        borderBottomLeftRadius: 6,
    },
    messageText: {
        fontSize: typography.fontSize.md,
        lineHeight: typography.fontSize.md * 1.4,
    },
    bubbleFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: spacing.xxs,
        gap: spacing.xxs,
    },
    timeText: {
        fontSize: typography.fontSize.xs,
    },
    deletedBubble: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.lg,
        borderWidth: StyleSheet.hairlineWidth,
    },
    deletedText: {
        fontSize: typography.fontSize.sm,
        fontStyle: 'italic',
    },
    replyPreview: {
        borderLeftWidth: 3,
        paddingLeft: spacing.xs,
        paddingVertical: spacing.xxs,
        marginBottom: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    replyText: {
        fontSize: typography.fontSize.sm,
        lineHeight: typography.fontSize.sm * 1.4,
    },
    // Input bar
    inputBarOuter: {
        borderTopWidth: 0,
        paddingTop: spacing.xs,
        paddingBottom: spacing.xs,
        paddingHorizontal: spacing.sm,
    },
    replyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: spacing.xs,
        marginBottom: spacing.xs,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderLeftWidth: 3,
        borderRadius: borderRadius.sm,
        gap: spacing.xs,
    },
    replyBannerText: {
        flex: 1,
        fontSize: typography.fontSize.sm,
    },
    inputBarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    inputIconBtn: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textInput: {
        flex: 1,
        maxHeight: 120,
        minHeight: 36,
        borderRadius: 18,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        fontSize: typography.fontSize.md,
        lineHeight: typography.fontSize.md * 1.4,
    },
    sendBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // New message pill
    newMsgPillWrapper: {
        position: 'absolute',
        bottom: spacing.md,
        alignSelf: 'center',
    },
    newMsgPill: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.pill,
        ...shadows.md,
    },
    newMsgPillText: {
        fontSize: typography.fontSize.sm,
        color: '#ffffff',
    },
    // Context menu
    ctxOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ctxMenu: {
        borderRadius: borderRadius.md,
        borderWidth: StyleSheet.hairlineWidth,
        minWidth: 180,
        overflow: 'hidden',
    },
    ctxItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        gap: spacing.sm,
    },
    ctxLabel: {
        fontSize: typography.fontSize.md,
    },
});
