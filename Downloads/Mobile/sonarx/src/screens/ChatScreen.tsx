import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable as RNPressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  type GestureResponderEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { FlashList, FlashListRef } from '@shopify/flash-list'
// FlashList is imported for potential non-inverted use; inverted chat list uses FlatList below
import Ionicons from '@expo/vector-icons/Ionicons'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import * as Haptics from 'expo-haptics'
import * as Clipboard from 'expo-clipboard'
import * as SecureStore from 'expo-secure-store'
import { decodeBase64 } from 'tweetnacl-util'
import { and, eq, ne } from 'drizzle-orm'
import { db } from '@/db/client'
import { messages as messagesTable } from '@/db/schema'
import { insertMessage } from '@/db/queries'
import type { Message, Peer } from '@/db/schema'
import { getOrCreateConversation } from '@/db/queries'
import { useMessages } from '@/lib/hooks/useMessages'
import { useIdentityStore } from '@/stores/identity.store'
import { sendGunMessage } from '@/lib/p2p/messaging'
import { useTheme } from '@/src/theme/ThemeProvider'
import { borderRadius, shadows, spacing, typography } from '@/src/theme/tokens'
import { Strings } from '@/src/constants/strings'
import {
  BUBBLE_MAX_WIDTH,
  HEADER_HEIGHT,
  INPUT_BAR_HEIGHT,
  NEAR_BOTTOM_THRESHOLD,
} from '@/src/constants/layout'
import { formatMessageTime } from '@/src/utils/formatTime'
import { groupMessagesByDate } from '@/src/utils/groupMessages'
import Avatar from '@/src/components/ui/Avatar'
import AnimatedPressable from '@/src/components/ui/Pressable'
import MessageStatus from '@/src/components/chat/MessageStatus'
import TypingIndicator from '@/src/components/chat/TypingIndicator'
import ReactionBar from '@/src/components/chat/ReactionBar'
import AttachmentPreview, {
  type AttachmentItem,
} from '@/src/components/chat/AttachmentPreview'
import { usePresence } from '@/src/hooks/usePresence'
import {
  useSendTypingIndicator,
  useTypingIndicator,
} from '@/src/hooks/useTypingIndicator'

// ─── Constants ────────────────────────────────────────────────────────────────

const SECRET_KEY_STORE_KEY = 'sonarx-secret-keys'

// ─── Types ────────────────────────────────────────────────────────────────────

type ListItem =
  | { kind: 'message'; message: Message; id: string }
  | { kind: 'separator'; label: string; id: string }
  | { kind: 'newMessageDivider'; id: string }

interface ChatBubbleProps {
  message: Message
  isFromMe: boolean
  onLongPress: (
    messageId: string,
    position: { x: number; y: number },
  ) => void
  replyToMessage?: Message | null
  onReplyTap?: (messageId: string) => void
}

interface ContextMenuState {
  visible: boolean
  messageId: string
  messageBody: string
  position: { x: number; y: number }
  isFromMe: boolean
}

// ─── DateSeparator ────────────────────────────────────────────────────────────

function DateSeparator({ label }: { label: string }) {
  const { colors } = useTheme()
  return (
    <View style={styles.separatorRow}>
      <View
        style={[
          styles.separatorPill,
          { backgroundColor: colors.surfaceMuted },
        ]}
      >
        <Text
          style={[
            styles.separatorText,
            {
              color: colors.textSecondary,
              fontFamily: typography.fontFamily.medium,
            },
          ]}
        >
          {label}
        </Text>
      </View>
    </View>
  )
}

// ─── NewMessagesDivider ───────────────────────────────────────────────────────

