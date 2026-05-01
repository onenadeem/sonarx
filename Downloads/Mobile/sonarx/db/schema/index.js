import { relations } from "drizzle-orm";
import { peers } from "./peers";
import { conversations } from "./conversations";
import { messages } from "./messages";
import { attachments } from "./attachments";
import { peerKeys } from "./keys";
export { identity } from "./identity";
export { peers } from "./peers";
export { conversations } from "./conversations";
export { messages } from "./messages";
export { attachments } from "./attachments";
export { peerKeys } from "./keys";
export const conversationsRelations = relations(conversations, ({ one, many }) => ({
    peer: one(peers, {
        fields: [conversations.peerId],
        references: [peers.id],
    }),
    messages: many(messages),
}));
export const messagesRelations = relations(messages, ({ one }) => ({
    conversation: one(conversations, {
        fields: [messages.conversationId],
        references: [conversations.id],
    }),
    attachment: one(attachments, {
        fields: [messages.attachmentId],
        references: [attachments.id],
    }),
}));
export const peersRelations = relations(peers, ({ one, many }) => ({
    key: one(peerKeys, {
        fields: [peers.id],
        references: [peerKeys.peerId],
    }),
    conversations: many(conversations),
}));
