import { eq, desc } from "drizzle-orm";
import { db } from "./client";
import { conversations, messages, peers, } from "./schema";
export async function getOrCreateConversation(peerId) {
    const existing = await db.query.conversations.findFirst({
        where: eq(conversations.peerId, peerId),
    });
    if (existing) {
        return existing;
    }
    const id = crypto.randomUUID();
    await db.insert(conversations).values({
        id,
        peerId,
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
    });
    const created = await db.query.conversations.findFirst({
        where: eq(conversations.id, id),
    });
    if (!created) {
        throw new Error("Failed to create conversation");
    }
    return created;
}
export async function insertMessage(msg) {
    const id = msg.id || crypto.randomUUID();
    const now = msg.sentAt ?? new Date();
    await db.insert(messages).values({
        ...msg,
        id,
        sentAt: now,
    });
    await db
        .update(conversations)
        .set({
        lastMessageId: id,
        lastMessageAt: now,
    })
        .where(eq(conversations.id, msg.conversationId));
    const created = await db.query.messages.findFirst({
        where: eq(messages.id, id),
    });
    if (!created) {
        throw new Error("Failed to create message");
    }
    return created;
}
export async function getMessages(conversationId, limit = 50, offset = 0) {
    return db.query.messages.findMany({
        where: eq(messages.conversationId, conversationId),
        orderBy: desc(messages.sentAt),
        limit,
        offset,
    });
}
export async function markMessageDelivered(messageId) {
    await db
        .update(messages)
        .set({
        status: "delivered",
        deliveredAt: new Date(),
    })
        .where(eq(messages.id, messageId));
}
export async function markMessageRead(messageId) {
    await db
        .update(messages)
        .set({
        status: "read",
        readAt: new Date(),
    })
        .where(eq(messages.id, messageId));
}
export async function getConversations() {
    const results = await db.query.conversations.findMany({
        orderBy: desc(conversations.lastMessageAt),
        with: {
            peer: true,
        },
    });
    return results;
}
export async function upsertPeer(peer) {
    const now = new Date();
    const existing = await db.query.peers.findFirst({
        where: eq(peers.id, peer.id),
    });
    if (existing) {
        await db
            .update(peers)
            .set({
            ...peer,
            lastSeen: now,
        })
            .where(eq(peers.id, peer.id));
        const updated = await db.query.peers.findFirst({
            where: eq(peers.id, peer.id),
        });
        if (!updated) {
            throw new Error("Failed to update peer");
        }
        return updated;
    }
    await db.insert(peers).values({
        ...peer,
        addedAt: now,
    });
    const created = await db.query.peers.findFirst({
        where: eq(peers.id, peer.id),
    });
    if (!created) {
        throw new Error("Failed to create peer");
    }
    return created;
}
