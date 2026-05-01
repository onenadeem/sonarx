import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { peers } from "./peers";
export const conversations = sqliteTable("conversations", {
    id: text("id").primaryKey(),
    peerId: text("peer_id")
        .notNull()
        .references(() => peers.id, { onDelete: "cascade" }),
    lastMessageId: text("last_message_id"),
    lastMessageAt: integer("last_message_at", { mode: "timestamp" }),
    unreadCount: integer("unread_count").default(0),
    isPinned: integer("is_pinned", { mode: "boolean" }).default(false),
    isMuted: integer("is_muted", { mode: "boolean" }).default(false),
    disappearingMessages: integer("disappearing_messages"),
});
