import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const attachments = sqliteTable("attachments", {
  id: text("id").primaryKey(),
  messageId: text("message_id").notNull(),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  localUri: text("local_uri"),
  thumbnailUri: text("thumbnail_uri"),
  width: integer("width"),
  height: integer("height"),
  duration: integer("duration"),
  transferStatus: text("transfer_status", {
    enum: ["pending", "transferring", "complete", "failed"],
  }).default("pending"),
  transferProgress: integer("transfer_progress").default(0),
  encryptionNonce: text("encryption_nonce"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
