import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const peerKeys = sqliteTable("peer_keys", {
    peerId: text("peer_id").primaryKey(),
    publicKey: text("public_key").notNull(),
    fingerprint: text("fingerprint").notNull(),
    trustLevel: text("trust_level", {
        enum: ["unverified", "tofu", "qr_verified"],
    }).default("tofu"),
    firstSeenAt: integer("first_seen_at", { mode: "timestamp" }).notNull(),
    lastUpdatedAt: integer("last_updated_at", { mode: "timestamp" }).notNull(),
});
