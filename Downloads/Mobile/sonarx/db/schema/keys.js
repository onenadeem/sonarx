import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { timestampColumn } from "./columns";
export const peerKeys = sqliteTable("peer_keys", {
  peerId: text("peer_id").primaryKey(),
  publicKey: text("public_key").notNull(),
  fingerprint: text("fingerprint").notNull(),
  trustLevel: text("trust_level", {
    enum: ["unverified", "tofu", "qr_verified"],
  }).default("tofu"),
  firstSeenAt: timestampColumn("first_seen_at").notNull(),
  lastUpdatedAt: timestampColumn("last_updated_at").notNull(),
});
