import { and, desc, eq, lte, ne, sql } from 'drizzle-orm'

import { db } from '@/db/client'
import {
  attachments,
  chats,
  messages,
  type Attachment,
  type Chat,
  type Message,
  type NewAttachment,
  type NewChat,
  type NewMessage,
} from '@/src/db/schema'

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function getMessages(
  chatId: string,
  limit = 50,
  offset = 0,
): Promise<Message[]> {
  return db
    .select()
    .from(messages)
    .where(and(eq(messages.chatId, chatId), eq(messages.isDeleted, 0)))
    .orderBy(desc(messages.createdAt))
    .limit(limit)
    .offset(offset)
}

export async function insertMessage(msg: NewMessage): Promise<Message> {
  await db.insert(messages).values(msg)

  const [created] = await db
    .select()
    .from(messages)
    .where(eq(messages.id, msg.id))
    .limit(1)

  if (!created) throw new Error('Failed to insert message')
  return created
}

export async function updateMessageStatus(
  id: string,
  status: Message['status'],
  timestamp?: number,
): Promise<void> {
  const updates: Partial<NewMessage> = { status }
  if (status === 'read') {
    updates.readAt = timestamp ?? Date.now()
  }
  await db.update(messages).set(updates).where(eq(messages.id, id))
}

export async function markMessagesAsRead(
  chatId: string,
  upToMessageId?: string,
): Promise<void> {
  const now = Date.now()

  if (upToMessageId) {
    const [target] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, upToMessageId))
      .limit(1)

    if (target) {
      await db
        .update(messages)
        .set({ status: 'read', readAt: now })
        .where(
          and(
            eq(messages.chatId, chatId),
            lte(messages.createdAt, target.createdAt),
            ne(messages.status, 'read'),
            eq(messages.isDeleted, 0),
          ),
        )
      return
    }
  }

  await db
    .update(messages)
    .set({ status: 'read', readAt: now })
    .where(
      and(
        eq(messages.chatId, chatId),
        ne(messages.status, 'read'),
        eq(messages.isDeleted, 0),
      ),
    )
}

export async function getUnreadCount(chatId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(
      and(
        eq(messages.chatId, chatId),
        ne(messages.status, 'read'),
        eq(messages.isDeleted, 0),
      ),
    )
  return result[0]?.count ?? 0
}

export async function deleteMessage(id: string): Promise<void> {
  await db
    .update(messages)
    .set({ isDeleted: 1, content: '' })
    .where(eq(messages.id, id))
}

// ─── Chats ────────────────────────────────────────────────────────────────────

export async function getChatByContactId(
  contactId: string,
): Promise<Chat | null> {
  const [chat] = await db
    .select()
    .from(chats)
    .where(eq(chats.contactId, contactId))
    .limit(1)
  return chat ?? null
}

export async function getOrCreateChat(contactId: string): Promise<Chat> {
  const existing = await getChatByContactId(contactId)
  if (existing) return existing

  const id = crypto.randomUUID()
  const now = Date.now()
  const newChat: NewChat = {
    id,
    contactId,
    unreadCount: 0,
    createdAt: now,
  }

  await db.insert(chats).values(newChat)

  const [created] = await db
    .select()
    .from(chats)
    .where(eq(chats.id, id))
    .limit(1)

  if (!created) throw new Error('Failed to create chat')
  return created
}

export async function updateChatLastMessage(
  chatId: string,
  messageId: string,
  timestamp: number,
): Promise<void> {
  await db
    .update(chats)
    .set({ lastMessageId: messageId, lastMessageAt: timestamp })
    .where(eq(chats.id, chatId))
}

export async function clearChatMessages(chatId: string): Promise<void> {
  await db.delete(messages).where(eq(messages.chatId, chatId))
}

// ─── Attachments ──────────────────────────────────────────────────────────────

export async function insertAttachment(
  attachment: NewAttachment,
): Promise<Attachment> {
  await db.insert(attachments).values(attachment)

  const [created] = await db
    .select()
    .from(attachments)
    .where(eq(attachments.id, attachment.id))
    .limit(1)

  if (!created) throw new Error('Failed to insert attachment')
  return created
}