function NewMessagesDivider() {
  const { colors } = useTheme()
  return (
    <View style={styles.newMsgDividerRow}>
      <View
        style={[styles.newMsgDividerLine, { backgroundColor: colors.accent }]}
      />
      <Text
        style={[
          styles.newMsgDividerLabel,
          { color: colors.accent, fontFamily: typography.fontFamily.semiBold },
        ]}
      >
        {Strings.chat.newMessages}
      </Text>
      <View
        style={[styles.newMsgDividerLine, { backgroundColor: colors.accent }]}
      />
    </View>
  )
}

// ─── ChatBubble ───────────────────────────────────────────────────────────────

function ChatBubble({
  message,
  isFromMe,
  onLongPress,
  replyToMessage,
  onReplyTap,
}: ChatBubbleProps) {
  const { colors } = useTheme()

  const translateY = useSharedValue(isFromMe ? 20 : 0)
  const translateX = useSharedValue(isFromMe ? 0 : -20)
  const opacity = useSharedValue(0)

  useEffect(() => {
    if (isFromMe) {
      translateY.value = withSpring(0, { damping: 14, stiffness: 200 })
    } else {
      translateX.value = withSpring(0, { damping: 14, stiffness: 200 })
    }
    opacity.value = withTiming(1, { duration: 200 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const animStyle = useAnimatedStyle(() => ({
    transform: isFromMe
      ? [{ translateY: translateY.value }]
      : [{ translateX: translateX.value }],
    opacity: opacity.value,
  }))

  const handleLongPress = useCallback(
    (e: GestureResponderEvent) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      onLongPress(message.id, {
        x: e.nativeEvent.pageX,
        y: e.nativeEvent.pageY,
      })
    },
    [message.id, onLongPress],
  )

  const textColor = isFromMe
    ? colors.bubble.outgoingText
    : colors.bubble.incomingText
  const timeColor = isFromMe ? 'rgba(255,255,255,0.6)' : colors.textDisabled

  if (message.isDeleted) {
    return (
      <Animated.View
        style={[
          styles.bubbleWrapper,
          isFromMe ? styles.wrapperRight : styles.wrapperLeft,
          animStyle,
        ]}
      >
        <View
          style={[styles.deletedBubble, { borderColor: colors.border }]}
        >
          <Text
            style={[
              styles.deletedText,
              {
                color: colors.textDisabled,
                fontFamily: typography.fontFamily.regular,
              },
            ]}
          >
            🚫 This message was deleted
          </Text>
        </View>
      </Animated.View>
    )
  }

  const displayStatus: 'sending' | 'sent' | 'delivered' | 'read' =
    message.status === 'failed' ? 'sent' : message.status

  return (
    <Animated.View
      style={[
        styles.bubbleWrapper,
        isFromMe ? styles.wrapperRight : styles.wrapperLeft,
        animStyle,
      ]}
    >
      <RNPressable
        onLongPress={handleLongPress}
        delayLongPress={220}
        style={[
          styles.bubble,
          isFromMe
            ? [
                styles.bubbleOutgoing,
                { backgroundColor: colors.bubble.outgoing },
              ]
            : [
                styles.bubbleIncoming,
                {
                  backgroundColor: colors.bubble.incoming,
                  borderColor: colors.bubble.incomingBorder,
                  borderWidth: StyleSheet.hairlineWidth,
                },
              ],
        ]}
      >
        {replyToMessage != null && (
          <RNPressable
            onPress={() => onReplyTap?.(replyToMessage.id)}
            style={[
              styles.replyPreview,
              {
                borderLeftColor: colors.accent,
                backgroundColor: isFromMe
                  ? 'rgba(255,255,255,0.15)'
                  : colors.surfaceMuted,
              },
            ]}
          >
            <Text
              style={[
                styles.replyText,
                {
                  color: isFromMe
                    ? 'rgba(255,255,255,0.8)'
                    : colors.textSecondary,
                  fontFamily: typography.fontFamily.regular,
                },
              ]}
              numberOfLines={2}
            >
              {replyToMessage.body ?? ''}
            </Text>
          </RNPressable>
        )}

        <Text
          style={[
            styles.messageText,
            {
              color: textColor,
              fontFamily: typography.fontFamily.regular,
            },
          ]}
          selectable
        >
          {message.body ?? ''}
        </Text>

        <View style={styles.bubbleFooter}>
          <Text
            style={[
              styles.timeText,
              { color: timeColor, fontFamily: typography.fontFamily.regular },
            ]}
          >
            {formatMessageTime(message.sentAt)}
          </Text>
          {isFromMe && (
            <MessageStatus status={displayStatus} size={12} />
          )}
        </View>
      </RNPressable>
    </Animated.View>
  )
}

// ─── InputBar ─────────────────────────────────────────────────────────────────

interface InputBarProps {
  onSend: (text: string) => void
  onAttachmentPress: () => void
  disabled?: boolean
  onTypingChange: () => void
  replyTo?: Message | null
  onCancelReply?: () => void
}

function InputBar({
  onSend,
  onAttachmentPress,
  disabled = false,
  onTypingChange,
  replyTo,
  onCancelReply,
}: InputBarProps) {
  const { colors } = useTheme()
  const [text, setText] = useState('')
  const hasText = text.trim().length > 0

  const sendScale = useSharedValue(0)
  const micScale = useSharedValue(1)

  useEffect(() => {
    sendScale.value = withSpring(hasText ? 1 : 0, {
      damping: 12,
      stiffness: 220,
    })
    micScale.value = withSpring(hasText ? 0 : 1, {
      damping: 12,
      stiffness: 220,
    })
  }, [hasText])

  const sendAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
    opacity: sendScale.value,
  }))

  const micAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
    opacity: micScale.value,
  }))

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
  }, [text, disabled, onSend])

  return (
    <View
      style={[
        styles.inputBarOuter,
        { backgroundColor: colors.surface, borderTopColor: colors.border },
      ]}
    >
      {replyTo != null && (
        <View
          style={[
            styles.replyBanner,
            {
              backgroundColor: colors.surfaceMuted,
              borderLeftColor: colors.accent,
            },
          ]}
        >
          <Text
            style={[
              styles.replyBannerText,
              {
                color: colors.textSecondary,
                fontFamily: typography.fontFamily.regular,
              },
            ]}
            numberOfLines={1}
          >
            {replyTo.body ?? ''}
          </Text>
          <RNPressable onPress={onCancelReply} hitSlop={8}>
            <Ionicons name="close" size={16} color={colors.textSecondary} />
          </RNPressable>
        </View>
      )}

      <View style={styles.inputBarRow}>
        <AnimatedPressable
          onPress={onAttachmentPress}
          style={styles.inputIconBtn}
          accessibilityLabel="Attach file"
        >
          <Ionicons name="attach" size={22} color={colors.textSecondary} />
        </AnimatedPressable>

        <TextInput
          value={text}
          onChangeText={(t) => {
            setText(t)
            onTypingChange()
          }}
          style={[
            styles.textInput,
            {
              backgroundColor: colors.inputBackground,
              color: colors.textPrimary,
              borderColor: colors.border,
              fontFamily: typography.fontFamily.regular,
            },
          ]}
          placeholder={Strings.chat.placeholder}
          placeholderTextColor={colors.textDisabled}
          multiline
          numberOfLines={1}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />

        <View style={styles.rightBtnContainer}>
          <Animated.View
            style={[StyleSheet.absoluteFill, styles.iconCenter, micAnimStyle]}
            pointerEvents={hasText ? 'none' : 'auto'}
          >
            <Ionicons name="mic-outline" size={22} color={colors.textSecondary} />
          </Animated.View>
          <Animated.View
            style={[styles.sendBtn, { backgroundColor: colors.accent }, sendAnimStyle]}
            pointerEvents={hasText ? 'auto' : 'none'}
          >
            <RNPressable
              onPress={handleSend}
              disabled={disabled || !hasText}
              style={styles.sendBtnInner}
              accessibilityLabel={Strings.common.send}
            >
              <Ionicons name="arrow-up" size={18} color="#ffffff" />
            </RNPressable>
          </Animated.View>
        </View>
      </View>
    </View>
  )
}

