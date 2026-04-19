import { useCallback, useEffect, useRef, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import { decodeBase64 } from 'tweetnacl-util'
import { eq } from 'drizzle-orm'

import { db } from '@/db/client'
import {
  getMessages,
  insertMessage,
  getOrCreateChat,
  updateChatLastMessage,
  updateMessageStatus as dbUpdateMessageStatus,
} from '@/src/db/queries/messages'
import { useMessagesStore } from '@/src/store/messagesStore'
import { useIdentityStore } from '@/stores/identity.store'
import { sendGunMessage } from '@/lib/p2p/messaging'
import type { Message, NewMessage } from '@/src/db/schema'

const SECRET_KEY_STORE_KEY = 'sonarx-secret-keys'
const PAGE_SIZE = 50

export function useMessages(chatId: string | null) {
  const { messagesByChatId, setMessages } = useMessagesStore()
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const offsetRef = useRef(0)

  const messages = chatId ? (messagesByChatId[chatId] ?? []) : []

  useEffect(() => {
    if (!chatId) return

    setIsLoading(true)
    offsetRef.current = 0

    getMessages(chatId, PAGE_SIZE, 0)
      .then((data) => {
        setMessages(chatId, data)
        setHasMore(data.length === PAGE_SIZE)
        offsetRef.current = data.length
      })
      .catch((e) => console.error('[useMessages] load error:', e))
      .finally(() => setIsLoading(false))
  }, [chatId, setMessages])

  const loadMore = useCallback(async () => {
    if (!chatId || !hasMore || isLoading) return

    setIsLoading(true)
    try {
      const older = await getMessages(chatId, PAGE_SIZE, offsetRef.current)
      if (older.length === 0) {
        setHasMore(false)
        return
      }
      setMessages(chatId, [...messages, ...older])
      setHasMore(older.length === PAGE_SIZE)
      offsetRef.current += older.length
    } catch (e) {
      console.error('[useMessages] loadMore error:', e)
    } finally {
      setIsLoading(false)
    }
  }, [chatId, hasMore, isLoading, messages, setMessages])

  return { messages, isLoading, loadMore, hasMore }
}

export function useSendMessage(peerId: string) {
  const identity = useIdentityStore((state) => state.identity)
  const addMessage = useMessagesStore((state) => state.addMessage)
  const updateStoreStatus = useMessagesStore(
    (state) => state.updateMessageStatus,
  )
  const addOrUpdateChat = useMessagesStore((state) => state.addOrUpdateChat)
  const [isSending, setIsSending] = useState(false)

  const sendMessage = useCallback(
    async (text: string, replyToId?: string): Promise<void> => {
      if (!identity) return
      setIsSending(true)
      try {
        const msgId = crypto.randomUUID()
        const chat = await getOrCreateChat(peerId)
        const now = Date.now()

        const newMsg: NewMessage = {
          id: msgId,
          chatId: chat.id,
          senderId: identity.phoneNumber,
          content: text,
          type: 'text',
          status: 'sending',
          replyToId: replyToId ?? null,
          createdAt: now,
          readAt: null,
          isDeleted: 0,
        }

        const saved = await insertMessage(newMsg)
        addMessage(chat.id, saved)
        await updateChatLastMessage(chat.id, msgId, now)
        addOrUpdateChat({ ...chat, lastMessageId: msgId, lastMessageAt: now })

        const peer = await db.query.peers.findFirst({
          where: (p, { eq }) => eq(p.id, peerId),
        })

        if (!peer) {
          console.warn('[useSendMessage] Peer not found:', peerId)
          return
        }

        const secretKeyStr = await SecureStore.getItemAsync(SECRET_KEY_STORE_KEY)
        if (!secretKeyStr) {
          console.warn('[useSendMessage] No secret key available')
          return
        }

        const mySecretKey = decodeBase64(secretKeyStr)
        const peerPublicKey = decodeBase64(peer.publicKey)

        await sendGunMessage(
          peerId,
          msgId,
          text,
          peerPublicKey,
          mySecretKey,
          identity.phoneNumber,
        )

        await dbUpdateMessageStatus(msgId, 'sent')
        updateStoreStatus(chat.id, msgId, 'sent')
      } catch (e) {
        console.error('[useSendMessage] error:', e)
      } finally {
        setIsSending(false)
      }
    },
    [peerId, identity, addMessage, updateStoreStatus, addOrUpdateChat],
  )

  return { sendMessage, isSending }
}

export function useMessageStatus(messageId: string) {
  const messagesByChatId = useMessagesStore(
    (state) => state.messagesByChatId,
  )

  const message = Object.values(messagesByChatId)
    .flat()
    .find((m) => m.id === messageId)

  return {
    status: (message?.status ?? 'sending') as Message['status'],
    readAt: message?.readAt ?? null,
    deliveredAt: null as number | null,
  }
}
