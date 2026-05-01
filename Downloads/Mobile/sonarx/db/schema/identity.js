import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { timestampColumn } from "./columns";
export const identity = sqliteTable("identity", {
  id: text("id").primaryKey(),
  phoneNumber: text("phone_number").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatarUri: text("avatar_uri"),
  publicKey: text("public_key").notNull(),
  secretKey: text("secret_key").notNull(),
  signingPublicKey: text("signing_public_key").notNull(),
  signingSecretKey: text("signing_secret_key").notNull(),
  createdAt: timestampColumn("created_at").notNull(),
  updatedAt: timestampColumn("updated_at").notNull(),
});
