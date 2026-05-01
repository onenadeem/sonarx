import { eq, desc } from "drizzle-orm";
import { db } from "./client";
import { conversations, messages, peers } from "./schema";

async function requireCreatedRecord(fetcher, message) {
  const record = await fetcher();
  if (!record) {
    throw new Error(message);
  }
  return record;
}

async function getConversationByPeerId(peerId) {
  return db.query.conversations.findFirst({
    where: eq(conversations.peerId, peerId),
  });
}

async function getMessageById(messageId) {
  return db.query.messages.findFirst({
    where: eq(messages.id, messageId),
  });
}

async function getPeerById(peerId) {
  return db.query.peers.findFirst({
    where: eq(peers.id, peerId),
  });
}

async function updateMessageStatus(messageId, status, timestampField) {
  await db
    .update(messages)
    .set({
      status,
      [timestampField]: new Date(),
    })
    .where(eq(messages.id, messageId));
}

export async function getOrCreateConversation(peerId) {
  const existing = await getConversationByPeerId(peerId);
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
  return requireCreatedRecord(
    () =>
      db.query.conversations.findFirst({
        where: eq(conversations.id, id),
      }),
    "Failed to create conversation",
  );
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
  return requireCreatedRecord(
    () => getMessageById(id),
    "Failed to create message",
  );
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
  await updateMessageStatus(messageId, "delivered", "deliveredAt");
}
export async function markMessageRead(messageId) {
  await updateMessageStatus(messageId, "read", "readAt");
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
  const existing = await getPeerById(peer.id);
  if (existing) {
    await db
      .update(peers)
      .set({
        ...peer,
        lastSeen: now,
      })
      .where(eq(peers.id, peer.id));
    return requireCreatedRecord(
      () => getPeerById(peer.id),
      "Failed to update peer",
    );
  }
  await db.insert(peers).values({
    ...peer,
    addedAt: now,
  });
  return requireCreatedRecord(
    () => getPeerById(peer.id),
    "Failed to create peer",
  );
}
