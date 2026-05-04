import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable as RNPressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import * as SecureStore from "expo-secure-store";
import { decodeBase64 } from "tweetnacl-util";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db/client";
import { messages as messagesTable } from "@/db/schema";
import { insertMessage } from "@/db/queries";
import { getOrCreateConversation } from "@/db/queries";
import { useMessages } from "@/lib/hooks/useMessages";
import { useIdentityStore } from "@/src/store/identityStore";
import { sendGunMessage } from "@/lib/p2p/messaging";
import Header from "@/src/components/ui/Header";
import { useTheme } from "@/src/theme/ThemeProvider";
import { borderRadius, shadows, spacing, typography } from "@/src/theme/tokens";
import {
  HEADER_HEIGHT,
  NEAR_BOTTOM_THRESHOLD,
  CHAT_SCREEN_MAX_WIDTH,
} from "@/src/constants/layout";
import { Strings } from "@/src/constants/strings";
import { formatChatBubbleTimestamp } from "@/src/utils/formatTime";
import { groupMessagesByDate } from "@/src/utils/groupMessages";
import Avatar from "@/src/components/ui/Avatar";
import AppChatBubble from "@/src/components/ui/ChatBubble";
import AppMessageInput from "@/src/components/ui/MessageInput";
import AnimatedPressable from "@/src/components/ui/Pressable";
import MessageStatus from "@/src/components/chat/MessageStatus";
import TypingIndicator from "@/src/components/chat/TypingIndicator";
import ReactionBar from "@/src/components/chat/ReactionBar";
import AttachmentPreview from "@/src/components/chat/AttachmentPreview";
import { usePresence } from "@/src/hooks/usePresence";
import { useResponsive } from "@/src/hooks/useResponsive";
import { ROUTES } from "@/src/constants/routes";
import {
  useSendTypingIndicator,
  useTypingIndicator,
} from "@/src/hooks/useTypingIndicator";
// ─── Constants ────────────────────────────────────────────────────────────────
const SECRET_KEY_STORE_KEY = "resonar-secret-keys";
const INPUT_BAR_EXTRA_BOTTOM_PADDING = 10;
const EDGE_FADE_HEIGHT = 36;
const ANDROID_KEYBOARD_CLEARANCE = 28;
const ANDROID_NAV_BAR_CLEARANCE = 14;
// ─── DateSeparator ────────────────────────────────────────────────────────────
function DateSeparator({ label }) {
  const { colors } = useTheme();
  const separatorPillStyle = useMemo(
    () => [styles.separatorPill, { backgroundColor: colors.surfaceMuted }],
    [colors.surfaceMuted],
  );
  const separatorTextStyle = useMemo(
    () => [
      styles.separatorText,
      { color: colors.textSecondary, fontFamily: typography.fontFamily.medium },
    ],
    [colors.textSecondary],
  );
  return (
    <View style={styles.separatorRow}>
      <View style={separatorPillStyle}>
        <Text style={separatorTextStyle}>{label}</Text>
      </View>
    </View>
  );
}
// ─── NewMessagesDivider ───────────────────────────────────────────────────────
function NewMessagesDivider() {
  const { colors } = useTheme();
  const dividerLineStyle = useMemo(
    () => [styles.newMsgDividerLine, { backgroundColor: colors.accent }],
    [colors.accent],
  );
  const dividerLabelStyle = useMemo(
    () => [
      styles.newMsgDividerLabel,
      { color: colors.accent, fontFamily: typography.fontFamily.semiBold },
    ],
    [colors.accent],
  );
  return (
    <View style={styles.newMsgDividerRow}>
      <View style={dividerLineStyle} />
      <Text style={dividerLabelStyle}>{Strings.chat.newMessages}</Text>
      <View style={dividerLineStyle} />
    </View>
  );
}
// ─── ChatBubble ───────────────────────────────────────────────────────────────
function ChatBubble({
  message,
  isFromMe,
  onLongPress,
  replyToMessage,
  onReplyTap,
  groupedWithPrevious = false,
  groupedWithNext = false,
  reaction,
}) {
  const handleLongPress = useCallback(
    (e) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onLongPress(message.id, {
        x: e.nativeEvent.pageX,
        y: e.nativeEvent.pageY,
      });
    },
    [message.id, onLongPress],
  );
  if (message.isDeleted) {
    return (
      <AppChatBubble
        fromMe={isFromMe}
        text="This message was deleted"
        deleted
        onLongPress={handleLongPress}
        groupedWithPrevious={groupedWithPrevious}
        groupedWithNext={groupedWithNext}
        reaction={reaction}
      />
    );
  }
  const displayStatus = message.readAt
    ? "read"
    : message.deliveredAt
      ? "delivered"
      : message.status === "failed"
        ? "sent"
        : message.status;
  return (
    <AppChatBubble
      fromMe={isFromMe}
      text={message.body ?? ""}
      timestamp={formatChatBubbleTimestamp(message.sentAt)}
      onLongPress={handleLongPress}
      groupedWithPrevious={groupedWithPrevious}
      groupedWithNext={groupedWithNext}
      replyPreview={
        replyToMessage != null
          ? {
              text: replyToMessage.body ?? "",
              onPress: () => onReplyTap?.(replyToMessage.id),
            }
          : undefined
      }
      footer={
        isFromMe ? <MessageStatus status={displayStatus} size={12} /> : null
      }
      reaction={reaction}
    />
  );
}
function InputBar({
  onSend,
  onAttachmentPress,
  disabled = false,
  onTypingChange,
  replyTo,
  onCancelReply,
}) {
  const [text, setText] = useState("");
  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  }, [text, disabled, onSend]);
  return (
    <AppMessageInput
      value={text}
      onChangeText={(value) => {
        setText(value);
        onTypingChange();
      }}
      onSend={handleSend}
      onAttachmentPress={onAttachmentPress}
      disabled={disabled}
      placeholder={Strings.chat.placeholder}
      replyText={replyTo?.body ?? null}
      onCancelReply={onCancelReply}
    />
  );
}
function ContextMenu({ state, onCopy, onReply, onDelete, onDismiss }) {
  const { colors } = useTheme();
  const actions = useMemo(() => {
    const base = [
      {
        label: Strings.common.copy,
        icon: "copy-outline",
        onPress: onCopy,
      },
      {
        label: Strings.common.reply,
        icon: "arrow-undo-outline",
        onPress: onReply,
      },
    ];
    if (state.isFromMe) {
      base.push({
        label: Strings.common.delete,
        icon: "trash-outline",
        onPress: onDelete,
        destructive: true,
      });
    }
    return base;
  }, [state.isFromMe, onCopy, onReply, onDelete]);

  const overlayStyle = useMemo(
    () => ({
      backgroundColor: colors.overlay,
    }),
    [colors.overlay],
  );
  const sheetStyle = useMemo(
    () => ({
      backgroundColor: colors.surfaceElevated,
    }),
    [colors.surfaceElevated],
  );
  const dividerStyle = useMemo(
    () => ({
      backgroundColor: colors.border,
    }),
    [colors.border],
  );
  const pressedItemStyle = useMemo(
    () => ({
      backgroundColor: colors.surfaceMuted,
    }),
    [colors.surfaceMuted],
  );
  const resolveLabelStyle = useCallback(
    (isDestructive) => ({
      color: isDestructive ? colors.danger : colors.textPrimary,
      fontFamily: typography.fontFamily.medium,
    }),
    [colors.danger, colors.textPrimary],
  );

  return (
    <Modal
      transparent
      animationType="slide"
      visible={state.visible}
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={[styles.ctxOverlay, overlayStyle]}>
          <TouchableWithoutFeedback>
            <View style={[styles.ctxSheet, sheetStyle]}>
              {actions.map((action, idx) => (
                <View key={action.label}>
                  <RNPressable
                    onPress={() => {
                      onDismiss();
                      action.onPress();
                    }}
                    style={({ pressed }) => [
                      styles.ctxSheetItem,
                      pressed && pressedItemStyle,
                    ]}
                  >
                    <Ionicons
                      name={action.icon}
                      size={20}
                      color={
                        action.destructive ? colors.danger : colors.textPrimary
                      }
                    />
                    <Text style={resolveLabelStyle(action.destructive)}>
                      {action.label}
                    </Text>
                  </RNPressable>
                  {idx < actions.length - 1 && (
                    <View style={[styles.ctxSheetDivider, dividerStyle]} />
                  )}
                </View>
              ))}
              <View style={[styles.ctxSheetDivider, dividerStyle, { marginVertical: spacing.sm }]} />
              <RNPressable
                onPress={onDismiss}
                style={({ pressed }) => [
                  styles.ctxSheetItem,
                  styles.ctxSheetCancel,
                  pressed && pressedItemStyle,
                ]}
              >
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontFamily: typography.fontFamily.semiBold,
                    fontSize: typography.fontSize.md,
                  }}
                >
                  Cancel
                </Text>
              </RNPressable>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
