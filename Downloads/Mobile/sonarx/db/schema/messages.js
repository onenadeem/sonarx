import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { conversations } from "./conversations";
import { booleanColumn, timestampColumn } from "./columns";
export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  peerId: text("peer_id").notNull(),
  type: text("type", {
    enum: ["text", "image", "video", "audio", "file", "system", "call_log"],
  })
    .notNull()
    .default("text"),
  body: text("body"),
  encryptedBody: text("encrypted_body"),
  attachmentId: text("attachment_id"),
  status: text("status", {
    enum: ["sending", "sent", "delivered", "read", "failed"],
  })
    .notNull()
    .default("sending"),
  replyToId: text("reply_to_id"),
  isDeleted: booleanColumn("is_deleted").default(false),
  deletedAt: timestampColumn("deleted_at"),
  sentAt: timestampColumn("sent_at").notNull(),
  deliveredAt: timestampColumn("delivered_at"),
  readAt: timestampColumn("read_at"),
});
