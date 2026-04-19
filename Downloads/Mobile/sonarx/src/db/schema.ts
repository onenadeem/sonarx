import { relations } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// ─── Tables ───────────────────────────────────────────────────────────────────

export const contacts = sqliteTable('contacts', {
  id: text('id').primaryKey(),
  phoneNumber: text('phone_number').notNull().unique(),
  displayName: text('display_name').notNull(),
  avatarUri: text('avatar_uri'),
  lastSeen: integer('last_seen'),
  isOnline: integer('is_online').notNull().default(0),
})

export const chats = sqliteTable('chats', {
  id: text('id').primaryKey(),
  contactId: text('contact_id')
    .notNull()
    .references(() => contacts.id, { onDelete: 'cascade' }),
  lastMessageId: text('last_message_id'),
  lastMessageAt: integer('last_message_at'),
  unreadCount: integer('unread_count').notNull().default(0),
  createdAt: integer('created_at').notNull(),
})

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  chatId: text('chat_id')
    .notNull()
    .references(() => chats.id, { onDelete: 'cascade' }),
  senderId: text('sender_id').notNull(),
  content: text('content').notNull(),
  type: text('type', {
    enum: ['text', 'image', 'file', 'audio', 'video'],
  })
    .notNull()
    .default('text'),
  status: text('status', {
    enum: ['sending', 'sent', 'delivered', 'read'],
  })
    .notNull()
    .default('sending'),
  replyToId: text('reply_to_id'),
  createdAt: integer('created_at').notNull(),
  readAt: integer('read_at'),
  isDeleted: integer('is_deleted').notNull().default(0),
})

export const attachments = sqliteTable('attachments_v2', {
  id: text('id').primaryKey(),
  messageId: text('message_id')
    .notNull()
    .references(() => messages.id, { onDelete: 'cascade' }),
  uri: text('uri').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  name: text('name'),
})

// ─── Relations ────────────────────────────────────────────────────────────────

export const chatsRelations = relations(chats, ({ one, many }) => ({
  contact: one(contacts, {
    fields: [chats.contactId],
    references: [contacts.id],
  }),
  messages: many(messages),
}))

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
  attachment: one(attachments, {
    fields: [messages.id],
    references: [attachments.messageId],
  }),
}))

// ─── Types ────────────────────────────────────────────────────────────────────

export type Contact = typeof contacts.$inferSelect
export type NewContact = typeof contacts.$inferInsert

export type Chat = typeof chats.$inferSelect
export type NewChat = typeof chats.$inferInsert

export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert

export type Attachment = typeof attachments.$inferSelect
export type NewAttachment = typeof attachments.$inferInsert