// ─── ContextMenu ──────────────────────────────────────────────────────────────

interface ContextMenuProps {
  state: ContextMenuState
  onCopy: () => void
  onReply: () => void
  onDelete: () => void
  onDismiss: () => void
}

function ContextMenu({
  state,
  onCopy,
  onReply,
  onDelete,
  onDismiss,
}: ContextMenuProps) {
  const { colors } = useTheme()
  const scale = useSharedValue(0)

  useEffect(() => {
    scale.value = withSpring(state.visible ? 1 : 0, {
      damping: 14,
      stiffness: 220,
    })
  }, [state.visible])

  const menuStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }))

  if (!state.visible) return null

  const actions = [
    {
      label: Strings.common.copy,
      icon: 'copy-outline' as const,
      onPress: onCopy,
    },
    {
      label: Strings.common.reply,
      icon: 'arrow-undo-outline' as const,
      onPress: onReply,
    },
    ...(state.isFromMe
      ? [
          {
            label: Strings.common.delete,
            icon: 'trash-outline' as const,
            onPress: onDelete,
            destructive: true,
          },
        ]
      : []),
  ]

  return (
    <Modal
      transparent
      animationType="none"
      visible={state.visible}
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={[styles.ctxOverlay, { backgroundColor: colors.overlay }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.ctxMenu,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                },
                shadows.lg,
                menuStyle,
              ]}
            >
              {actions.map((action, idx) => (
                <RNPressable
                  key={action.label}
                  onPress={() => {
                    onDismiss()
                    action.onPress()
                  }}
                  style={({ pressed }) => [
                    styles.ctxItem,
                    idx < actions.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Ionicons
                    name={action.icon}
                    size={18}
                    color={
                      action.destructive ? colors.danger : colors.textPrimary
                    }
                  />
                  <Text
                    style={[
                      styles.ctxLabel,
                      {
                        color: action.destructive
                          ? colors.danger
                          : colors.textPrimary,
                        fontFamily: typography.fontFamily.medium,
                      },
                    ]}
                  >
                    {action.label}
                  </Text>
                </RNPressable>
              ))}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

// ─── NewMessagePill ───────────────────────────────────────────────────────────

interface NewMessagePillProps {
  visible: boolean
  onPress: () => void
}

function NewMessagePill({ visible, onPress }: NewMessagePillProps) {
  const { colors } = useTheme()
  const translateY = useSharedValue(60)
  const opacity = useSharedValue(0)

  useEffect(() => {
    translateY.value = withSpring(visible ? 0 : 60, {
      damping: 14,
      stiffness: 200,
    })
    opacity.value = withTiming(visible ? 1 : 0, { duration: 200 })
  }, [visible])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }))

  return (
    <Animated.View style={[styles.newMsgPillWrapper, animStyle]}>
      <AnimatedPressable
        onPress={onPress}
        haptic
        style={[styles.newMsgPill, { backgroundColor: colors.accent }]}
      >
        <Text
          style={[
            styles.newMsgPillText,
            { fontFamily: typography.fontFamily.semiBold },
          ]}
        >
          {Strings.chat.newMessagePill}
        </Text>
      </AnimatedPressable>
    </Animated.View>
  )
}

