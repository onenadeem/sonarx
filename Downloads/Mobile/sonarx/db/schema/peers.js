import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { booleanColumn, timestampColumn } from "./columns";
export const peers = sqliteTable("peers", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  avatarUri: text("avatar_uri"),
  publicKey: text("public_key").notNull(),
  signingPublicKey: text("signing_public_key").notNull(),
  isBlocked: booleanColumn("is_blocked").default(false),
  lastSeen: timestampColumn("last_seen"),
  addedAt: timestampColumn("added_at").notNull(),
  verified: booleanColumn("verified").default(false),
});
