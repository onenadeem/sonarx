import { useCallback, useEffect, useMemo, useRef, useState, } from 'react'
import { Alert, FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable as RNPressable, StyleSheet, Text, TouchableWithoutFeedback, useWindowDimensions, View, } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
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
import { HEADER_HEIGHT, NEAR_BOTTOM_THRESHOLD, CHAT_SCREEN_MAX_WIDTH, } from '@/src/constants/layout';
import { Strings } from '@/src/constants/strings';
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
const INPUT_BAR_EXTRA_BOTTOM_PADDING = 10;
const EDGE_FADE_HEIGHT = 36;
const ANDROID_KEYBOARD_CLEARANCE = 28;
const ANDROID_NAV_BAR_CLEARANCE = 14;
const hexToRgba = (hex, alpha) => {
    const normalized = hex.replace('#', '');
    if (normalized.length !== 6) {
        return alpha === 0 ? 'transparent' : hex;
    }
    const value = Number.parseInt(normalized, 16);
    const red = (value >> 16) & 255;
    const green = (value >> 8) & 255;
    const blue = value & 255;
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};
// ─── DateSeparator ────────────────────────────────────────────────────────────
function DateSeparator({ label }) {
    const { colors } = useTheme();
    const separatorPillStyle = useMemo(() => ([
        styles.separatorPill,
        { backgroundColor: colors.surfaceMuted },
    ]), [colors.surfaceMuted]);
    const separatorTextStyle = useMemo(() => ([
        styles.separatorText,
        { color: colors.textSecondary, fontFamily: typography.fontFamily.medium },
    ]), [colors.textSecondary]);
    return (<View style={styles.separatorRow}>
      <View style={separatorPillStyle}>
        <Text style={separatorTextStyle}>
          {label}
        </Text>
      </View>
    </View>);
}
// ─── NewMessagesDivider ───────────────────────────────────────────────────────
function NewMessagesDivider() {
    const { colors } = useTheme();
    const dividerLineStyle = useMemo(() => ([
        styles.newMsgDividerLine,
        { backgroundColor: colors.accent },
    ]), [colors.accent]);
    const dividerLabelStyle = useMemo(() => ([
        styles.newMsgDividerLabel,
        { color: colors.accent, fontFamily: typography.fontFamily.semiBold },
    ]), [colors.accent]);
    return (<View style={styles.newMsgDividerRow}>
      <View style={dividerLineStyle}/>
      <Text style={dividerLabelStyle}>
        {Strings.chat.newMessages}
      </Text>
      <View style={dividerLineStyle}/>
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
    const displayStatus = message.readAt
        ? 'read'
        : message.deliveredAt
            ? 'delivered'
            : message.status === 'failed'
                ? 'sent'
                : message.status;
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
    const overlayStyle = useMemo(() => ({
        backgroundColor: colors.overlay,
    }), [colors.overlay]);
    const menuStyle = useMemo(() => ({
        backgroundColor: colors.surfaceElevated,
        borderColor: colors.border,
    }), [colors.surfaceElevated, colors.border]);
    const dividerStyle = useMemo(() => ({
        borderBottomColor: colors.border,
    }), [colors.border]);
    const pressedItemStyle = useMemo(() => ({
        backgroundColor: colors.surfaceMuted,
    }), [colors.surfaceMuted]);
    const itemStyle = useCallback((idx) => {
        const isLastItem = idx < actions.length - 1;
        return [
            styles.ctxItem,
            isLastItem && [
                styles.ctxItemDivider,
                dividerStyle,
            ],
        ];
    }, [actions.length, dividerStyle]);
    const resolveLabelStyle = useCallback((isDestructive) => ({
        color: isDestructive ? colors.danger : colors.textPrimary,
        fontFamily: typography.fontFamily.medium,
    }), [colors.danger, colors.textPrimary]);
    return (<Modal transparent animationType="fade" visible={state.visible} onRequestClose={onDismiss} statusBarTranslucent>
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={[styles.ctxOverlay, overlayStyle]}>
          <TouchableWithoutFeedback>
            <View style={[styles.ctxMenu, menuStyle]}>
              {actions.map((action, idx) => (<RNPressable key={action.label} onPress={() => {
                onDismiss();
                action.onPress();
            }} style={({ pressed }) => [
                itemStyle(idx),
                pressed && pressedItemStyle,
            ]}>
                  <Ionicons name={action.icon} size={18} color={action.destructive ? colors.danger : colors.textPrimary}/>
                  <Text style={resolveLabelStyle(action.destructive)}>
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
    const newMessagePillStyle = useMemo(() => ([styles.newMsgPill, {
            backgroundColor: colors.accent,
        }]), [colors.accent]);
    return (<View style={styles.newMsgPillWrapper}>
      <AnimatedPressable onPress={onPress} haptic style={newMessagePillStyle}>
        <Text style={styles.newMsgPillText}>
          {Strings.chat.newMessagePill}
        </Text>
      </AnimatedPressable>
    </View>);
}
// ─── ChatScreen ───────────────────────────────────────────────────────────────
export default function ChatScreen() {
    const {
        peerId,
        conversationId: initialConversationId,
        peerName: initialPeerName,
        avatarUri: initialAvatarUri,
    } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { height: windowHeight } = useWindowDimensions();
    const { colors } = useTheme();
    const { isDesktop, isTablet } = useResponsive();
    const identity = useIdentityStore((state) => state.identity);
    // ── State ─────────────────────────────────────────────────────────────────
    const [conversationId, setConversationId] = useState(typeof initialConversationId === 'string' ? initialConversationId : null);
    const [peer, setPeer] = useState(() => {
        if (typeof initialPeerName !== 'string') {
            return null;
        }
        return {
            id: peerId,
            displayName: initialPeerName,
            avatarUri: typeof initialAvatarUri === 'string' && initialAvatarUri.length > 0 ? initialAvatarUri : null,
        };
    });
    const [isSending, setIsSending] = useState(false);
    const [replyToMessage, setReplyToMessage] = useState(null);
    const [pendingAttachments, setPendingAttachments] = useState([]);
    const [showNewMessagePill, setShowNewMessagePill] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
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
    const maxWindowHeightRef = useRef(windowHeight);
    // ── Data ──────────────────────────────────────────────────────────────────
    const { messages } = useMessages(conversationId);
  const { isOnline, statusText } = usePresence(peerId);
    const { isTyping } = useTypingIndicator(peerId);
    const { onTypingStart } = useSendTypingIndicator(peerId);
    useEffect(() => {
        if (!keyboardVisible || windowHeight > maxWindowHeightRef.current) {
            maxWindowHeightRef.current = windowHeight;
        }
    }, [keyboardVisible, windowHeight]);
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const showSub = Keyboard.addListener(showEvent, (event) => {
            setKeyboardVisible(true);
            setKeyboardHeight(event.endCoordinates?.height ?? 0);
        });
        const hideSub = Keyboard.addListener(hideEvent, () => {
            setKeyboardVisible(false);
            setKeyboardHeight(0);
        });
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);
    // ── Init conversation & peer ──────────────────────────────────────────────
    useEffect(() => {
        if (!peerId)
            return;
        let isMounted = true;
        getOrCreateConversation(peerId)
            .then((conv) => {
            if (isMounted) {
                setConversationId(conv.id);
            }
        })
            .catch(console.error);
        db.query.peers
            .findFirst({ where: (p, { eq }) => eq(p.id, peerId) })
            .then((p) => {
            if (isMounted) {
                setPeer(p ?? null);
            }
        })
            .catch(console.error);
        return () => {
            isMounted = false;
        };
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
    const emptyTitleStyle = useMemo(() => ([
        styles.emptyTitle,
        {
            color: colors.textSecondary,
            fontFamily: typography.fontFamily.medium,
        },
    ]), [colors.textSecondary]);
    const emptySubStyle = useMemo(() => ([
        styles.emptySub,
        {
            color: colors.textDisabled,
            fontFamily: typography.fontFamily.regular,
        },
    ]), [colors.textDisabled]);
    const EmptyComponent = useMemo(() => (<View style={styles.emptyWrapper}>
        <Text style={emptyTitleStyle}>
          {Strings.chat.emptyChat}
        </Text>
        <Text style={emptySubStyle}>
          {Strings.chat.emptyChatSub}
        </Text>
      </View>), [emptyTitleStyle, emptySubStyle]);
    const contentMaxWidth = isDesktop
        ? CHAT_SCREEN_MAX_WIDTH.desktop
        : isTablet
            ? CHAT_SCREEN_MAX_WIDTH.tablet
            : undefined;
    const screenStyle = useMemo(() => ({
        backgroundColor: colors.background,
    }), [colors.background]);
    const contentShellStyle = useMemo(() => (contentMaxWidth ? [
            styles.contentShell,
            { maxWidth: contentMaxWidth },
        ] : [styles.contentShell]), [contentMaxWidth]);
  const isOffline = statusText === 'Connecting...';
  const contactStatusText = useMemo(() => isOffline ? 'Offline' : statusText, [isOffline, statusText]);
  const peerDisplayName = peer?.displayName ?? peerId ?? 'Chat';
  const peerAvatarLabel = peer?.displayName ?? peerId ?? '?';
    const headerPillHeight = 45;
    const headerSidePillPadding = 10;
  const headerCenterPillMaxWidth = '60%';
    const headerContainerStyle = useMemo(() => ({
        backgroundColor: colors.surface,
        borderColor: colors.border,
        height: headerPillHeight,
        minHeight: headerPillHeight,
    }), [colors.border, colors.surface]);
    const headerTitleStyle = useMemo(() => ({
        color: colors.textPrimary,
        fontFamily: typography.fontFamily.semiBold,
        fontSize: typography.fontSize.md,
    }), [colors.textPrimary]);
  const headerStatusStyle = useMemo(() => ({
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.regular,
    fontSize: 10,
    lineHeight: 12,
    marginTop: 1,
  }), [colors.textSecondary]);
  const headerActionButtonStyle = useMemo(() => ({
        width: 35,
        height: 35,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        borderRadius: 17.5,
    }), [colors.border, colors.surface]);
    const headerSpacerStyle = useMemo(() => ({
        height: insets.top,
        backgroundColor: 'transparent',
    }), [insets.top]);
    const chatBackgroundStyle = useMemo(() => ({
        backgroundColor: colors.headerBackground,
    }), [colors.headerBackground]);
    const headerFadeColors = useMemo(() => [
        hexToRgba(colors.headerBackground, 1),
        hexToRgba(colors.headerBackground, 0),
    ], [colors.headerBackground]);
    const inputFadeColors = useMemo(() => [
        hexToRgba(colors.headerBackground, 0),
        hexToRgba(colors.headerBackground, 1),
    ], [colors.headerBackground]);
    const keyboardAvoidingOffset = useMemo(() => (Platform.OS === 'ios'
        ? insets.top + HEADER_HEIGHT
        : 0), [insets.top]);
    const androidKeyboardFallbackPadding = useMemo(() => {
        if (Platform.OS !== 'android' || !keyboardVisible || keyboardHeight <= 0) {
            return 0;
        }
        const resizedAmount = Math.max(maxWindowHeightRef.current - windowHeight, 0);
        const nativeResizeActive = resizedAmount > Math.min(keyboardHeight * 0.4, 140);
        return nativeResizeActive ? 0 : keyboardHeight + ANDROID_KEYBOARD_CLEARANCE;
    }, [keyboardHeight, keyboardVisible, windowHeight]);
    const inputBarPaddingStyle = useMemo(() => ({
        paddingBottom: Platform.OS === 'ios'
            ? insets.bottom + INPUT_BAR_EXTRA_BOTTOM_PADDING
            : androidKeyboardFallbackPadding + INPUT_BAR_EXTRA_BOTTOM_PADDING + (keyboardVisible ? 0 : ANDROID_NAV_BAR_CLEARANCE),
        backgroundColor: 'transparent',
    }), [androidKeyboardFallbackPadding, insets.bottom, keyboardVisible]);
    // ── Render ────────────────────────────────────────────────────────────────
    return (<View style={[styles.screen, screenStyle]}>
      <View style={contentShellStyle}>
        <View style={styles.headerFadeArea}>
          <LinearGradient pointerEvents="none" colors={headerFadeColors} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill}/>
          <View style={headerSpacerStyle}/>

          <Header title="" style={styles.transparentHeader} leftAccessory={<View style={[styles.headerPill, headerContainerStyle, { paddingHorizontal: headerSidePillPadding }]}>
              <AnimatedPressable onPress={() => router.back()} style={[styles.headerIconCircle, { backgroundColor: colors.surface, borderColor: colors.border }]} accessibilityLabel="Go back">
                <Ionicons name="chevron-back" size={22} color={colors.textPrimary}/>
              </AnimatedPressable>
            </View>} centerAccessory={<View style={[styles.headerPill, styles.headerCenterPill, headerContainerStyle, { maxWidth: headerCenterPillMaxWidth }]}>
              <Avatar name={peerAvatarLabel} uri={peer?.avatarUri} size="xs" showOnlineBadge={false} isOnline={isOnline} style={styles.headerAvatar}/>
              <View style={styles.headerTextBlock}>
                <Text style={headerTitleStyle} numberOfLines={1} ellipsizeMode="tail">{peerDisplayName}</Text>
                <Text style={headerStatusStyle} numberOfLines={1} ellipsizeMode="tail">{contactStatusText}</Text>
              </View>
            </View>} rightAccessory={<View style={[styles.headerPill, styles.headerActionPill, headerContainerStyle, { paddingHorizontal: headerSidePillPadding + 8 }]}>
              <View style={styles.headerActionGroup}>
                <AnimatedPressable onPress={() => router.push(`/call/${peerId}?video=true`)} style={headerActionButtonStyle} accessibilityLabel="Video call">
                  <Ionicons name="videocam-outline" size={20} color={colors.textPrimary}/>
                </AnimatedPressable>
                <View style={[styles.pillDivider, { backgroundColor: colors.border }]}/>
                <AnimatedPressable onPress={() => router.push(`/call/${peerId}`)} style={headerActionButtonStyle} accessibilityLabel="Voice call">
                  <Ionicons name="call-outline" size={20} color={colors.textPrimary}/>
                </AnimatedPressable>
              </View>
            </View>}/>
        </View>

        <KeyboardAvoidingView style={styles.flex} enabled={Platform.OS === 'ios'} behavior="padding" keyboardVerticalOffset={keyboardAvoidingOffset}>
          <View style={[styles.flex, chatBackgroundStyle]}>
            <FlatList ref={flashListRef} data={listItems} keyExtractor={keyExtractor} renderItem={renderItem} inverted overScrollMode="never" onScroll={handleScroll} scrollEventThrottle={16} contentContainerStyle={styles.listContent} ListEmptyComponent={EmptyComponent} ListFooterComponent={<TypingIndicator visible={isTyping}/>} removeClippedSubviews={Platform.OS === 'android'} maxToRenderPerBatch={20} windowSize={10}/>

            <NewMessagePill visible={showNewMessagePill} onPress={scrollToBottom}/>
          </View>

          <AttachmentPreview attachments={pendingAttachments} onRemove={(id) => setPendingAttachments((prev) => prev.filter((attachment) => attachment.id !== id))}/>

          <View style={[styles.inputFadeArea, inputBarPaddingStyle]}>
            <LinearGradient pointerEvents="none" colors={inputFadeColors} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill}/>
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
    headerFadeArea: {
        marginBottom: -EDGE_FADE_HEIGHT,
        paddingBottom: EDGE_FADE_HEIGHT,
        overflow: 'visible',
        zIndex: 2,
    },
    transparentHeader: {
        backgroundColor: 'transparent',
    },
    inputFadeArea: {
        marginTop: -EDGE_FADE_HEIGHT,
        paddingTop: EDGE_FADE_HEIGHT,
        overflow: 'visible',
        zIndex: 2,
    },
    headerLead: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    headerPill: {
        borderWidth: 1,
        height: 45,
        minHeight: 45,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 30,
        borderColor: 'transparent',
        paddingHorizontal: spacing.sm,
        paddingVertical: 0,
    },
    headerIconCircle: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenterPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        minWidth: 0,
        paddingVertical: 0,
        paddingRight: 20,
        alignSelf: 'center',
        gap: 10,
    },
    headerAvatar: {
        marginTop: 0,
        alignSelf: 'center',
    },
    headerTextBlock: {
        minWidth: 0,
        flexShrink: 1,
        overflow: 'hidden',
        minHeight: 30,
        justifyContent: 'center',
        gap: 1,
    },
    headerActionPill: {
        paddingHorizontal: spacing.sm,
        paddingRight: spacing.md,
        paddingVertical: 0,
    },
    headerActionGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        paddingRight: 2,
    },
    pillDivider: {
        width: StyleSheet.hairlineWidth,
        height: 18,
        marginHorizontal: spacing.xs,
    },
    listContent: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.xs,
        paddingBottom: spacing.md,
    },
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
        fontFamily: typography.fontFamily.semiBold,
    },
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
    ctxItemDivider: {
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    ctxLabel: {
        fontSize: typography.fontSize.md,
    },
});
