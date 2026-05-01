import { and, desc, eq, lte, ne, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { attachments, chats, messages, } from '@/src/db/schema';
import { requireCreatedRecord } from '@/src/db/queryHelpers';
// ─── Messages ─────────────────────────────────────────────────────────────────
export async function getMessages(chatId, limit = 50, offset = 0) {
    return db
        .select()
        .from(messages)
        .where(and(eq(messages.chatId, chatId), eq(messages.isDeleted, 0)))
        .orderBy(desc(messages.createdAt))
        .limit(limit)
        .offset(offset);
}
export async function insertMessage(msg) {
    await db.insert(messages).values(msg);
    return requireCreatedRecord(
        () => db
            .select()
            .from(messages)
            .where(eq(messages.id, msg.id))
            .limit(1)
            .then(([created]) => created),
        'Failed to insert message',
    );
}
export async function updateMessageStatus(id, status, timestamp) {
    const updates = { status };
    if (status === 'read') {
        updates.readAt = timestamp ?? Date.now();
    }
    await db.update(messages).set(updates).where(eq(messages.id, id));
}
export async function markMessagesAsRead(chatId, upToMessageId) {
    const now = Date.now();
    if (upToMessageId) {
        const [target] = await db
            .select()
            .from(messages)
            .where(eq(messages.id, upToMessageId))
            .limit(1);
        if (target) {
            await db
                .update(messages)
                .set({ status: 'read', readAt: now })
                .where(and(eq(messages.chatId, chatId), lte(messages.createdAt, target.createdAt), ne(messages.status, 'read'), eq(messages.isDeleted, 0)));
            return;
        }
    }
    await db
        .update(messages)
        .set({ status: 'read', readAt: now })
        .where(and(eq(messages.chatId, chatId), ne(messages.status, 'read'), eq(messages.isDeleted, 0)));
}
export async function getUnreadCount(chatId) {
    const result = await db
        .select({ count: sql `count(*)` })
        .from(messages)
        .where(and(eq(messages.chatId, chatId), ne(messages.status, 'read'), eq(messages.isDeleted, 0)));
    return result[0]?.count ?? 0;
}
export async function deleteMessage(id) {
    await db
        .update(messages)
        .set({ isDeleted: 1, content: '' })
        .where(eq(messages.id, id));
}
// ─── Chats ────────────────────────────────────────────────────────────────────
export async function getChatByContactId(contactId) {
    const [chat] = await db
        .select()
        .from(chats)
        .where(eq(chats.contactId, contactId))
        .limit(1);
    return chat ?? null;
}
export async function getOrCreateChat(contactId) {
    const existing = await getChatByContactId(contactId);
    if (existing)
        return existing;
    const id = crypto.randomUUID();
    const now = Date.now();
    const newChat = {
        id,
        contactId,
        unreadCount: 0,
        createdAt: now,
    };
    await db.insert(chats).values(newChat);
    return requireCreatedRecord(
        () => db
            .select()
            .from(chats)
            .where(eq(chats.id, id))
            .limit(1)
            .then(([created]) => created),
        'Failed to create chat',
    );
}
export async function updateChatLastMessage(chatId, messageId, timestamp) {
    await db
        .update(chats)
        .set({ lastMessageId: messageId, lastMessageAt: timestamp })
        .where(eq(chats.id, chatId));
}
export async function clearChatMessages(chatId) {
    await db.delete(messages).where(eq(messages.chatId, chatId));
}
// ─── Attachments ──────────────────────────────────────────────────────────────
export async function insertAttachment(attachment) {
    await db.insert(attachments).values(attachment);
    const [created] = await db
        .select()
        .from(attachments)
        .where(eq(attachments.id, attachment.id))
        .limit(1);
    if (!created)
        throw new Error('Failed to insert attachment');
    return created;
}
