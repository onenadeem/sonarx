import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const peers = sqliteTable("peers", {
    id: text("id").primaryKey(),
    displayName: text("display_name").notNull(),
    avatarUri: text("avatar_uri"),
    publicKey: text("public_key").notNull(),
    signingPublicKey: text("signing_public_key").notNull(),
    isBlocked: integer("is_blocked", { mode: "boolean" }).default(false),
    lastSeen: integer("last_seen", { mode: "timestamp" }),
    addedAt: integer("added_at", { mode: "timestamp" }).notNull(),
    verified: integer("verified", { mode: "boolean" }).default(false),
});
