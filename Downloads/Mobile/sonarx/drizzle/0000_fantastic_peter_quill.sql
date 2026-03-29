CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`message_id` text NOT NULL,
	`file_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`local_uri` text,
	`thumbnail_uri` text,
	`width` integer,
	`height` integer,
	`duration` integer,
	`transfer_status` text DEFAULT 'pending',
	`transfer_progress` integer DEFAULT 0,
	`encryption_nonce` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`peer_id` text NOT NULL,
	`last_message_id` text,
	`last_message_at` integer,
	`unread_count` integer DEFAULT 0,
	`is_pinned` integer DEFAULT false,
	`is_muted` integer DEFAULT false,
	`disappearing_messages` integer,
	FOREIGN KEY (`peer_id`) REFERENCES `peers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `identity` (
	`id` text PRIMARY KEY NOT NULL,
	`phone_number` text NOT NULL,
	`display_name` text NOT NULL,
	`avatar_uri` text,
	`public_key` text NOT NULL,
	`secret_key` text NOT NULL,
	`signing_public_key` text NOT NULL,
	`signing_secret_key` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `identity_phone_number_unique` ON `identity` (`phone_number`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`peer_id` text NOT NULL,
	`type` text DEFAULT 'text' NOT NULL,
	`body` text,
	`encrypted_body` text,
	`attachment_id` text,
	`status` text DEFAULT 'sending' NOT NULL,
	`reply_to_id` text,
	`is_deleted` integer DEFAULT false,
	`deleted_at` integer,
	`sent_at` integer NOT NULL,
	`delivered_at` integer,
	`read_at` integer,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `peer_keys` (
	`peer_id` text PRIMARY KEY NOT NULL,
	`public_key` text NOT NULL,
	`fingerprint` text NOT NULL,
	`trust_level` text DEFAULT 'tofu',
	`first_seen_at` integer NOT NULL,
	`last_updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `peers` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`avatar_uri` text,
	`public_key` text NOT NULL,
	`signing_public_key` text NOT NULL,
	`is_blocked` integer DEFAULT false,
	`last_seen` integer,
	`added_at` integer NOT NULL,
	`verified` integer DEFAULT false
);