// ─── ChatScreen ───────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const { peerId } = useLocalSearchParams<{ peerId: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const identity = useIdentityStore((state) => state.identity)

  // ── State ─────────────────────────────────────────────────────────────────
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [peer, setPeer] = useState<Peer | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null)
  const [pendingAttachments, setPendingAttachments] = useState<
    AttachmentItem[]
  >([])
  const [showNewMessagePill, setShowNewMessagePill] = useState(false)
  const [lastSeenTimestamp, setLastSeenTimestamp] = useState<Date | null>(null)
  const [reactionTarget, setReactionTarget] = useState<string | null>(null)
  const [reactionPosition, setReactionPosition] = useState<{
    x: number
    y: number
  }>({ x: 0, y: 0 })
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    messageId: '',
    messageBody: '',
    position: { x: 0, y: 0 },
    isFromMe: false,
  })

  // ── Refs ──────────────────────────────────────────────────────────────────
  const flashListRef = useRef<FlatList<ListItem>>(null)
  const isAtBottomRef = useRef(true)
  const prevMsgCountRef = useRef(0)

  // ── Data ──────────────────────────────────────────────────────────────────
  const { messages } = useMessages(conversationId)
  const { isOnline, statusText } = usePresence(peerId)
  const { isTyping } = useTypingIndicator(peerId)
  const { onTypingStart } = useSendTypingIndicator(peerId)

  // ── Init conversation & peer ──────────────────────────────────────────────
  useEffect(() => {
    if (!peerId) return
    getOrCreateConversation(peerId)
      .then((conv) => setConversationId(conv.id))
      .catch(console.error)

    db.query.peers
      .findFirst({ where: (p, { eq }) => eq(p.id, peerId) })
      .then((p) => setPeer(p ?? null))
      .catch(console.error)
  }, [peerId])

  // ── Mark messages as read on focus ────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      if (!conversationId || !identity?.phoneNumber) return
      db.update(messagesTable)
        .set({ status: 'read', readAt: new Date() })
        .where(
          and(
            eq(messagesTable.conversationId, conversationId),
            ne(messagesTable.peerId, identity.phoneNumber),
            ne(messagesTable.status, 'read'),
          ),
        )
        .catch(console.error)
    }, [conversationId, identity?.phoneNumber]),
  )

  // ── New message pill detection ────────────────────────────────────────────
  useEffect(() => {
    const curr = messages.length
    if (curr > prevMsgCountRef.current && !isAtBottomRef.current) {
      if (lastSeenTimestamp === null && messages[0]) {
        setLastSeenTimestamp(messages[0].sentAt)
      }
      setShowNewMessagePill(true)
    }
    prevMsgCountRef.current = curr
  }, [messages])

  // ── Scroll to bottom on initial load ─────────────────────────────────────
  useEffect(() => {
    if (messages.length > 0 && conversationId) {
      setTimeout(() => {
        flashListRef.current?.scrollToIndex({ index: 0, animated: false })
      }, 100)
    }
  }, [conversationId])

  // ── List items ───────────────────────────────────────────────────────────
  const listItems = useMemo((): ListItem[] => {
    if (messages.length === 0) return []
    const groups = groupMessagesByDate(messages)
    const items: ListItem[] = []
    let dividerInserted = false

    for (const group of groups) {
      for (const msg of group.messages) {
        if (
          showNewMessagePill &&
          !dividerInserted &&
          lastSeenTimestamp !== null &&
          msg.sentAt <= lastSeenTimestamp
        ) {
          items.push({ kind: 'newMessageDivider', id: 'new-msg-divider' })
          dividerInserted = true
        }
        items.push({ kind: 'message', message: msg, id: msg.id })
      }
      items.push({
        kind: 'separator',
        label: group.dateLabel,
        id: `sep-${group.dateLabel}-${group.date.getTime()}`,
      })
    }
    return items
  }, [messages, showNewMessagePill, lastSeenTimestamp])

  // ── Messages by ID map ────────────────────────────────────────────────────
  const messagesById = useMemo(() => {
    const map = new Map<string, Message>()
    messages.forEach((m) => map.set(m.id, m))
    return map
  }, [messages])

  // ── Handlers ─────────────────────────────────────────────────────────────

  const scrollToBottom = useCallback(() => {
    flashListRef.current?.scrollToIndex({ index: 0, animated: true })
    setShowNewMessagePill(false)
    setLastSeenTimestamp(null)
  }, [])

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y
      isAtBottomRef.current = y < NEAR_BOTTOM_THRESHOLD
      if (isAtBottomRef.current) {
        setShowNewMessagePill(false)
        setLastSeenTimestamp(null)
      }
    },
    [],
  )

  const handleSend = useCallback(
    async (text: string) => {
      if (!identity || !conversationId || !peerId) return
      setIsSending(true)
      try {
        const msgId = crypto.randomUUID()
        await insertMessage({
          id: msgId,
          conversationId,
          peerId: identity.phoneNumber,
          type: 'text',
          body: text,
          status: 'sending',
          replyToId: replyToMessage?.id ?? null,
        })

        const peerRow = await db.query.peers.findFirst({
          where: (p, { eq }) => eq(p.id, peerId),
        })

        if (peerRow) {
          const secretKeyStr = await SecureStore.getItemAsync(SECRET_KEY_STORE_KEY)
          if (secretKeyStr) {
            const mySecretKey = decodeBase64(secretKeyStr)
            const peerPublicKey = decodeBase64(peerRow.publicKey)
            await sendGunMessage(
              peerId,
              msgId,
              text,
              peerPublicKey,
              mySecretKey,
              identity.phoneNumber,
            )
            await db
              .update(messagesTable)
              .set({ status: 'sent' })
              .where(eq(messagesTable.id, msgId))
          }
        }

        setReplyToMessage(null)
        if (pendingAttachments.length > 0) setPendingAttachments([])
        setTimeout(
          () => flashListRef.current?.scrollToIndex({ index: 0, animated: true }),
          50,
        )
      } catch (e) {
        console.error('[ChatScreen] handleSend error:', e)
      } finally {
        setIsSending(false)
      }
    },
    [identity, conversationId, peerId, replyToMessage, pendingAttachments],
  )

  const handleBubbleLongPress = useCallback(
    (messageId: string, position: { x: number; y: number }) => {
      const msg = messagesById.get(messageId)
      if (!msg) return
      const fromMe = msg.peerId === identity?.phoneNumber
      setContextMenu({
        visible: true,
        messageId,
        messageBody: msg.body ?? '',
        position,
        isFromMe: fromMe,
      })
    },
    [messagesById, identity?.phoneNumber],
  )

  const handleContextCopy = useCallback(async () => {
    await Clipboard.setStringAsync(contextMenu.messageBody)
  }, [contextMenu.messageBody])

  const handleContextReply = useCallback(() => {
    const msg = messagesById.get(contextMenu.messageId)
    if (msg) setReplyToMessage(msg)
  }, [contextMenu.messageId, messagesById])

  const handleContextDelete = useCallback(async () => {
    if (!conversationId) return
    await db
      .update(messagesTable)
      .set({ isDeleted: true, body: null })
      .where(eq(messagesTable.id, contextMenu.messageId))
      .catch(console.error)
  }, [contextMenu.messageId, conversationId])

  const handleReplyTap = useCallback(
    (messageId: string) => {
      const idx = listItems.findIndex(
        (item) => item.kind === 'message' && item.message.id === messageId,
      )
      if (idx >= 0) {
        flashListRef.current?.scrollToIndex({ index: idx, animated: true })
      }
    },
    [listItems],
  )

  const handleCamera = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera access is needed.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
    })
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0]
      setPendingAttachments((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          uri: asset.uri,
          type: 'image',
          name: asset.fileName ?? 'photo',
        },
      ])
    }
  }, [])

  const handlePhotoLibrary = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Photo library access is needed.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.8,
    })
    if (!result.canceled) {
      const newItems: AttachmentItem[] = result.assets.map((asset) => ({
        id: crypto.randomUUID(),
        uri: asset.uri,
        type: 'image',
        name: asset.fileName ?? 'photo',
        size: asset.fileSize,
      }))
      setPendingAttachments((prev) => [...prev, ...newItems])
    }
  }, [])

  const handleDocument = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
    })
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0]
      setPendingAttachments((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          uri: asset.uri,
          type: 'document',
          name: asset.name,
          size: asset.size,
        },
      ])
    }
  }, [])

  const handleAttachmentPress = useCallback(() => {
    Alert.alert('Add Attachment', undefined, [
      { text: Strings.attachments.camera, onPress: handleCamera },
      { text: Strings.attachments.photoLibrary, onPress: handlePhotoLibrary },
      { text: Strings.attachments.document, onPress: handleDocument },
      { text: Strings.attachments.audio, onPress: () => {} },
      { text: Strings.common.cancel, style: 'cancel' },
    ])
  }, [handleCamera, handlePhotoLibrary, handleDocument])

  // ── Render helpers ────────────────────────────────────────────────────────

  const keyExtractor = useCallback((item: ListItem) => item.id, [])

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.kind === 'separator') {
        return <DateSeparator label={item.label} />
      }
      if (item.kind === 'newMessageDivider') {
        return <NewMessagesDivider />
      }
      const msg = item.message
      const fromMe = msg.peerId === identity?.phoneNumber
      const replyTo = msg.replyToId
        ? (messagesById.get(msg.replyToId) ?? null)
        : null
      return (
        <ChatBubble
          message={msg}
          isFromMe={fromMe}
          onLongPress={handleBubbleLongPress}
          replyToMessage={replyTo}
          onReplyTap={handleReplyTap}
        />
      )
    },
    [
      identity?.phoneNumber,
      messagesById,
      handleBubbleLongPress,
      handleReplyTap,
    ],
  )

  const presenceColor = isOnline
    ? colors.online
    : statusText === Strings.chat.connecting
      ? colors.textDisabled
      : colors.textSecondary

  const EmptyComponent = useMemo(
    () => (
      <View style={styles.emptyWrapper}>
        <Text
          style={[
            styles.emptyTitle,
            {
              color: colors.textSecondary,
              fontFamily: typography.fontFamily.medium,
            },
          ]}
        >
          {Strings.chat.emptyChat}
        </Text>
        <Text
          style={[
            styles.emptySub,
            {
              color: colors.textDisabled,
              fontFamily: typography.fontFamily.regular,
            },
          ]}
        >
          {Strings.chat.emptyChatSub}
        </Text>
      </View>
    ),
    [colors],
  )

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      {/* Safe area top */}
      <View style={{ height: insets.top, backgroundColor: colors.surface }} />

      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
          shadows.sm,
        ]}
      >
        <AnimatedPressable
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.backBtn}
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="chevron-back"
            size={26}
            color={colors.textPrimary}
          />
        </AnimatedPressable>

        <RNPressable
          onPress={() => {}}
          style={styles.headerCenter}
          accessibilityLabel="Peer profile"
        >
          <Avatar
            name={peer?.displayName ?? peerId ?? '?'}
            uri={peer?.avatarUri}
            size="sm"
            showOnlineBadge
            isOnline={isOnline}
          />
          <View style={styles.headerTitles}>
            <Text
              style={[
                styles.headerName,
                {
                  color: colors.textPrimary,
                  fontFamily: typography.fontFamily.semiBold,
                },
              ]}
              numberOfLines={1}
            >
              {peer?.displayName ?? peerId ?? 'Chat'}
            </Text>
            <Text
              style={[
                styles.headerSub,
                {
                  color: presenceColor,
                  fontFamily: typography.fontFamily.regular,
                },
              ]}
            >
              {statusText}
            </Text>
          </View>
        </RNPressable>

        <View style={styles.headerActions}>
          <AnimatedPressable
            onPress={() => router.push(`/call/${peerId}?video=true`)}
            hitSlop={8}
            style={styles.headerActionBtn}
            accessibilityLabel="Video call"
          >
            <Ionicons
              name="videocam-outline"
              size={22}
              color={colors.textPrimary}
            />
          </AnimatedPressable>
          <AnimatedPressable
            onPress={() => router.push(`/call/${peerId}`)}
            hitSlop={8}
            style={styles.headerActionBtn}
            accessibilityLabel="Voice call"
          >
            <Ionicons
              name="call-outline"
              size={22}
              color={colors.textPrimary}
            />
          </AnimatedPressable>
        </View>
      </View>

      {/* Main content with keyboard avoidance */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Message list */}
        <View style={styles.flex}>
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
            ListFooterComponent={
              <TypingIndicator visible={isTyping} />
            }
            removeClippedSubviews={Platform.OS === 'android'}
            maxToRenderPerBatch={20}
            windowSize={10}
          />

          {/* New message pill */}
          <NewMessagePill
            visible={showNewMessagePill}
            onPress={scrollToBottom}
          />
        </View>

        {/* Attachment preview */}
        <AttachmentPreview
          attachments={pendingAttachments}
          onRemove={(id) =>
            setPendingAttachments((prev) => prev.filter((a) => a.id !== id))
          }
        />

        {/* Input bar */}
        <InputBar
          onSend={handleSend}
          onAttachmentPress={handleAttachmentPress}
          disabled={isSending || !conversationId}
          onTypingChange={onTypingStart}
          replyTo={replyToMessage}
          onCancelReply={() => setReplyToMessage(null)}
        />

        {/* Bottom safe area */}
        <View
          style={{
            height: insets.bottom,
            backgroundColor: colors.surface,
          }}
        />
      </KeyboardAvoidingView>

      {/* Reaction bar */}
      <ReactionBar
        messageId={reactionTarget ?? ''}
        visible={reactionTarget !== null}
        onReact={(emoji) => {
          console.log('React:', reactionTarget, emoji)
          setReactionTarget(null)
        }}
        onDismiss={() => setReactionTarget(null)}
        position={reactionPosition}
      />

      {/* Context menu */}
      <ContextMenu
        state={contextMenu}
        onCopy={handleContextCopy}
        onReply={handleContextReply}
        onDelete={handleContextDelete}
        onDismiss={() =>
          setContextMenu((prev) => ({ ...prev, visible: false }))
        }
      />
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },

  // Header
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    padding: spacing.xxs,
    marginRight: spacing.xxs,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    overflow: 'hidden',
  },
  headerTitles: {
    flex: 1,
    overflow: 'hidden',
  },
  headerName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
  },
  headerSub: {
    fontSize: typography.fontSize.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  headerActionBtn: {
    padding: spacing.xs,
  },

  // Message list
  listContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },

  // Empty state (inverted list, so we rotate it)
  emptyWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    transform: [{ scaleY: -1 }],
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
    marginVertical: spacing.xxs,
    maxWidth: BUBBLE_MAX_WIDTH,
  },
  wrapperRight: {
    alignSelf: 'flex-end',
  },
  wrapperLeft: {
    alignSelf: 'flex-start',
  },
  bubble: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxs,
    borderRadius: borderRadius.lg,
  },
  bubbleOutgoing: {
    borderBottomRightRadius: borderRadius.sm,
  },
  bubbleIncoming: {
    borderBottomLeftRadius: borderRadius.sm,
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
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.xs,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
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
    alignItems: 'flex-end',
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
    minHeight: INPUT_BAR_HEIGHT - spacing.xs * 2,
  },
  inputIconBtn: {
    padding: spacing.xs,
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  textInput: {
    flex: 1,
    maxHeight: 120,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? spacing.xs : spacing.xxs,
    fontSize: typography.fontSize.md,
    lineHeight: typography.fontSize.md * 1.4,
  },
  rightBtnContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  iconCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnInner: {
    width: 36,
    height: 36,
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
})
