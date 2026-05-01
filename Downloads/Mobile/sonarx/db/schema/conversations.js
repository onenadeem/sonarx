import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { peers } from "./peers";
import { booleanColumn, timestampColumn } from "./columns";
export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),
  peerId: text("peer_id")
    .notNull()
    .references(() => peers.id, { onDelete: "cascade" }),
  lastMessageId: text("last_message_id"),
  lastMessageAt: timestampColumn("last_message_at"),
  unreadCount: integer("unread_count").default(0),
  isPinned: booleanColumn("is_pinned").default(false),
  isMuted: booleanColumn("is_muted").default(false),
  disappearingMessages: integer("disappearing_messages"),
});
