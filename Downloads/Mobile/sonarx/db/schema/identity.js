import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const identity = sqliteTable("identity", {
    id: text("id").primaryKey(),
    phoneNumber: text("phone_number").notNull().unique(),
    displayName: text("display_name").notNull(),
    avatarUri: text("avatar_uri"),
    publicKey: text("public_key").notNull(),
    secretKey: text("secret_key").notNull(),
    signingPublicKey: text("signing_public_key").notNull(),
    signingSecretKey: text("signing_secret_key").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
