import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { conversations } from "./conversations";
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
    isDeleted: integer("is_deleted", { mode: "boolean" }).default(false),
    deletedAt: integer("deleted_at", { mode: "timestamp" }),
    sentAt: integer("sent_at", { mode: "timestamp" }).notNull(),
    deliveredAt: integer("delivered_at", { mode: "timestamp" }),
    readAt: integer("read_at", { mode: "timestamp" }),
});
