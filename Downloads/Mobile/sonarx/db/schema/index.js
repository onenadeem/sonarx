import { relations } from "drizzle-orm";
import { peers } from "./peers";
import { conversations } from "./conversations";
import { messages } from "./messages";
import { attachments } from "./attachments";
import { peerKeys } from "./keys";

export * from "./identity";
export * from "./peers";
export * from "./conversations";
export * from "./messages";
export * from "./attachments";
export * from "./keys";
export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    peer: one(peers, {
      fields: [conversations.peerId],
      references: [peers.id],
    }),
    messages: many(messages),
  }),
);
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