function NewMessagePill({ visible, onPress }) {
  const { colors } = useTheme();
  if (!visible) return null;
  const newMessagePillStyle = useMemo(
    () => [
      styles.newMsgPill,
      {
        backgroundColor: colors.accent,
      },
    ],
    [colors.accent],
  );
  return (
    <View style={styles.newMsgPillWrapper}>
      <AnimatedPressable onPress={onPress} haptic style={newMessagePillStyle}>
        <Text style={styles.newMsgPillText}>{Strings.chat.newMessagePill}</Text>
      </AnimatedPressable>
    </View>
  );
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
  const [conversationId, setConversationId] = useState(
    typeof initialConversationId === "string" ? initialConversationId : null,
  );
  const [peer, setPeer] = useState(() => {
    if (typeof initialPeerName !== "string") {
      return null;
    }
    return {
      id: peerId,
      displayName: initialPeerName,
      avatarUri:
        typeof initialAvatarUri === "string" && initialAvatarUri.length > 0
          ? initialAvatarUri
          : null,
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
  const [reactionPosition, setReactionPosition] = useState({ x: 0, y: 0 });
  const [likedMessages, setLikedMessages] = useState(new Set());
  const [dislikedMessages, setDislikedMessages] = useState(new Set());
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    messageId: "",
    messageBody: "",
    position: { x: 0, y: 0 },
    isFromMe: false,
  });
  const [isCenterMenuOpen, setIsCenterMenuOpen] = useState(false);
  const menuAnim = useRef(new Animated.Value(0)).current;
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
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
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
  useEffect(() => {
    Animated.timing(menuAnim, {
      toValue: isCenterMenuOpen ? 1 : 0,
      duration: isCenterMenuOpen ? 200 : 150,
      easing: isCenterMenuOpen
        ? Easing.in(Easing.ease)
        : Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [isCenterMenuOpen]);
  // ── Init conversation & peer ──────────────────────────────────────────────
  useEffect(() => {
    if (!peerId) return;
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
  useFocusEffect(
    useCallback(() => {
      if (!conversationId || !identity?.phoneNumber) return;
      db.update(messagesTable)
        .set({ status: "read", readAt: new Date() })
        .where(
          and(
            eq(messagesTable.conversationId, conversationId),
            ne(messagesTable.peerId, identity.phoneNumber),
            ne(messagesTable.status, "read"),
          ),
        )
        .catch(console.error);
    }, [conversationId, identity?.phoneNumber]),
  );
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
    if (messages.length === 0) return [];
    const groups = groupMessagesByDate(messages);
    const items = [];
    let dividerInserted = false;
    for (const group of groups) {
      for (const msg of group.messages) {
        if (
          showNewMessagePill &&
          !dividerInserted &&
          lastSeenTimestamp !== null &&
          msg.sentAt <= lastSeenTimestamp
        ) {
          items.push({ kind: "newMessageDivider", id: "new-msg-divider" });
          dividerInserted = true;
        }
        items.push({ kind: "message", message: msg, id: msg.id });
      }
      items.push({
        kind: "separator",
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
  const handleSend = useCallback(
    async (text) => {
      if (!identity || !conversationId || !peerId) return;
      setIsSending(true);
      try {
        const msgId = crypto.randomUUID();
        await insertMessage({
          id: msgId,
          conversationId,
          peerId: identity.phoneNumber,
          type: "text",
          body: text,
          status: "sending",
          replyToId: replyToMessage?.id ?? null,
        });
        const peerRow = await db.query.peers.findFirst({
          where: (p, { eq }) => eq(p.id, peerId),
        });
        if (peerRow) {
          const secretKeyStr =
            await SecureStore.getItemAsync(SECRET_KEY_STORE_KEY);
          if (secretKeyStr) {
            const mySecretKey = decodeBase64(secretKeyStr);
            const peerPublicKey = decodeBase64(peerRow.publicKey);
            await sendGunMessage(
              peerId,
              msgId,
              text,
              peerPublicKey,
              mySecretKey,
              identity.phoneNumber,
            );
            await db
              .update(messagesTable)
              .set({ status: "sent" })
              .where(eq(messagesTable.id, msgId));
          }
        }
        setReplyToMessage(null);
        if (pendingAttachments.length > 0) setPendingAttachments([]);
        setTimeout(
          () =>
            flashListRef.current?.scrollToOffset({ offset: 0, animated: true }),
          50,
        );
      } catch (e) {
        console.error("[ChatScreen] handleSend error:", e);
      } finally {
        setIsSending(false);
      }
    },
    [identity, conversationId, peerId, replyToMessage, pendingAttachments],
  );
  const handleBubbleLongPress = useCallback(
    (messageId, position) => {
      const msg = messagesById.get(messageId);
      if (!msg) return;
      const fromMe = msg.peerId === identity?.phoneNumber;
      setReactionTarget(messageId);
      setReactionPosition(position);
      setContextMenu({
        visible: true,
        messageId,
        messageBody: msg.body ?? "",
        position,
        isFromMe: fromMe,
      });
    },
    [messagesById, identity?.phoneNumber],
  );
  const handleLike = useCallback((messageId) => {
    setLikedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
    setDislikedMessages((prev) => {
      const next = new Set(prev);
      next.delete(messageId);
      return next;
    });
  }, []);

  const handleDislike = useCallback((messageId) => {
    setDislikedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
    setLikedMessages((prev) => {
      const next = new Set(prev);
      next.delete(messageId);
      return next;
    });
  }, []);

  const handleContextCopy = useCallback(async () => {
    await Clipboard.setStringAsync(contextMenu.messageBody);
  }, [contextMenu.messageBody]);
  const handleContextReply = useCallback(() => {
    const msg = messagesById.get(contextMenu.messageId);
    if (msg) setReplyToMessage(msg);
  }, [contextMenu.messageId, messagesById]);
  const handleContextDelete = useCallback(async () => {
    if (!conversationId) return;
    await db
      .update(messagesTable)
      .set({ isDeleted: true, body: null })
      .where(eq(messagesTable.id, contextMenu.messageId))
      .catch(console.error);
  }, [contextMenu.messageId, conversationId]);
  const handleReplyTap = useCallback(
    (messageId) => {
      const idx = listItems.findIndex(
        (item) => item.kind === "message" && item.message.id === messageId,
      );
      if (idx >= 0) {
        flashListRef.current?.scrollToIndex({ index: idx, animated: true });
      }
    },
    [listItems],
  );
  const handleCamera = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Camera access is needed.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images", "videos"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPendingAttachments((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          uri: asset.uri,
          type: "image",
          name: asset.fileName ?? "photo",
        },
      ]);
    }
  }, []);
  const handlePhotoLibrary = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Photo library access is needed.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const newItems = result.assets.map((asset) => ({
        id: crypto.randomUUID(),
        uri: asset.uri,
        type: "image",
        name: asset.fileName ?? "photo",
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
          type: "document",
          name: asset.name,
          size: asset.size,
        },
      ]);
    }
  }, []);
  const handleAttachmentPress = useCallback(() => {
    Alert.alert("Add Attachment", undefined, [
      { text: Strings.attachments.camera, onPress: handleCamera },
      { text: Strings.attachments.photoLibrary, onPress: handlePhotoLibrary },
      { text: Strings.attachments.document, onPress: handleDocument },
      { text: Strings.attachments.audio, onPress: () => {} },
      { text: Strings.common.cancel, style: "cancel" },
    ]);
  }, [handleCamera, handlePhotoLibrary, handleDocument]);
  // ── Render helpers ────────────────────────────────────────────────────────
  const keyExtractor = useCallback((item) => item.id, []);
  const renderItem = useCallback(
    ({ item, index }) => {
      if (item.kind === "separator") {
        return <DateSeparator label={item.label} />;
      }
      if (item.kind === "newMessageDivider") {
        return <NewMessagesDivider />;
      }
      const msg = item.message;
      const fromMe = msg.peerId === identity?.phoneNumber;
      const replyTo = msg.replyToId
        ? (messagesById.get(msg.replyToId) ?? null)
        : null;
      const previousItem = listItems[index - 1];
      const nextItem = listItems[index + 1];
      const previousMessage =
        previousItem?.kind === "message" ? previousItem.message : null;
      const nextMessage =
        nextItem?.kind === "message" ? nextItem.message : null;
      return (
        <ChatBubble
          message={msg}
          isFromMe={fromMe}
          onLongPress={handleBubbleLongPress}
          replyToMessage={replyTo}
          onReplyTap={handleReplyTap}
          groupedWithPrevious={previousMessage?.peerId === msg.peerId}
          groupedWithNext={nextMessage?.peerId === msg.peerId}
          reaction={likedMessages.has(msg.id) ? 'like' : dislikedMessages.has(msg.id) ? 'dislike' : null}
        />
      );
    },
    [
      identity?.phoneNumber,
      listItems,
      messagesById,
      handleBubbleLongPress,
      handleReplyTap,
      likedMessages,
      dislikedMessages,
    ],
  );
  const emptyTitleStyle = useMemo(
    () => [
      styles.emptyTitle,
      {
        color: colors.textSecondary,
        fontFamily: typography.fontFamily.medium,
      },
    ],
    [colors.textSecondary],
  );
  const emptySubStyle = useMemo(
    () => [
      styles.emptySub,
      {
        color: colors.textDisabled,
        fontFamily: typography.fontFamily.regular,
      },
    ],
    [colors.textDisabled],
  );
  const EmptyComponent = useMemo(
    () => (
      <View style={styles.emptyWrapper}>
        <Text style={emptyTitleStyle}>{Strings.chat.emptyChat}</Text>
        <Text style={emptySubStyle}>{Strings.chat.emptyChatSub}</Text>
      </View>
    ),
    [emptyTitleStyle, emptySubStyle],
  );
  const contentMaxWidth = isDesktop
    ? CHAT_SCREEN_MAX_WIDTH.desktop
    : isTablet
      ? CHAT_SCREEN_MAX_WIDTH.tablet
      : undefined;
  const screenStyle = useMemo(
    () => ({
      backgroundColor: colors.background,
    }),
    [colors.background],
  );
  const contentShellStyle = useMemo(
    () =>
      contentMaxWidth
        ? [styles.contentShell, { maxWidth: contentMaxWidth }]
        : [styles.contentShell],
    [contentMaxWidth],
  );
  const isOffline = statusText === "Connecting...";
  const contactStatusText = useMemo(
    () => (isOffline ? "Offline" : statusText),
    [isOffline, statusText],
  );
  const peerDisplayName = peer?.displayName ?? peerId ?? "Chat";
  const peerAvatarLabel = peer?.displayName ?? peerId ?? "?";
  const headerPillHeight = 45;
  const headerSidePillPadding = 10;
  const headerCenterPillMaxWidth = "60%";
  const headerContainerStyle = useMemo(
    () => ({
      backgroundColor: colors.surface,
      borderColor: colors.border,
      height: headerPillHeight,
      minHeight: headerPillHeight,
    }),
    [colors.border, colors.surface],
  );
  const headerTitleStyle = useMemo(
    () => ({
      color: colors.textPrimary,
      fontFamily: typography.fontFamily.semiBold,
      fontSize: typography.fontSize.md,
    }),
    [colors.textPrimary],
  );
  const headerStatusStyle = useMemo(
    () => ({
      color: colors.textSecondary,
      fontFamily: typography.fontFamily.regular,
      fontSize: 10,
      lineHeight: 12,
      marginTop: 1,
    }),
    [colors.textSecondary],
  );
  const headerActionButtonStyle = useMemo(
    () => ({
      width: 35,
      height: 35,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: 17.5,
    }),
    [colors.border, colors.surface],
  );
  const headerSpacerStyle = useMemo(
    () => ({
      height: insets.top,
      backgroundColor: "transparent",
    }),
    [insets.top],
  );
  const chatBackgroundStyle = useMemo(
    () => ({
      backgroundColor: colors.headerBackground,
    }),
    [colors.headerBackground],
  );
  const keyboardAvoidingOffset = useMemo(
    () => (Platform.OS === "ios" ? insets.top + HEADER_HEIGHT : 0),
    [insets.top],
  );
  const androidKeyboardFallbackPadding = useMemo(() => {
    if (Platform.OS !== "android" || !keyboardVisible || keyboardHeight <= 0) {
      return 0;
    }
    const resizedAmount = Math.max(
      maxWindowHeightRef.current - windowHeight,
      0,
    );
    const nativeResizeActive =
      resizedAmount > Math.min(keyboardHeight * 0.4, 140);
    return nativeResizeActive ? 0 : keyboardHeight + ANDROID_KEYBOARD_CLEARANCE;
  }, [keyboardHeight, keyboardVisible, windowHeight]);
  const inputBarPaddingStyle = useMemo(
    () => ({
      paddingBottom:
        Platform.OS === "ios"
          ? insets.bottom + INPUT_BAR_EXTRA_BOTTOM_PADDING
          : androidKeyboardFallbackPadding +
            INPUT_BAR_EXTRA_BOTTOM_PADDING +
            (keyboardVisible ? 0 : ANDROID_NAV_BAR_CLEARANCE),
      backgroundColor: colors.background,
    }),
    [
      androidKeyboardFallbackPadding,
      colors.background,
      insets.bottom,
      keyboardVisible,
    ],
  );
  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.screen, screenStyle]}>
      <View style={contentShellStyle}>
        <View style={styles.headerFadeArea}>
          <View style={headerSpacerStyle} />

          <Header
            centerPillCentered
            title=""
            style={styles.transparentHeader}
            leftAccessory={
              <View
                style={[
                  styles.headerPill,
                  headerContainerStyle,
                  { paddingHorizontal: headerSidePillPadding },
                ]}
              >
                <AnimatedPressable
                  onPress={() => router.back()}
                  style={[
                    styles.headerIconCircle,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  accessibilityLabel="Go back"
                >
                  <Ionicons
                    name="chevron-back"
                    size={22}
                    color={colors.textPrimary}
                  />
                </AnimatedPressable>
              </View>
            }
            centerAccessory={
              <RNPressable
                onPress={() => setIsCenterMenuOpen(true)}
                style={[
                  styles.headerPill,
                  styles.headerCenterPill,
                  headerContainerStyle,
                  { maxWidth: headerCenterPillMaxWidth },
                ]}
              >
                <Avatar
                  name={peerAvatarLabel}
                  uri={peer?.avatarUri}
                  size="xs"
                  showOnlineBadge={false}
                  isOnline={isOnline}
                  style={styles.headerAvatar}
                />
                <View style={styles.headerTextBlock}>
                  <Text
                    style={headerTitleStyle}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {peerDisplayName}
                  </Text>
                  <Text
                    style={headerStatusStyle}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {contactStatusText}
                  </Text>
                </View>
              </RNPressable>
            }
            rightAccessory={
              <View
                style={[
                  styles.headerPill,
                  styles.headerActionPill,
                  headerContainerStyle,
                  { paddingHorizontal: headerSidePillPadding + 8 },
                ]}
              >
                <View style={styles.headerActionGroup}>
                  <AnimatedPressable
                    onPress={() => router.push(`${ROUTES.CALL(peerId)}?video=true`)}
                    style={headerActionButtonStyle}
                    accessibilityLabel="Video call"
                  >
                    <Ionicons
                      name="videocam-outline"
                      size={20}
                      color={colors.textPrimary}
                    />
                  </AnimatedPressable>
                  <View
                    style={[
                      styles.pillDivider,
                      { backgroundColor: colors.border },
                    ]}
                  />
                  <AnimatedPressable
                    onPress={() => router.push(ROUTES.CALL(peerId))}
                    style={headerActionButtonStyle}
                    accessibilityLabel="Voice call"
                  >
                    <Ionicons
                      name="call-outline"
                      size={17}
                      color={colors.textPrimary}
                    />
                  </AnimatedPressable>
                </View>
              </View>
            }
          />

          <Animated.View
            pointerEvents={isCenterMenuOpen ? "auto" : "none"}
            style={[
              styles.centerMenuWrapper,
              {
                top: insets.top + HEADER_HEIGHT + 6,
                opacity: menuAnim,
                transform: [
                  {
                    translateY: menuAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-8, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View
              style={[
                styles.centerMenuContainer,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {[
                { label: "Media", icon: "images-outline" },
                { label: "Notifications", icon: "notifications-outline" },
                { label: "Privacy Mode", icon: "lock-closed-outline" },
                {
                  label: "Block Contact",
                  icon: "ban-outline",
                  destructive: true,
                },
                {
                  label: "Clear Chat",
                  icon: "trash-outline",
                  destructive: true,
                },
              ].map((item, idx, arr) => (
                <View key={item.label} style={styles.centerMenuRow}>
                  <RNPressable
                    onPress={() => {
                      setIsCenterMenuOpen(false);
                      if (item.label === "Block Contact") {
                        Alert.alert(
                          "Block Contact",
                          `Block ${peerDisplayName}?`,
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Block",
                              style: "destructive",
                              onPress: () => {},
                            },
                          ],
                        );
                      } else if (item.label === "Clear Chat") {
                        Alert.alert(
                          "Clear Chat",
                          "Clear all messages in this chat?",
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Clear",
                              style: "destructive",
                              onPress: () => {},
                            },
                          ],
                        );
                      }
                    }}
                    style={({ pressed }) => [
                      styles.centerMenuItem,
                      pressed && { backgroundColor: colors.surfaceMuted },
                    ]}
                  >
                    <View style={styles.centerMenuItemInner}>
                      <Ionicons
                        name={item.icon}
                        size={15}
                        color={
                          item.destructive ? colors.danger : colors.textSecondary
                        }
                        style={styles.centerMenuIcon}
                      />
                      <Text
                        style={[
                          styles.centerMenuItemText,
                          {
                            color: item.destructive
                              ? colors.danger
                              : colors.textPrimary,
                            fontFamily: typography.fontFamily.medium,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                    </View>
                  </RNPressable>
                  {idx < arr.length - 1 && (
                    <View
                      style={[
                        styles.centerMenuDivider,
                        { backgroundColor: colors.border },
                      ]}
                    />
                  )}
                </View>
              ))}
            </View>
          </Animated.View>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          enabled={Platform.OS === "ios"}
          behavior="padding"
          keyboardVerticalOffset={keyboardAvoidingOffset}
        >
          <View style={[styles.flex, chatBackgroundStyle]}>
            <FlatList
              ref={flashListRef}
              data={listItems}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              inverted
              overScrollMode="never"
              onScroll={handleScroll}
              scrollEventThrottle={16}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={EmptyComponent}
              ListFooterComponent={<TypingIndicator visible={isTyping} />}
              removeClippedSubviews={Platform.OS === "android"}
              maxToRenderPerBatch={20}
              windowSize={10}
            />

            <NewMessagePill
              visible={showNewMessagePill}
              onPress={scrollToBottom}
            />
          </View>

          <AttachmentPreview
            attachments={pendingAttachments}
            onRemove={(id) =>
              setPendingAttachments((prev) =>
                prev.filter((attachment) => attachment.id !== id),
              )
            }
          />

          <View style={[styles.inputFadeArea, inputBarPaddingStyle]}>
            <InputBar
              onSend={handleSend}
              onAttachmentPress={handleAttachmentPress}
              disabled={isSending || !conversationId}
              onTypingChange={onTypingStart}
              replyTo={replyToMessage}
              onCancelReply={() => setReplyToMessage(null)}
            />
          </View>
        </KeyboardAvoidingView>
      </View>

      {isCenterMenuOpen && (
        <RNPressable
          onPress={() => setIsCenterMenuOpen(false)}
          style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
        />
      )}

      {/* Reaction bar */}
      <ReactionBar
        messageId={reactionTarget ?? ""}
        visible={reactionTarget !== null}
        isLiked={likedMessages.has(reactionTarget ?? "")}
        isDisliked={dislikedMessages.has(reactionTarget ?? "")}
        onLike={handleLike}
        onDislike={handleDislike}
        onDismiss={() => {
          setReactionTarget(null);
          setContextMenu((prev) => ({ ...prev, visible: false }));
        }}
        position={reactionPosition}
      />

      {/* Context menu */}
      <ContextMenu
        state={contextMenu}
        onCopy={handleContextCopy}
        onReply={handleContextReply}
        onDelete={handleContextDelete}
        onDismiss={() => {
          setContextMenu((prev) => ({ ...prev, visible: false }));
          setReactionTarget(null);
        }}
      />
    </View>
  );
}
// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  contentShell: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
  },
  flex: {
    flex: 1,
  },
  headerFadeArea: {
    marginBottom: -EDGE_FADE_HEIGHT,
    paddingBottom: EDGE_FADE_HEIGHT,
    overflow: "visible",
    zIndex: 2,
  },
  transparentHeader: {
    backgroundColor: "transparent",
  },
  inputFadeArea: {
    marginTop: 0,
    marginBottom: 4,
    paddingTop: 0,
    overflow: "hidden",
    zIndex: 2,
    backgroundColor: "transparent",
  },
  headerLead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerPill: {
    borderWidth: 1,
    height: 45,
    minHeight: 45,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
    borderColor: "transparent",
    paddingHorizontal: spacing.sm,
    paddingVertical: 0,
  },
  headerIconCircle: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minWidth: 0,
    paddingVertical: 0,
    paddingRight: 20,
    alignSelf: "center",
    gap: 10,
  },
  headerAvatar: {
    marginTop: 0,
    alignSelf: "center",
  },
  headerTextBlock: {
    minWidth: 0,
    flexShrink: 1,
    overflow: "hidden",
    minHeight: 30,
    justifyContent: "center",
    gap: 1,
  },
  headerActionPill: {
    paddingHorizontal: spacing.sm,
    paddingRight: spacing.md,
    paddingVertical: 0,
  },
  headerActionGroup: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingRight: 2,
  },
  pillDivider: {
    width: StyleSheet.hairlineWidth + 1,
    height: 18,
    marginHorizontal: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  emptyWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.md,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  emptySub: {
    fontSize: typography.fontSize.sm,
    textAlign: "center",
    lineHeight: typography.fontSize.sm * 1.5,
  },
  separatorRow: {
    alignItems: "center",
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
    flexDirection: "row",
    alignItems: "center",
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
    position: "absolute",
    bottom: spacing.md,
    alignSelf: "center",
  },
  newMsgPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
    ...shadows.md,
  },
  newMsgPillText: {
    fontSize: typography.fontSize.sm,
    color: "#ffffff",
    fontFamily: typography.fontFamily.semiBold,
  },
  ctxOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  ctxSheet: {
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    width: "100%",
  },
  ctxSheetItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  ctxSheetCancel: {
    justifyContent: "center",
  },
  ctxSheetDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.lg,
  },
  centerMenuWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  centerMenuContainer: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    alignSelf: "center",
    paddingVertical: spacing.xs,
  },
  centerMenuRow: {
    width: "100%",
  },
  centerMenuItem: {
    width: "100%",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  centerMenuItemInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    width: "200"
  },
  centerMenuIcon: {
    marginRight: spacing.md,
  },
  centerMenuItemText: {
    fontSize: typography.fontSize.sm,
    flexShrink: 1,
  },
  centerMenuDivider: {
    height: StyleSheet.hairlineWidth,
  },
});
