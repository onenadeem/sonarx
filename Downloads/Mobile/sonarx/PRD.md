# 📱 SecureLink — P2P Encrypted Chat App
## Product Requirements Document (PRD)
### Version 1.0 | Expo + React Native | No Backend

---

> **Purpose of this Document**
> This PRD is structured as a series of sequential **AI Tasks** — each task is self-contained and small enough to fit within a single AI IDE context window. An AI developer should execute Task 01, commit, then proceed to Task 02, and so on. Every task references the global context in this document. Read the entire document before starting Task 01.

---

## 📋 Table of Contents
1. [Product Vision](#1-product-vision)
2. [Core Architecture Philosophy](#2-core-architecture-philosophy)
3. [Complete Package Manifest](#3-complete-package-manifest)
4. [Project Folder Structure](#4-project-folder-structure)
5. [Database Schema (SQLite + Drizzle)](#5-database-schema)
6. [P2P Networking Architecture](#6-p2p-networking-architecture)
7. [Security Architecture](#7-security-architecture)
8. [UI/UX Design System](#8-uiux-design-system)
9. [Sequential AI Task List](#9-sequential-ai-task-list)
   - Task 01: Project Scaffold & Dependencies
   - Task 02: NativeWind + shadcn Design System
   - Task 03: Database Schema & Drizzle Setup
   - Task 04: Phone Identity & SIM Verification
   - Task 05: E2E Encryption Layer
   - Task 06: GUN.js P2P Signaling & Discovery
   - Task 07: WebRTC Core Engine
   - Task 08: Contacts / Peer Discovery Screen
   - Task 09: Chat Engine & Message Store
   - Task 10: File Transfer Engine
   - Task 11: Image & Media Sharing
   - Task 12: 1-on-1 Video Call Screen
   - Task 13: Notifications & Background
   - Task 14: Settings, Profile & Security
   - Task 15: QA Hardening & Final Polish

---

## 1. Product Vision

**SecureLink** is a fully peer-to-peer, end-to-end encrypted mobile chat application built with Expo. It works like WhatsApp but:

- **Zero backend servers** owned by us. All persistence is on-device (SQLite).
- **Phone number = identity**, verified via SIM detection (no SMS OTP server needed).
- **P2P messaging** using WebRTC data channels. GUN.js provides decentralized signaling.
- **1-on-1 only**. No group chats. Maximum privacy.
- **Unlimited file transfer** via WebRTC data channels (chunked streaming).
- **1-on-1 video calls** via WebRTC media streams.
- **shadcn/ui aesthetic** via react-native-reusables + NativeWind.
- **All data lives on device**. If you delete the app, your data is gone.

### What Makes It Truly Serverless?
| Feature | Mechanism |
|---|---|
| Identity | Phone number + locally generated Ed25519 keypair |
| Phone verification | SIM card number read on-device (no SMS OTP) |
| Peer Discovery | GUN.js public relay peers (decentralized mesh) |
| WebRTC Signaling | GUN.js (encrypted SDP exchange) |
| Message Delivery | WebRTC DataChannel (direct device-to-device) |
| File Transfer | WebRTC DataChannel (chunked, 16 KB chunks) |
| Video/Audio Call | WebRTC MediaStream |
| Data Storage | expo-sqlite (on-device only) |
| Encryption | NaCl (TweetNaCl) — X25519 Diffie-Hellman + XSalsa20-Poly1305 |

---

## 2. Core Architecture Philosophy

```
┌──────────────────────────────────────────────────────┐
│                  DEVICE A (Alice)                    │
│  ┌─────────────┐   ┌────────────┐  ┌─────────────┐  │
│  │  Expo App   │   │  SQLite    │  │ Crypto Keys │  │
│  │  (UI Layer) │   │  (Drizzle) │  │  (Keychain) │  │
│  └──────┬──────┘   └────────────┘  └─────────────┘  │
│         │                                            │
│  ┌──────▼────────────────────────────────────────┐  │
│  │              P2P Engine Layer                  │  │
│  │  ┌──────────────┐   ┌──────────────────────┐  │  │
│  │  │   GUN.js     │   │   react-native-webrtc│  │  │
│  │  │  (Signaling) │   │   (Data + Media)     │  │  │
│  │  └──────────────┘   └──────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────┬────────────────────────────────┘
                      │ WebRTC ICE / STUN / TURN
                      │ (direct P2P tunnel)
┌─────────────────────▼────────────────────────────────┐
│                  DEVICE B (Bob)                      │
│  (same architecture mirror)                          │
└──────────────────────────────────────────────────────┘

Decentralized GUN Relay Network (public, no account needed):
  gun.eco relays — just for SDP offer/answer exchange
  All SDP payloads are E2E encrypted before hitting GUN
```

### Data Flow for a Message
1. Alice types message → encrypted locally with Bob's public key (NaCl box)
2. If Bob is online (WebRTC peer connected) → message sent via DataChannel directly
3. If Bob is offline → encrypted message queued in GUN.js (ephemeral, auto-expiry 7 days)
4. Bob's device connects → drains the GUN queue → decrypts → stores in SQLite
5. Neither relay nor GUN node ever sees plaintext

---

## 3. Complete Package Manifest

### `package.json` — Production Dependencies

```json
{
  "dependencies": {
    "expo": "~53.0.0",
    "expo-router": "~4.0.0",
    "react": "18.3.2",
    "react-native": "0.76.5",

    "nativewind": "^4.1.23",
    "tailwindcss": "^3.4.16",

    "expo-sqlite": "~15.2.14",
    "drizzle-orm": "^0.44.2",
    "expo-drizzle-studio-plugin": "latest",

    "react-native-webrtc": "^125.0.0",
    "@config-plugins/react-native-webrtc": "^9.0.0",

    "gun": "^0.2020.1240",
    "expo-crypto": "~13.0.0",
    "tweetnacl": "^1.0.3",
    "tweetnacl-util": "^0.15.1",

    "expo-contacts": "~13.0.0",
    "expo-phone-number-hint": "~0.1.0",
    "react-native-phone-number-input": "^2.1.0",
    "libphonenumber-js": "^1.11.4",

    "expo-file-system": "~18.0.0",
    "expo-image-picker": "~15.0.7",
    "expo-document-picker": "~12.0.2",
    "expo-av": "~15.0.2",
    "expo-media-library": "~16.0.4",
    "expo-image": "~2.0.0",

    "expo-notifications": "~0.29.9",
    "expo-background-fetch": "~12.0.2",
    "expo-task-manager": "~12.0.1",
    "expo-keep-awake": "~13.0.2",

    "expo-secure-store": "~14.0.0",
    "expo-local-authentication": "~14.0.1",
    "expo-application": "~5.9.1",
    "expo-device": "~7.0.1",
    "expo-cellular": "~7.0.0",

    "zustand": "^5.0.2",
    "@tanstack/react-query": "^5.81.5",
    "react-native-get-random-values": "^1.11.0",

    "react-native-gesture-handler": "~2.21.2",
    "react-native-reanimated": "~3.16.1",
    "react-native-safe-area-context": "5.0.0",
    "react-native-screens": "~4.5.0",
    "react-native-svg": "15.9.0",

    "@react-native-community/netinfo": "11.4.1",
    "react-native-mmkv": "^3.2.0",
    "date-fns": "^4.1.0",
    "zod": "^3.24.1",
    "uuid": "^11.1.0"
  }
}
```

### Dev Dependencies
```json
{
  "devDependencies": {
    "drizzle-kit": "^0.22.8",
    "typescript": "^5.8.0",
    "@types/react": "~18.3.12",
    "babel-plugin-inline-import": "^3.0.0",
    "prettier": "^3.4.2",
    "eslint": "^9.20.0",
    "@expo/vector-icons": "^14.0.4"
  }
}
```

### Native Config (app.json plugins array)
```json
{
  "plugins": [
    "expo-router",
    ["@config-plugins/react-native-webrtc", {
      "cameraPermission": "SecureLink needs camera for video calls",
      "microphonePermission": "SecureLink needs microphone for calls"
    }],
    ["expo-sqlite", { "useSQLCipher": true }],
    ["expo-contacts", { "contactsPermission": "To find your friends on SecureLink" }],
    ["expo-media-library", {
      "photosPermission": "To save received photos",
      "savePhotosPermission": "To save received photos",
      "isAccessMediaLocationEnabled": true
    }],
    ["expo-image-picker", {
      "photosPermission": "To share photos with contacts",
      "cameraPermission": "To take photos to share"
    }],
    ["expo-notifications", { "icon": "./assets/notification-icon.png" }],
    "expo-build-properties",
    ["expo-build-properties", {
      "android": { "minSdkVersion": 24, "compileSdkVersion": 35 },
      "ios": { "deploymentTarget": "15.1" }
    }]
  ]
}
```

---

## 4. Project Folder Structure

```
securelink/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout (providers)
│   ├── index.tsx                 # Redirect → onboarding or home
│   ├── (onboarding)/
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx           # Welcome + feature overview
│   │   ├── phone.tsx             # Phone number entry + SIM check
│   │   └── profile.tsx           # Display name + avatar setup
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab navigator
│   │   ├── chats.tsx             # Chat list screen
│   │   ├── contacts.tsx          # Peer discovery / contacts
│   │   └── settings.tsx          # Settings screen
│   ├── chat/
│   │   └── [peerId].tsx          # 1-on-1 chat screen
│   ├── call/
│   │   └── [peerId].tsx          # Video/audio call screen
│   ├── profile/
│   │   └── [peerId].tsx          # View peer's profile
│   └── modal/
│       ├── attachment-viewer.tsx  # Full-screen attachment viewer
│       └── call-incoming.tsx      # Incoming call overlay
│
├── components/
│   ├── ui/                       # shadcn-style primitives (copy-paste)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── sheet.tsx
│   │   ├── skeleton.tsx
│   │   ├── switch.tsx
│   │   ├── text.tsx
│   │   └── typography.tsx
│   ├── chat/
│   │   ├── MessageBubble.tsx
│   │   ├── MessageInput.tsx
│   │   ├── AttachmentPicker.tsx
│   │   ├── FilePreview.tsx
│   │   ├── ImageMessage.tsx
│   │   ├── AudioMessage.tsx
│   │   └── ChatHeader.tsx
│   ├── contacts/
│   │   ├── PeerCard.tsx
│   │   ├── OnlineIndicator.tsx
│   │   └── ContactList.tsx
│   ├── call/
│   │   ├── VideoCallView.tsx
│   │   ├── CallControls.tsx
│   │   └── IncomingCallBanner.tsx
│   └── common/
│       ├── QRCode.tsx
│       ├── PhoneInput.tsx
│       └── LoadingScreen.tsx
│
├── db/
│   ├── client.ts                 # Drizzle + SQLite setup
│   ├── schema/
│   │   ├── index.ts              # Re-exports all schemas
│   │   ├── identity.ts           # Local user identity
│   │   ├── peers.ts              # Known peers table
│   │   ├── conversations.ts      # Conversation metadata
│   │   ├── messages.ts           # Messages table
│   │   ├── attachments.ts        # Attachment metadata
│   │   └── keys.ts               # Stored peer public keys
│   └── migrations/               # Auto-generated by drizzle-kit
│
├── lib/
│   ├── crypto/
│   │   ├── index.ts              # Main crypto exports
│   │   ├── identity.ts           # Key generation, identity management
│   │   ├── box.ts                # Encrypt/decrypt messages
│   │   └── fingerprint.ts        # Key fingerprint verification
│   ├── p2p/
│   │   ├── gun.ts                # GUN.js setup + helpers
│   │   ├── signaling.ts          # WebRTC SDP signaling via GUN
│   │   ├── peer-manager.ts       # WebRTC peer lifecycle
│   │   ├── data-channel.ts       # Message/file sending over DataChannel
│   │   └── discovery.ts          # Peer presence + discovery
│   ├── phone/
│   │   ├── verify.ts             # SIM number detection
│   │   └── format.ts             # libphonenumber-js helpers
│   ├── transfer/
│   │   ├── chunker.ts            # File → chunks
│   │   ├── assembler.ts          # Chunks → file
│   │   └── progress.ts           # Transfer progress tracking
│   └── hooks/
│       ├── usePeer.ts            # WebRTC peer connection hook
│       ├── useMessages.ts        # Live message query hook
│       ├── useTransfer.ts        # File transfer state hook
│       ├── useCall.ts            # Video call state hook
│       └── useOnlineStatus.ts   # Peer online status hook
│
├── stores/
│   ├── identity.store.ts         # Current user (Zustand)
│   ├── peers.store.ts            # Active peer connections
│   ├── call.store.ts             # Active call state
│   └── app.store.ts              # App-level state
│
├── constants/
│   ├── colors.ts                 # shadcn color tokens
│   ├── theme.ts                  # NativeWind theme config
│   └── webrtc.ts                 # ICE servers config
│
├── assets/
│   ├── images/
│   ├── fonts/
│   └── icons/
│
├── drizzle/                      # Generated migration files
├── app.json
├── babel.config.js
├── drizzle.config.ts
├── metro.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 5. Database Schema

### `db/schema/identity.ts`
```ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const identity = sqliteTable("identity", {
  id: text("id").primaryKey(),             // Always "local_user"
  phoneNumber: text("phone_number").notNull().unique(), // +91XXXXXXXXXX
  displayName: text("display_name").notNull(),
  avatarUri: text("avatar_uri"),
  publicKey: text("public_key").notNull(),  // Base64 X25519 public key
  secretKey: text("secret_key").notNull(),  // Base64 X25519 secret key (encrypted at rest)
  signingPublicKey: text("signing_public_key").notNull(), // Ed25519 for peer verification
  signingSecretKey: text("signing_secret_key").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
```

### `db/schema/peers.ts`
```ts
export const peers = sqliteTable("peers", {
  id: text("id").primaryKey(),             // Phone number E.164 (+911234567890)
  displayName: text("display_name").notNull(),
  avatarUri: text("avatar_uri"),
  publicKey: text("public_key").notNull(),  // Their X25519 public key
  signingPublicKey: text("signing_public_key").notNull(),
  isBlocked: integer("is_blocked", { mode: "boolean" }).default(false),
  lastSeen: integer("last_seen", { mode: "timestamp" }),
  addedAt: integer("added_at", { mode: "timestamp" }).notNull(),
  verified: integer("verified", { mode: "boolean" }).default(false), // QR verified
});
```

### `db/schema/conversations.ts`
```ts
export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),             // UUID
  peerId: text("peer_id").notNull()
    .references(() => peers.id, { onDelete: "cascade" }),
  lastMessageId: text("last_message_id"),
  lastMessageAt: integer("last_message_at", { mode: "timestamp" }),
  unreadCount: integer("unread_count").default(0),
  isPinned: integer("is_pinned", { mode: "boolean" }).default(false),
  isMuted: integer("is_muted", { mode: "boolean" }).default(false),
  disappearingMessages: integer("disappearing_messages"), // Seconds, null = off
});
```

### `db/schema/messages.ts`
```ts
export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),             // UUID generated by sender
  conversationId: text("conversation_id").notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  peerId: text("peer_id").notNull(),       // Sender phone number
  type: text("type", {
    enum: ["text", "image", "video", "audio", "file", "system", "call_log"]
  }).notNull().default("text"),
  body: text("body"),                       // Plaintext after decryption (text messages)
  encryptedBody: text("encrypted_body"),   // Stored encrypted form
  attachmentId: text("attachment_id"),     // FK to attachments
  status: text("status", {
    enum: ["sending", "sent", "delivered", "read", "failed"]
  }).notNull().default("sending"),
  replyToId: text("reply_to_id"),          // For reply-to feature
  isDeleted: integer("is_deleted", { mode: "boolean" }).default(false),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  sentAt: integer("sent_at", { mode: "timestamp" }).notNull(),
  deliveredAt: integer("delivered_at", { mode: "timestamp" }),
  readAt: integer("read_at", { mode: "timestamp" }),
});
```

### `db/schema/attachments.ts`
```ts
export const attachments = sqliteTable("attachments", {
  id: text("id").primaryKey(),
  messageId: text("message_id").notNull(),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),   // Bytes
  localUri: text("local_uri"),                 // Local filesystem path after received
  thumbnailUri: text("thumbnail_uri"),         // For images/video
  width: integer("width"),
  height: integer("height"),
  duration: integer("duration"),               // For audio/video in ms
  transferStatus: text("transfer_status", {
    enum: ["pending", "transferring", "complete", "failed"]
  }).default("pending"),
  transferProgress: integer("transfer_progress").default(0), // 0–100
  encryptionNonce: text("encryption_nonce"),  // NaCl nonce used for file encryption
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
```

### `db/schema/keys.ts`
```ts
export const peerKeys = sqliteTable("peer_keys", {
  peerId: text("peer_id").primaryKey(),
  publicKey: text("public_key").notNull(),
  fingerprint: text("fingerprint").notNull(),   // SHA-256 hex of pubkey
  trustLevel: text("trust_level", {
    enum: ["unverified", "tofu", "qr_verified"]
  }).default("tofu"),
  firstSeenAt: integer("first_seen_at", { mode: "timestamp" }).notNull(),
  lastUpdatedAt: integer("last_updated_at", { mode: "timestamp" }).notNull(),
});
```

---

## 6. P2P Networking Architecture

### 6.1 GUN.js — Decentralized Signaling

GUN.js is a distributed, real-time, graph database. It connects to a mesh of public relay peers. We use it **only for signaling** (SDP exchange) and **offline message queuing**. All data written to GUN is encrypted.

**Public GUN relays used (no account required):**
- `https://gun-manhattan.herokuapp.com/gun`
- `https://peer.wallie.io/gun`
- `https://gundb-relay-milheirofernandes.b4a.run/gun`
- `https://us-east-1-1.linvodb.com/gun`

```ts
// lib/p2p/gun.ts
import Gun from "gun";

export const gun = Gun({
  peers: [
    "https://gun-manhattan.herokuapp.com/gun",
    "https://peer.wallie.io/gun",
  ],
  localStorage: false, // We use SQLite
  radisk: false,
});

// Namespace: all SecureLink data lives under "securelink/v1/"
export const SL_NAMESPACE = "securelink/v1";
```

### 6.2 Peer Presence Protocol

Each user announces presence every 30 seconds:
```ts
// GUN path: securelink/v1/presence/{phoneNumber}
{
  peerId: "+911234567890",
  publicKey: "base64...",
  signingPublicKey: "base64...",
  displayName: "Alice",
  timestamp: 1716000000000,   // Must be within 60s to be "online"
  signature: "base64...",     // Ed25519 signature of (peerId + timestamp)
}
```

### 6.3 WebRTC Signaling Flow (via GUN)

```
Alice wants to call/message Bob:

1. Alice creates RTCPeerConnection
2. Alice generates SDP Offer
3. Alice encrypts offer with Bob's public key
4. Alice writes to GUN: securelink/v1/signal/{bob_id}/{alice_id}/offer → {encrypted_offer}
5. Bob's app is subscribed to GUN path: securelink/v1/signal/{bob_id}/#
6. Bob decrypts offer → creates RTCPeerConnection → generates SDP Answer
7. Bob encrypts answer with Alice's public key
8. Bob writes to GUN: securelink/v1/signal/{alice_id}/{bob_id}/answer → {encrypted_answer}
9. ICE candidates exchanged similarly under securelink/v1/ice/{target_id}/{source_id}/#
10. WebRTC tunnel established — GUN no longer needed for this session
```

### 6.4 ICE Server Configuration

```ts
// constants/webrtc.ts
export const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
  // TURN servers — open source, community-run (fallback for strict NAT)
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];
```

### 6.5 Data Channel Message Protocol

All messages are sent as JSON strings over the DataChannel:

```ts
type DataChannelPacket =
  | { type: "message"; payload: EncryptedMessage }
  | { type: "file_meta"; payload: FileMeta }
  | { type: "file_chunk"; payload: FileChunk }
  | { type: "file_ack"; payload: { fileId: string; chunkIndex: number } }
  | { type: "delivery_receipt"; payload: { messageId: string } }
  | { type: "read_receipt"; payload: { messageId: string } }
  | { type: "typing"; payload: { isTyping: boolean } }
  | { type: "call_request"; payload: CallRequest }
  | { type: "call_accept"; payload: { callId: string } }
  | { type: "call_reject"; payload: { callId: string; reason: string } }
  | { type: "call_end"; payload: { callId: string } };
```

### 6.6 File Transfer — Chunked P2P

Files of **any size** are transferred in 16 KB chunks over the WebRTC DataChannel:
1. Sender sends `file_meta` → receiver allocates buffer
2. Sender streams chunks `file_chunk[0]`, `file_chunk[1]`, ...
3. Receiver acknowledges every 10th chunk (`file_ack`)
4. On completion, receiver assembles file → saves to expo-file-system → shows in chat
5. All chunks are encrypted (NaCl secretbox with per-file key)

---

## 7. Security Architecture

### 7.1 Key Management

```
On first launch:
  1. Generate X25519 keypair (NaCl box keypair) → for message encryption
  2. Generate Ed25519 keypair (NaCl sign keypair) → for identity signatures
  3. Store secret keys in expo-secure-store (iOS Keychain / Android Keystore)
  4. Store public keys in SQLite (identity table) AND announce via GUN presence

Key derivation for messages (X3DH-simplified):
  sharedSecret = nacl.box.before(recipientPublicKey, senderSecretKey)
  // This is a 32-byte Curve25519 DH shared secret
  // Same secret on both ends — used for nacl.box encryption
```

### 7.2 Message Encryption

```ts
// lib/crypto/box.ts
import nacl from "tweetnacl";
import { encodeBase64, decodeBase64 } from "tweetnacl-util";

export function encryptMessage(
  plaintext: string,
  recipientPublicKey: Uint8Array,
  mySecretKey: Uint8Array
): { ciphertext: string; nonce: string } {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const messageUint8 = new TextEncoder().encode(plaintext);
  const encrypted = nacl.box(messageUint8, nonce, recipientPublicKey, mySecretKey);
  return {
    ciphertext: encodeBase64(encrypted),
    nonce: encodeBase64(nonce),
  };
}

export function decryptMessage(
  ciphertext: string,
  nonce: string,
  senderPublicKey: Uint8Array,
  mySecretKey: Uint8Array
): string | null {
  const decrypted = nacl.box.open(
    decodeBase64(ciphertext),
    decodeBase64(nonce),
    senderPublicKey,
    mySecretKey
  );
  if (!decrypted) return null;
  return new TextDecoder().decode(decrypted);
}
```

### 7.3 SQLite Encryption at Rest

`expo-sqlite` with `useSQLCipher: true` encrypts the entire database file using AES-256. The encryption key is:
- Derived from a device-specific secret stored in `expo-secure-store`
- Optionally protected by biometric authentication (Face ID / fingerprint)

### 7.4 TOFU (Trust On First Use)

When Alice first receives a message from Bob:
1. Bob's public key fingerprint is shown to Alice as a colored emoji phrase (like Signal)
2. Alice taps "Trust" → key stored with `trustLevel = "tofu"`
3. For higher security, Alice can scan Bob's QR code in person → `trustLevel = "qr_verified"`

### 7.5 Key Fingerprint Display

Fingerprint = SHA-256(publicKey) displayed as 12 emoji in 4 groups:
```
🌟 🦊 🌙   🔥 💧 🌊   🎯 🌈 🦋   ⚡ 🌺 🎪
```
Both parties should see identical emoji. If different → MITM attack.

---

## 8. UI/UX Design System

### 8.1 Foundation

- **Component library**: `react-native-reusables` (shadcn port for React Native)
- **Styling**: NativeWind v4 (Tailwind CSS for React Native)
- **Fonts**: Inter (via expo-font)
- **Icons**: `@expo/vector-icons` (Feather icon set primarily)
- **Colors**: shadcn default palette — Zinc base, Zinc-950 dark background

### 8.2 Color Tokens (NativeWind CSS Variables)

```css
/* globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --secondary: 240 4.8% 95.9%;
  --secondary-foreground: 240 5.9% 10%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --destructive: 0 84.2% 60.2%;
  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 240 5.9% 10%;
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --card: 240 10% 3.9%;
  --primary: 0 0% 98%;
  --primary-foreground: 240 5.9% 10%;
  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;
  --border: 240 3.7% 15.9%;
  --input: 240 3.7% 15.9%;
}
```

### 8.3 Chat Bubble Design

```
Sent message (right side):
┌─────────────────────────────┐
│  Message text here...       │  ← bg: primary, text: primary-foreground
│                      12:34 ✓│
└─────────────────────────────┘

Received message (left side):
┌─────────────────────────────┐
│  Received text here...      │  ← bg: card, text: foreground
│  12:33                      │
└─────────────────────────────┘
```

### 8.4 Navigation Structure

```
Root Stack
├── Onboarding Stack (if no identity)
│   ├── welcome
│   ├── phone
│   └── profile
└── Main App (after onboarding)
    ├── Tabs
    │   ├── Chats (list of conversations)
    │   ├── Contacts (peer discovery)
    │   └── Settings
    └── Stack (on top of tabs)
        ├── chat/[peerId]
        ├── call/[peerId]
        ├── profile/[peerId]
        └── Modals
            ├── attachment-viewer
            └── call-incoming
```

---

## 9. Sequential AI Task List

> **⚠️ IMPORTANT INSTRUCTIONS FOR AI IDE:**
> - Complete **one task at a time** in order.
> - Each task is self-contained. Read the task fully before writing any code.
> - After completing a task, verify it builds (`npx expo start` shows no red errors).
> - Do not start the next task until the current one compiles.
> - All file paths are relative to the project root `securelink/`.
> - TypeScript strict mode is ON. No `any` types without explicit justification.
> - Every function must have JSDoc comment.

---

### TASK 01 — Project Scaffold & Core Dependencies
**Estimated complexity**: Low | **Files created**: ~12

#### Objective
Bootstrap the Expo project with correct SDK version, configure all native plugins, set up Metro bundler for SQL files, and install every package from the manifest.

#### Steps

**01.1** Create new Expo project:
```bash
npx create-expo-app@latest securelink --template tabs
cd securelink
```

**01.2** Install all production dependencies exactly as listed in Section 3.

**01.3** Install all dev dependencies exactly as listed in Section 3.

**01.4** Create `metro.config.js`:
```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Required for Drizzle SQL migration files
config.resolver.sourceExts.push("sql");

module.exports = withNativeWind(config, { input: "./global.css" });
```

**01.5** Create `babel.config.js`:
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      "inline-import",       // For Drizzle SQL files
      "react-native-reanimated/plugin", // Must be last
    ],
  };
};
```

**01.6** Create `tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
    },
  },
};
```

**01.7** Create `global.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
  }
  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;
  }
}
```

**01.8** Create `drizzle.config.ts`:
```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema/index.ts",
  out: "./drizzle",
  dialect: "sqlite",
  driver: "expo",
});
```

**01.9** Update `tsconfig.json` with strict mode and path aliases:
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "~/*": ["./*"]
    }
  }
}
```

**01.10** Create `app.json` with full plugin configuration from Section 3.

**01.11** Create placeholder `app/_layout.tsx`:
```tsx
import "../global.css";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView className="flex-1">
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
```

**01.12** Verify: Run `npx expo start` — app should load with no fatal errors.

---

### TASK 02 — NativeWind + shadcn Design System Setup
**Estimated complexity**: Medium | **Files created**: ~15

#### Objective
Set up all `components/ui/` primitives following the `react-native-reusables` pattern. These are the building blocks used in every subsequent screen.

#### Components to Create

**02.1** `components/ui/text.tsx`
Wraps `Text` with NativeWind class support and applies foreground color by default.

**02.2** `components/ui/button.tsx`
Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
Sizes: `default`, `sm`, `lg`, `icon`
Should show loading spinner when `isLoading` prop is true.

**02.3** `components/ui/input.tsx`
Styled text input with border, focus ring, label, error state.

**02.4** `components/ui/avatar.tsx`
Shows image or initials fallback. Props: `uri`, `name`, `size` (sm/md/lg).
Show online indicator as a colored dot overlay.

**02.5** `components/ui/badge.tsx`
Variants: `default`, `secondary`, `destructive`, `outline`

**02.6** `components/ui/card.tsx`
`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`

**02.7** `components/ui/skeleton.tsx`
Animated shimmer placeholder using Reanimated.

**02.8** `components/ui/sheet.tsx`
Bottom sheet using Reanimated. Props: `isOpen`, `onClose`, `children`, `snapPoints`.

**02.9** `components/ui/dialog.tsx`
Modal dialog with backdrop. Props: `isOpen`, `onClose`, `title`, `description`, `children`.

**02.10** `components/ui/switch.tsx`
Toggle switch with animated thumb.

**02.11** `components/ui/typography.tsx`
`H1`, `H2`, `H3`, `H4`, `P`, `Lead`, `Muted`, `Small`, `Code` variants.

**02.12** `components/common/LoadingScreen.tsx`
Full-screen spinner with optional message text.

**02.13** `constants/colors.ts`
Export typed color constants matching the CSS variables.

**02.14** Create a `ThemeProvider` that:
- Reads system color scheme via `useColorScheme`
- Stores user preference in `react-native-mmkv`
- Applies `dark` class to root view

**02.15** Integrate `ThemeProvider` into `app/_layout.tsx`.

#### Verification
All components must render without errors in a test screen. Create `app/(onboarding)/welcome.tsx` as a temporary test screen that imports and renders one of each component.

---

### TASK 03 — Database Schema & Drizzle ORM Setup
**Estimated complexity**: Medium | **Files created**: ~12

#### Objective
Set up the complete SQLite database with Drizzle ORM, all schemas from Section 5, and the migration system.

#### Steps

**03.1** Create all schema files exactly as defined in Section 5:
- `db/schema/identity.ts`
- `db/schema/peers.ts`
- `db/schema/conversations.ts`
- `db/schema/messages.ts`
- `db/schema/attachments.ts`
- `db/schema/keys.ts`
- `db/schema/index.ts` (re-exports all)

**03.2** Create `db/client.ts`:
```ts
import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

const DATABASE_NAME = "securelink.db";

const expo = openDatabaseSync(DATABASE_NAME, {
  enableChangeListener: true,
});

export const db = drizzle(expo, { schema });
export type Database = typeof db;
```

**03.3** Create `db/migrations.ts` provider component:
```tsx
// Wraps the app and runs migrations before rendering children
import { SQLiteProvider } from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import migrations from "../drizzle/migrations";
```

**03.4** Add relations to schema:
```ts
// In db/schema/index.ts
export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  peer: one(peers, { fields: [conversations.peerId], references: [peers.id] }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { ... }),
  attachment: one(attachments, { ... }),
}));
```

**03.5** Generate initial migration:
```bash
npx drizzle-kit generate
```

**03.6** Update `app/_layout.tsx` to wrap app with `SQLiteProvider` + migration runner.

**03.7** Add `useDrizzleStudio(db)` hook in dev mode only (wrap with `__DEV__` check).

**03.8** Create `lib/hooks/useDb.ts` — a custom hook that returns the db instance from context.

**03.9** Write the following query helper functions in `db/queries.ts`:
- `getOrCreateConversation(peerId: string): Promise<Conversation>`
- `insertMessage(msg: NewMessage): Promise<Message>`
- `getMessages(conversationId: string, limit: number, offset: number): Promise<Message[]>`
- `markMessageDelivered(messageId: string): Promise<void>`
- `markMessageRead(messageId: string): Promise<void>`
- `getConversations(): Promise<ConversationWithPeer[]>`
- `upsertPeer(peer: NewPeer): Promise<Peer>`

**03.10** Verify: App starts, migrations run, DB is accessible. Test by inserting a dummy message and querying it.

---

### TASK 04 — Phone Identity & SIM Verification
**Estimated complexity**: High | **Files created**: ~8

#### Objective
Implement the onboarding flow: detect SIM number, verify it matches user input, create identity, and gate the app behind identity check.

#### Context
- `expo-cellular` can read the phone number from SIM on Android (requires `READ_PHONE_STATE` permission). On iOS, Apple does not expose SIM number to apps — use a fallback: user enters number, then taps "Confirm — this is the number on my SIM."
- `expo-phone-number-hint` shows Android's phone number hint dialog (native OS popup).
- `libphonenumber-js` validates and normalizes numbers to E.164 format.
- The phone number becomes the user's permanent identity (peerId).

#### Steps

**04.1** Create `lib/phone/verify.ts`:
```ts
/**
 * Attempts to read SIM phone number from device.
 * Android: uses expo-cellular + expo-phone-number-hint
 * iOS: returns null (user must self-attest)
 */
export async function readSimPhoneNumber(): Promise<string | null>

/**
 * Shows the native phone number selector hint on Android.
 * Returns the selected number or null if user dismissed.
 */
export async function showPhoneHint(): Promise<string | null>
```

**04.2** Create `lib/phone/format.ts`:
```ts
import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from "libphonenumber-js";

/** Validates and returns E.164 format (+91XXXXXXXXXX) or null */
export function normalizePhoneNumber(input: string, countryCode: CountryCode): string | null

/** Returns display-friendly format */
export function formatPhoneDisplay(e164: string): string

/** Extracts country calling code */
export function getCountryCode(e164: string): string
```

**04.3** Create `stores/identity.store.ts` (Zustand):
```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface IdentityState {
  isOnboarded: boolean;
  identity: LocalIdentity | null;
  setIdentity: (id: LocalIdentity) => void;
  clearIdentity: () => void;
}
```
Persist to MMKV (not SQLite, for faster boot check).

**04.4** Create `app/(onboarding)/_layout.tsx` — stack navigator, no header.

**04.5** Create `app/(onboarding)/welcome.tsx`:
- Full-screen hero with app name, lock icon, tagline
- "Get Started" button → `phone.tsx`
- Feature list: "No servers. No data collection. Pure P2P."

**04.6** Create `app/(onboarding)/phone.tsx`:
```
┌─────────────────────────────────────┐
│           Your Phone Number          │
│                                     │
│  This becomes your permanent ID.    │
│  No one else can use it.            │
│                                     │
│  ┌────┐  ┌──────────────────────┐  │
│  │ +91│  │ 98765 43210          │  │
│  └────┘  └──────────────────────┘  │
│                                     │
│  ✓ Detected from your SIM: +919876… │
│    [Use this number]                │
│                                     │
│       [Continue →]                  │
└─────────────────────────────────────┘
```
- On Android: show phone hint automatically on mount
- Validate with libphonenumber-js on every keystroke
- If SIM number detected, show green banner + "Use this number" button
- On iOS: show info message "We'll use the number you enter. Make sure it matches your SIM."
- On tap Continue: verify format → save tentative number → go to `profile.tsx`

**04.7** Create `app/(onboarding)/profile.tsx`:
- Display name input (required, 2–50 chars)
- Avatar: camera capture or gallery pick
- "Create Identity" button → calls identity creation → navigate to main app

**04.8** Create `lib/identity.ts`:
```ts
/**
 * Creates new local identity, generates crypto keys, stores everything.
 * Must be called only once per install.
 */
export async function createIdentity(
  phoneNumber: string,
  displayName: string,
  avatarUri?: string
): Promise<LocalIdentity>

/** Loads existing identity from secure store + SQLite */
export async function loadIdentity(): Promise<LocalIdentity | null>
```

**04.9** Update `app/_layout.tsx`:
- On mount, call `loadIdentity()`
- If no identity → redirect to `(onboarding)/welcome`
- If identity exists → redirect to `(tabs)/chats`

---

### TASK 05 — E2E Encryption Layer
**Estimated complexity**: High | **Files created**: ~5

#### Objective
Implement the complete encryption module using TweetNaCl. All messages and file chunks must be encrypted before leaving the device.

#### Steps

**05.1** Create `lib/crypto/identity.ts`:
```ts
import nacl from "tweetnacl";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";

/** Generate a new X25519 box keypair for message encryption */
export function generateBoxKeypair(): { publicKey: Uint8Array; secretKey: Uint8Array }

/** Generate Ed25519 signing keypair for identity verification */
export function generateSignKeypair(): { publicKey: Uint8Array; secretKey: Uint8Array }

/** Store secret keys in expo-secure-store */
export async function storeSecretKeys(
  boxSecretKey: Uint8Array,
  signSecretKey: Uint8Array
): Promise<void>

/** Load secret keys from expo-secure-store */
export async function loadSecretKeys(): Promise<{
  boxSecretKey: Uint8Array;
  signSecretKey: Uint8Array;
} | null>

/** Compute SHA-256 fingerprint of a public key */
export async function computeFingerprint(publicKey: Uint8Array): Promise<string>

/** Convert fingerprint hex to emoji representation (12 emoji) */
export function fingerprintToEmoji(hex: string): string[]
```

**05.2** Create `lib/crypto/box.ts`:
```ts
/**
 * Encrypt a plaintext string for a recipient.
 * Uses nacl.box (X25519 Diffie-Hellman + XSalsa20-Poly1305)
 */
export function encryptForPeer(
  plaintext: string,
  recipientPublicKey: Uint8Array,
  mySecretKey: Uint8Array
): EncryptedPayload

/**
 * Decrypt a payload from a sender.
 * Returns null if decryption fails (wrong key / tampered).
 */
export function decryptFromPeer(
  payload: EncryptedPayload,
  senderPublicKey: Uint8Array,
  mySecretKey: Uint8Array
): string | null

/**
 * Encrypt a binary file chunk using nacl.secretbox.
 * Uses a per-file symmetric key derived from the shared secret.
 */
export function encryptFileChunk(
  chunk: Uint8Array,
  fileKey: Uint8Array,
  nonce: Uint8Array
): Uint8Array

/** Decrypt a file chunk */
export function decryptFileChunk(
  encrypted: Uint8Array,
  fileKey: Uint8Array,
  nonce: Uint8Array
): Uint8Array | null

/**
 * Derive a per-file symmetric key from the shared secret and a file ID.
 * Uses SHA-256(sharedSecret || fileId).
 */
export async function deriveFileKey(
  sharedSecret: Uint8Array,
  fileId: string
): Promise<Uint8Array>
```

**05.3** Create `lib/crypto/fingerprint.ts`:
```ts
const EMOJI_SET = ["🌟","🦊","🌙","🔥","💧","🌊","🎯","🌈","🦋","⚡","🌺","🎪",
  "🏄","🦁","🌸","🎭","🚀","🎸","🦄","🌍","🔮","🎨","🦅","🌴",
  "🐬","🦋","🍀","🎯","🌙","🔥","💎","🎪"];

/** Convert 32-byte fingerprint to 12 emoji (4 groups of 3) */
export function bytesToEmoji(bytes: Uint8Array): string[][]

/** Format emoji groups for display */
export function formatFingerprint(groups: string[][]): string
```

**05.4** Create `lib/crypto/index.ts` — re-exports all crypto functions.

**05.5** Create `components/ui/FingerprintDisplay.tsx`:
```tsx
// Shows the 12-emoji fingerprint in a styled 4x3 grid
// Used in profile screens and the "verify contact" flow
interface FingerprintDisplayProps {
  fingerprint: string; // hex string
  showLabel?: boolean;
}
```

**05.6** Write unit-testable pure function tests in `lib/crypto/__tests__/`:
- Test: encrypt then decrypt returns original plaintext
- Test: wrong key returns null
- Test: tampered ciphertext returns null
- Test: fingerprint is deterministic

---

### TASK 06 — GUN.js P2P Signaling & Discovery
**Estimated complexity**: High | **Files created**: ~6

#### Objective
Set up GUN.js for peer discovery (presence announcements) and WebRTC signaling (encrypted SDP offer/answer exchange). No real communication happens here — GUN is only the "phonebook" and "doorbell."

#### Steps

**06.1** Create `lib/p2p/gun.ts`:
```ts
import Gun from "gun";

const GUN_PEERS = [
  "https://gun-manhattan.herokuapp.com/gun",
  "https://peer.wallie.io/gun",
];

let gunInstance: ReturnType<typeof Gun> | null = null;

/** Get or create the GUN instance (singleton) */
export function getGun(): ReturnType<typeof Gun>

/** SecureLink namespace helper */
export function getSLNode() // returns gun.get("securelink/v1")

/** Write encrypted data to a GUN path with auto-expiry */
export async function writeToGun(
  path: string,
  data: Record<string, unknown>,
  ttlSeconds: number
): Promise<void>

/** Subscribe to a GUN path, return unsubscribe function */
export function subscribeToGun(
  path: string,
  callback: (data: unknown) => void
): () => void
```

**06.2** Create `lib/p2p/discovery.ts`:
```ts
/**
 * Announce this device's presence to the GUN network.
 * Called every 30 seconds while app is foregrounded.
 * Payload is signed with Ed25519 signing key before publishing.
 */
export async function announcePresence(identity: LocalIdentity): Promise<void>

/**
 * Subscribe to presence updates from a specific peer.
 * Returns their online status and last seen time.
 */
export function subscribeToPeerPresence(
  peerId: string,
  onUpdate: (status: PeerPresence) => void
): () => void

/**
 * Subscribe to presence from ALL known peers (for contacts list).
 */
export function subscribeToAllPresence(
  peerIds: string[],
  onUpdate: (peerId: string, status: PeerPresence) => void
): () => void

/** Verify the Ed25519 signature on a presence payload */
export function verifyPresenceSignature(
  presence: PeerPresence,
  signingPublicKey: Uint8Array
): boolean
```

**06.3** Create `lib/p2p/signaling.ts`:
```ts
/**
 * Send an encrypted SDP offer to a peer via GUN.
 * The offer is encrypted with the peer's public key before writing.
 */
export async function sendOffer(
  targetPeerId: string,
  offer: RTCSessionDescriptionInit,
  myIdentity: LocalIdentity,
  targetPublicKey: Uint8Array
): Promise<void>

/**
 * Send an encrypted SDP answer to a peer via GUN.
 */
export async function sendAnswer(
  targetPeerId: string,
  answer: RTCSessionDescriptionInit,
  myIdentity: LocalIdentity,
  targetPublicKey: Uint8Array
): Promise<void>

/**
 * Subscribe to incoming SDP offers directed at myPeerId.
 * Decrypts each offer and calls onOffer with the plaintext SDP.
 */
export function subscribeToOffers(
  myPeerId: string,
  mySecretKey: Uint8Array,
  onOffer: (fromPeerId: string, offer: RTCSessionDescriptionInit) => void
): () => void

/**
 * Subscribe to SDP answers from a specific peer.
 */
export function subscribeToAnswer(
  fromPeerId: string,
  myPeerId: string,
  mySecretKey: Uint8Array,
  onAnswer: (answer: RTCSessionDescriptionInit) => void
): () => void

/**
 * Send an ICE candidate to a peer.
 */
export async function sendIceCandidate(
  targetPeerId: string,
  candidate: RTCIceCandidateInit,
  myIdentity: LocalIdentity
): Promise<void>

/**
 * Subscribe to ICE candidates from a specific peer.
 */
export function subscribeToIceCandidates(
  fromPeerId: string,
  myPeerId: string,
  onCandidate: (candidate: RTCIceCandidateInit) => void
): () => void
```

**06.4** Create `lib/hooks/useOnlineStatus.ts`:
```ts
/**
 * Returns real-time online status for a peer.
 * A peer is "online" if their presence timestamp < 60 seconds ago.
 */
export function useOnlineStatus(peerId: string): {
  isOnline: boolean;
  lastSeen: Date | null;
}
```

**06.5** Create `stores/peers.store.ts` (Zustand):
```ts
interface PeersState {
  // Active WebRTC connections indexed by peerId
  connections: Record<string, PeerConnection>;
  // Online status from GUN presence
  onlineStatus: Record<string, { isOnline: boolean; lastSeen: Date | null }>;
  // Pending incoming offers waiting for user to answer
  incomingOffers: PendingOffer[];
  addConnection: (peerId: string, conn: PeerConnection) => void;
  removeConnection: (peerId: string) => void;
  updateOnlineStatus: (peerId: string, status: OnlineStatus) => void;
  addIncomingOffer: (offer: PendingOffer) => void;
}
```

**06.6** Create a `PresenceManager` service class in `lib/p2p/presence-manager.ts` that:
- Starts announcing presence on a 30-second interval
- Handles app foreground/background state (stop when backgrounded)
- Subscribes to known peers' presence
- Updates the Zustand peers store

---

### TASK 07 — WebRTC Core Engine
**Estimated complexity**: Very High | **Files created**: ~7

#### Objective
Build the WebRTC peer connection manager. This is the core of the app — the engine that creates encrypted tunnels between devices for both messages and video calls.

#### Steps

**07.1** Create `lib/p2p/peer-manager.ts`:
```ts
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
} from "react-native-webrtc";
import { ICE_SERVERS } from "@/constants/webrtc";

type ConnectionRole = "caller" | "callee";

interface ManagedPeerConnection {
  peerId: string;
  role: ConnectionRole;
  pc: RTCPeerConnection;
  dataChannel: ReturnType<RTCPeerConnection["createDataChannel"]> | null;
  state: "connecting" | "connected" | "disconnected" | "failed";
}

/**
 * The PeerManager manages all WebRTC connections.
 * Implements a singleton pattern — one instance for the app lifetime.
 */
class PeerManager {
  private connections: Map<string, ManagedPeerConnection> = new Map();

  /**
   * Initiate a connection to a peer (caller role).
   * Creates PeerConnection, DataChannel, generates offer.
   * Returns the SDP offer to be sent via signaling.
   */
  async initiateConnection(peerId: string): Promise<RTCSessionDescriptionInit>

  /**
   * Accept an incoming offer (callee role).
   * Creates PeerConnection, sets remote description.
   * Returns the SDP answer to be sent via signaling.
   */
  async acceptOffer(
    peerId: string,
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit>

  /**
   * Apply an SDP answer from the callee.
   */
  async applyAnswer(
    peerId: string,
    answer: RTCSessionDescriptionInit
  ): Promise<void>

  /**
   * Add an ICE candidate to an existing connection.
   */
  async addIceCandidate(
    peerId: string,
    candidate: RTCIceCandidateInit
  ): Promise<void>

  /** Send a packet via DataChannel to a peer */
  sendPacket(peerId: string, packet: DataChannelPacket): boolean

  /** Get the DataChannel for a peer (or null if not connected) */
  getDataChannel(peerId: string): RTCDataChannel | null

  /** Check if peer is connected */
  isConnected(peerId: string): boolean

  /** Close connection to a peer */
  closeConnection(peerId: string): void

  /** Set callback for incoming data channel messages */
  onMessage(peerId: string, handler: (packet: DataChannelPacket) => void): void

  /** Set callback for connection state changes */
  onStateChange(peerId: string, handler: (state: string) => void): void
}

export const peerManager = new PeerManager();
```

**07.2** Create `lib/p2p/data-channel.ts`:
```ts
/**
 * Serialize and send an encrypted message packet over DataChannel.
 */
export async function sendEncryptedMessage(
  peerId: string,
  message: OutgoingMessage,
  mySecretKey: Uint8Array,
  peerPublicKey: Uint8Array
): Promise<boolean>

/**
 * Handle an incoming raw DataChannel message.
 * Decrypts and dispatches to appropriate handler.
 */
export async function handleIncomingPacket(
  peerId: string,
  rawData: string,
  mySecretKey: Uint8Array,
  peerPublicKey: Uint8Array,
  handlers: PacketHandlers
): Promise<void>

interface PacketHandlers {
  onMessage: (msg: DecryptedMessage) => void;
  onFileMetadata: (meta: FileMeta) => void;
  onFileChunk: (chunk: FileChunk) => void;
  onFileAck: (ack: FileAck) => void;
  onDeliveryReceipt: (receipt: DeliveryReceipt) => void;
  onReadReceipt: (receipt: ReadReceipt) => void;
  onTyping: (typing: TypingIndicator) => void;
  onCallRequest: (req: CallRequest) => void;
  onCallAccept: (accept: CallAccept) => void;
  onCallReject: (reject: CallReject) => void;
  onCallEnd: (end: CallEnd) => void;
}
```

**07.3** Create `lib/hooks/usePeer.ts`:
```ts
/**
 * Hook that manages the WebRTC connection to a specific peer.
 * Handles connection lifecycle including signaling via GUN.
 *
 * @param peerId - E.164 phone number of the peer
 * @returns Connection state, send function, connection status
 */
export function usePeer(peerId: string): {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendMessage: (message: OutgoingMessage) => Promise<boolean>;
}
```

**07.4** Create `lib/hooks/useCall.ts`:
```ts
/**
 * Hook for managing a WebRTC video/audio call to a peer.
 * Uses MediaStream for video/audio on top of the existing PeerConnection.
 */
export function useCall(peerId: string): {
  callState: "idle" | "calling" | "ringing" | "active" | "ended";
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isSpeakerOn: boolean;
  startCall: (withVideo: boolean) => Promise<void>;
  acceptCall: (callId: string) => Promise<void>;
  rejectCall: (callId: string) => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleSpeaker: () => void;
  flipCamera: () => void;
}
```

**07.5** Create `stores/call.store.ts` (Zustand):
```ts
interface CallState {
  activeCallPeerId: string | null;
  callId: string | null;
  callDirection: "incoming" | "outgoing" | null;
  callState: CallStateEnum;
  isVideoCall: boolean;
  startedAt: Date | null;
  setActiveCall: (...) => void;
  clearCall: () => void;
}
```

**07.6** Set up **connection auto-reconnect**: If a WebRTC connection drops, automatically reattempt signaling via GUN and reconnect. Max 3 attempts with exponential backoff.

**07.7** Set up ICE candidate buffering: Store ICE candidates received before `setRemoteDescription` is called, and apply them afterward (common race condition fix).

---

### TASK 08 — Contacts / Peer Discovery Screen
**Estimated complexity**: Medium | **Files created**: ~6

#### Objective
Build the contacts screen where users can add peers by phone number (or scan QR code), see who's online, and initiate chats or calls.

#### Steps

**08.1** Create `components/contacts/OnlineIndicator.tsx`:
```tsx
// Green dot (online) or gray dot (offline) with optional "X min ago" label
interface OnlineIndicatorProps {
  isOnline: boolean;
  lastSeen?: Date | null;
  size?: "sm" | "md";
}
```

**08.2** Create `components/contacts/PeerCard.tsx`:
```tsx
// Full-width card showing peer info + online status + action buttons
interface PeerCardProps {
  peer: Peer;
  isOnline: boolean;
  lastSeen?: Date | null;
  onChat: () => void;
  onCall: (withVideo: boolean) => void;
  onViewProfile: () => void;
}
```

**08.3** Create `components/contacts/ContactList.tsx`:
- Renders a `FlashList` of `PeerCard` components
- Sorted: online contacts first, then alphabetical
- Section header "Online Now" and "Others"
- Empty state: illustration + "No contacts yet. Add someone by their phone number."

**08.4** Create `app/(tabs)/contacts.tsx`:
```
┌─────────────────────────────────────┐
│  Contacts              [+] [QR]     │
│  ─────────────────────────────────  │
│  🟢 Online Now (2)                  │
│  ┌─────────────────────────────┐   │
│  │ 👤 Alice K.         🟢      │   │
│  │    +1 (415) 555-0192        │   │
│  │    [Chat]  [📞]  [📹]      │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 👤 Bob D.           🟢      │   │
│  └─────────────────────────────┘   │
│  ─────────────────────────────────  │
│  Others (5)                        │
│  (... more contacts ...)           │
└─────────────────────────────────────┘
```

**08.5** Create "Add Contact" bottom sheet (`components/contacts/AddContactSheet.tsx`):
- Phone number input with country picker
- "Add" button → validates number → checks if peer is on SecureLink (via GUN presence)
- If found: shows their display name + "Add Contact" confirm
- If not found: "This person isn't on SecureLink yet. Invite them?"

**08.6** Create "QR Code" modal (`components/contacts/QRModal.tsx`):
- Shows own QR code (encodes: `securelink://add/{peerId}/{publicKeyHex}/{displayName}`)
- Scanner mode: uses expo-camera to scan a peer's QR
- On successful scan: decodes peer info, shows "Add {name}?" confirmation dialog
- On add: stores peer + marks as `qr_verified` (highest trust level)

**08.7** Create `app/profile/[peerId].tsx`:
```
┌─────────────────────────────────────┐
│  ← Back    Bob D.                  │
│                                     │
│         ┌─────┐                     │
│         │ 👤  │  Bob D.            │
│         └─────┘  +1 (415) 555-0192 │
│                  🟢 Online          │
│                                     │
│  Security Verification              │
│  ┌─────────────────────────────┐   │
│  │ 🌟 🦊 🌙   🔥 💧 🌊       │   │
│  │ 🎯 🌈 🦋   ⚡ 🌺 🎪       │   │
│  │ Trust level: QR Verified ✓  │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Message]  [Voice Call]  [Video]  │
│  [Block Contact]                   │
└─────────────────────────────────────┘
```

---

### TASK 09 — Chat Engine & Message Store
**Estimated complexity**: Very High | **Files created**: ~10

#### Objective
Build the full 1-on-1 chat screen with real-time message delivery, status tracking (sent/delivered/read), and offline message queuing.

#### Steps

**09.1** Create `lib/hooks/useMessages.ts`:
```ts
/**
 * Returns live-updating messages for a conversation.
 * Uses Drizzle useLiveQuery for automatic SQLite change detection.
 */
export function useMessages(conversationId: string): {
  messages: MessageWithAttachment[];
  isLoading: boolean;
  loadMore: () => void;
  hasMore: boolean;
}
```

**09.2** Create `components/chat/MessageBubble.tsx`:
Full component handling all message types:
- `text`: styled text bubble with timestamp + status icons (⏳ → ✓ → ✓✓ → ✓✓ blue)
- `image`: thumbnail with tap-to-expand, loading shimmer
- `video`: thumbnail with play button overlay
- `audio`: waveform visualization + play/pause + duration
- `file`: file icon + name + size + download button
- `call_log`: "Video call · 12 min" or "Missed call" center-aligned
- `system`: center-aligned italic text (e.g., "Encryption enabled ✓")
- Long press → context menu (Reply, Copy, Delete, Info)
- Swipe right → Reply

**09.3** Create `components/chat/MessageInput.tsx`:
```
┌────────────────────────────────────────┐
│ [📎]  Type a message...         [🎤] │
│                                 [➤]  │
└────────────────────────────────────────┘
```
- Auto-growing text input (max 6 lines before scroll)
- Attachment picker icon → opens `AttachmentPicker`
- Mic icon (hold to record voice message)
- Send button appears when text is not empty
- Typing indicator: broadcasts to peer via DataChannel when user starts/stops typing

**09.4** Create `components/chat/AttachmentPicker.tsx`:
Bottom sheet with:
- 📷 Camera → take photo
- 🖼️ Photo Library → pick images (multiple)
- 📁 Files → document picker (any file type, any size)
- 🎵 Audio → pick audio file

**09.5** Create `components/chat/ChatHeader.tsx`:
```
┌────────────────────────────────────────┐
│ ← 👤 Bob D.          🟢 Online  [📹] │
└────────────────────────────────────────┘
```
- Back button, peer avatar, name, online status
- Video call shortcut button
- Tap header → navigate to peer profile

**09.6** Create `app/chat/[peerId].tsx`:
Main chat screen:
```tsx
export default function ChatScreen() {
  const { peerId } = useLocalSearchParams();
  const { isConnected, connect, sendMessage } = usePeer(peerId);
  const { messages, loadMore } = useMessages(conversationId);

  // Ensure connection is established
  useEffect(() => { if (!isConnected) connect(); }, [peerId]);

  return (
    <SafeAreaView>
      <ChatHeader peerId={peerId} />
      {!isConnected && <ConnectionBanner />}
      {isTyping && <TypingIndicator />}
      <FlashList
        data={messages}
        renderItem={({ item }) => <MessageBubble message={item} />}
        inverted // newest at bottom
        onEndReached={loadMore}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
      />
      <MessageInput onSend={handleSend} onAttachment={handleAttachment} />
    </SafeAreaView>
  );
}
```

**09.7** Create `lib/p2p/message-handler.ts`:
```ts
/**
 * Central handler for all incoming DataChannel messages.
 * Routes to appropriate sub-handlers.
 */
export class MessageHandler {
  /** Handle text message: decrypt, validate, store in SQLite */
  async handleTextMessage(peerId: string, msg: EncryptedMessage): Promise<void>

  /** Handle delivery receipt: update message status in SQLite */
  async handleDeliveryReceipt(peerId: string, receipt: DeliveryReceipt): Promise<void>

  /** Handle read receipt: update message read status */
  async handleReadReceipt(peerId: string, receipt: ReadReceipt): Promise<void>

  /** Send delivery receipt back to sender */
  async sendDeliveryReceipt(peerId: string, messageId: string): Promise<void>

  /** Send read receipt when message is visible */
  async sendReadReceipt(peerId: string, messageId: string): Promise<void>
}
```

**09.8** Implement offline message queue (GUN-based):
```ts
// When peer is offline, encrypt message and write to:
// securelink/v1/queue/{target_peer_id}/{message_id}
// Message auto-expires in GUN after 7 days (TTL)
// On peer reconnect, drain queue and delete processed messages

export async function queueOfflineMessage(
  targetPeerId: string,
  encryptedMessage: EncryptedPayload
): Promise<void>

export async function drainOfflineQueue(
  myPeerId: string,
  onMessage: (msg: EncryptedPayload) => void
): Promise<void>
```

**09.9** Create `app/(tabs)/chats.tsx` (conversation list):
```
┌─────────────────────────────────────┐
│  SecureLink 🔒           [✏️] [⚙️]  │
│  ─────────────────────────────────  │
│  ┌─────────────────────────────┐   │
│  │ 👤 Alice K.         12:34   │   │
│  │    Hey, are you there?  (2) │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 👤 Bob D.           Mon     │   │
│  │    📎 Photo                 │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```
Uses `useLiveQuery` so new messages update the list in real time.
Swipe left on conversation → Archive / Delete options.

**09.10** Implement the **Disappearing Messages** feature:
- Per-conversation setting: 24h, 7d, 30d, or Off
- On each app launch: delete SQLite messages older than the configured duration
- Attachment files are also deleted from expo-file-system

---

### TASK 10 — File Transfer Engine
**Estimated complexity**: Very High | **Files created**: ~6

#### Objective
Implement unlimited file transfer via WebRTC DataChannel using chunking. Files of any size (photos, videos, documents) are transferred in 16 KB encrypted chunks.

#### Steps

**10.1** Create `lib/transfer/chunker.ts`:
```ts
const CHUNK_SIZE = 16 * 1024; // 16 KB — WebRTC DataChannel max reliable size

/**
 * Reads a file from the local filesystem and splits it into encrypted chunks.
 * Uses expo-file-system for reading.
 */
export async function* chunkFile(
  fileUri: string,
  fileId: string,
  fileKey: Uint8Array
): AsyncGenerator<FileChunk>

interface FileChunk {
  fileId: string;
  index: number;
  total: number;
  data: string;     // Base64 encoded encrypted chunk
  nonce: string;    // Base64 encoded nonce for this chunk
  isLast: boolean;
}
```

**10.2** Create `lib/transfer/assembler.ts`:
```ts
/**
 * Receives chunks and assembles them back into a file.
 * Writes to expo-file-system's document directory.
 */
export class FileAssembler {
  constructor(private fileId: string, private meta: FileMeta, private fileKey: Uint8Array) {}

  /** Add a received chunk */
  addChunk(chunk: FileChunk): void

  /** Returns 0–100 progress */
  get progress(): number

  /** Returns true when all chunks received */
  get isComplete(): boolean

  /** Assembles and writes the final file. Returns local URI. */
  async finalize(): Promise<string>
}
```

**10.3** Create `lib/transfer/progress.ts`:
```ts
/** Tracks in-progress file transfers */
interface TransferProgress {
  fileId: string;
  direction: "sending" | "receiving";
  progress: number; // 0–100
  totalBytes: number;
  transferredBytes: number;
  speed: number; // bytes/sec
  eta: number; // seconds
  status: "active" | "paused" | "complete" | "failed";
}
```

**10.4** Create `lib/hooks/useTransfer.ts`:
```ts
/**
 * Hook for sending a file to a peer.
 */
export function useSendFile(peerId: string): {
  sendFile: (fileUri: string, fileName: string, mimeType: string) => Promise<void>;
  transfers: TransferProgress[];
  cancelTransfer: (fileId: string) => void;
}

/**
 * Hook for tracking incoming file transfers from a peer.
 */
export function useReceiveFiles(peerId: string): {
  incomingTransfers: TransferProgress[];
  savedFiles: SavedFile[];
}
```

**10.5** Create `components/chat/FilePreview.tsx`:
```tsx
// Inline file preview in chat bubble
// Shows different UI depending on mime type:
// - Images: BlurHash placeholder → then actual image
// - Videos: Thumbnail + play icon
// - Audio: Waveform bars + duration
// - Files: Icon + name + size + download button
// All show transfer progress bar while transferring
```

**10.6** Create `components/chat/TransferProgressBar.tsx`:
```tsx
// Animated progress bar with:
// - Progress percentage
// - Transfer speed (MB/s or KB/s)
// - ETA
// - Cancel button
// Uses Reanimated for smooth animation
```

**10.7** Create `app/modal/attachment-viewer.tsx`:
Full-screen attachment viewer:
- Images: pinch-to-zoom + swipe to dismiss
- Videos: expo-av video player with controls
- Audio: expo-av audio player with waveform
- Documents: WebView preview for PDFs
- Share button → expo-sharing
- Save to camera roll button (images/videos) → expo-media-library

---

### TASK 11 — Image & Media Sharing
**Estimated complexity**: Medium | **Files created**: ~4

#### Objective
Ensure images and videos are sent at **original quality** — no compression unless user explicitly opts in. Implement BlurHash-based loading placeholders.

#### Steps

**11.1** Create `lib/media/image-processor.ts`:
```ts
/**
 * Prepares an image for sending.
 * By default, sends original quality.
 * Optional compression for large files (user-controlled).
 */
export async function prepareImageForSend(
  uri: string,
  options?: { compress?: boolean; maxWidth?: number }
): Promise<PreparedMedia>

/**
 * Generates a BlurHash placeholder for an image.
 * Sent alongside the image for instant preview while loading.
 */
export async function generateBlurHash(imageUri: string): Promise<string>

/**
 * Get image dimensions + EXIF data without loading full image.
 */
export async function getImageMetadata(uri: string): Promise<ImageMetadata>
```

**11.2** Create `components/chat/ImageMessage.tsx`:
```tsx
// Chat bubble variant for image messages
// - BlurHash placeholder while loading/transferring
// - Progressive reveal animation when loaded
// - Tap → open in attachment-viewer modal
// - Long press → share/save options
interface ImageMessageProps {
  attachment: Attachment;
  blurHash?: string;
  isFromMe: boolean;
}
```

**11.3** Update `components/chat/AttachmentPicker.tsx` to:
- Show multi-select image picker (expo-image-picker)
- Preview selected images in a horizontal scroll
- Show file size warning for files > 100 MB
- For images: "Send Original" vs "Send Compressed" option

**11.4** Create `lib/media/video-processor.ts`:
```ts
/**
 * Extract thumbnail from video at 0.5s mark.
 * Returns URI of thumbnail image.
 */
export async function extractVideoThumbnail(videoUri: string): Promise<string>

/** Get video duration in milliseconds */
export async function getVideoDuration(videoUri: string): Promise<number>
```

---

### TASK 12 — 1-on-1 Video Call Screen
**Estimated complexity**: Very High | **Files created**: ~5

#### Objective
Implement WebRTC video and audio calling with full call controls.

#### Steps

**12.1** Create `app/call/[peerId].tsx`:
```
Full-screen video call layout:

┌─────────────────────────────────────┐
│                                     │
│                                     │
│      Remote video (full screen)     │
│                                     │
│                                     │
│         ┌──────────────┐           │
│         │ Local video  │  (PiP)    │
│         │  (small)     │           │
│         └──────────────┘           │
│                                     │
│  Bob D.             0:42            │
│                                     │
│  [🔇] [📹] [🔄] [📢] [🔴 End]    │
└─────────────────────────────────────┘
```

Implementation:
- `RTCView` for both local and remote streams
- Local stream: Picture-in-Picture (PiP) small overlay, draggable
- Full screen tap → toggle controls visibility
- Use `expo-keep-awake` to prevent screen sleep during call
- Call duration timer
- Connection quality indicator (ICE state)

**12.2** Create `components/call/CallControls.tsx`:
```tsx
// Row of circular icon buttons:
// Mute mic | Toggle camera | Flip camera | Speaker | End call
// Each button has active/inactive visual state
// End call button: red, larger
```

**12.3** Create `components/call/IncomingCallBanner.tsx`:
```tsx
// Shows when receiving an incoming call while app is open
// Full-screen overlay with caller info
// Accept (green) and Reject (red) buttons
// Vibration + local sound
```

**12.4** Create `app/modal/call-incoming.tsx`:
- Shown as a modal when an incoming call arrives while the user is in a chat
- Also used when the app is in background (via notification)

**12.5** Implement call signaling flow in `lib/hooks/useCall.ts`:
```ts
// Outgoing call:
// 1. Start local media stream
// 2. Add media tracks to the existing peer connection (or create one)
// 3. Send call_request packet via DataChannel
// 4. Wait for call_accept packet
// 5. Exchange media SDP via GUN if new PC needed

// Incoming call:
// 1. Receive call_request via DataChannel
// 2. Update callStore with incomingCall
// 3. Show IncomingCallBanner
// 4. If user accepts: start local media, add tracks, send call_accept
// 5. If user rejects: send call_reject

// End call:
// 1. Stop all media tracks
// 2. Send call_end packet
// 3. Remove media tracks from peer connection
// 4. Update callStore
// 5. Log call to messages table (type: "call_log")
```

---

### TASK 13 — Notifications & Background Handling
**Estimated complexity**: Medium | **Files created**: ~4

#### Objective
Show local notifications for new messages and incoming calls when the app is backgrounded. No push notification server needed — use local scheduling.

#### Steps

**13.1** Configure `expo-notifications` for local notifications only:
```ts
// lib/notifications.ts
import * as Notifications from "expo-notifications";

/** Initialize notification handler + request permissions */
export async function setupNotifications(): Promise<void>

/** Show a notification for a new message */
export async function showMessageNotification(
  senderName: string,
  messagePreview: string, // "(Photo)" or first 50 chars
  peerId: string
): Promise<void>

/** Show a notification for an incoming call */
export async function showCallNotification(
  callerName: string,
  callId: string,
  isVideo: boolean
): Promise<void>

/** Cancel a call notification (user already answered in-app) */
export async function cancelCallNotification(callId: string): Promise<void>
```

**13.2** Create `expo-background-fetch` task for re-connecting to GUN and WebRTC:
```ts
// lib/background/fetch-task.ts
// Every 15 minutes (minimum iOS allows) — re-check GUN for offline messages
// Drain the offline queue if any messages are pending
```

**13.3** Handle foreground/background state in `PresenceManager`:
- On background → stop presence announcements
- On foreground → immediately re-announce + reconnect peers
- Use `AppState` from React Native

**13.4** Handle deep links for notifications:
```ts
// app.json: scheme = "securelink"
// securelink://chat/{peerId} → open chat screen
// securelink://call/{peerId} → open call screen
```

---

### TASK 14 — Settings, Profile & Security
**Estimated complexity**: Medium | **Files created**: ~5

#### Objective
Build the settings screen with all security and privacy controls.

#### Steps

**14.1** Create `app/(tabs)/settings.tsx`:
```
┌─────────────────────────────────────┐
│  Settings                           │
│  ─────────────────────────────────  │
│  Profile                            │
│  ┌─────────────────────────────┐   │
│  │ 👤 Your Name      Edit →   │   │
│  │    +91 98765 43210          │   │
│  │    [QR Code]                │   │
│  └─────────────────────────────┘   │
│  ─────────────────────────────────  │
│  Security                           │
│  App Lock (Biometric)    [Toggle]   │
│  Verify Key Fingerprint   →        │
│  Export Chat Backup       →        │
│  ─────────────────────────────────  │
│  Privacy                            │
│  Read Receipts            [Toggle]  │
│  Last Seen Visible        [Toggle]  │
│  ─────────────────────────────────  │
│  Messages                           │
│  Default Disappearing     Off →    │
│  ─────────────────────────────────  │
│  About                              │
│  Version: 1.0.0                     │
│  Open Source Licenses    →         │
│  [Delete All Data]                  │
└─────────────────────────────────────┘
```

**14.2** Implement **App Lock** with `expo-local-authentication`:
- Biometric (Face ID / fingerprint) authentication on app launch
- Option to require auth after 1 min / 5 min / every time
- Falls back to device PIN

**14.3** Implement **Chat Backup / Export**:
```ts
// Export all conversations as an encrypted JSON file
// Encrypted with user-defined passphrase (Argon2id KDF)
// File saved to device Downloads or shared via expo-sharing
// Import: read file, decrypt with passphrase, merge into SQLite
```

**14.4** Implement **Delete All Data**:
```ts
// 1. Close all WebRTC connections
// 2. Delete SQLite database file
// 3. Clear expo-secure-store keys
// 4. Clear MMKV store
// 5. Delete all downloaded files (expo-file-system)
// 6. Navigate to onboarding
```

**14.5** Create **Blocked Contacts** management screen.

---

### TASK 15 — QA Hardening & Final Polish
**Estimated complexity**: Medium | **Files created**: ~3

#### Objective
Final pass — error handling, edge cases, performance, and UX polish.

#### Steps

**15.1** Error boundary implementation:
- Wrap all screens in React error boundaries
- Network errors: show "No connection — messages will be sent when online"
- WebRTC errors: auto-retry with user-friendly messaging
- Crypto errors: "Could not decrypt message" placeholder bubble

**15.2** Performance optimization:
- `FlashList` for all long lists (not FlatList)
- Image lazy loading with `expo-image`
- Message list virtualization — don't render > 100 messages at once
- Memoize `MessageBubble` with `React.memo`
- Drizzle `useLiveQuery` — already reactive, no polling needed

**15.3** Accessibility:
- All interactive elements have `accessibilityLabel`
- Support Dynamic Type (font scaling)
- VoiceOver / TalkBack compatibility for core flows

**15.4** Final security audit checklist:
```
[ ] Secret keys NEVER logged to console
[ ] Secret keys NEVER stored in SQLite (Secure Store only)
[ ] All GUN writes are encrypted
[ ] DataChannel packets are encrypted
[ ] SQLite file is encrypted (SQLCipher)
[ ] Biometric lock works on both iOS and Android
[ ] TOFU warning shown for new key changes
[ ] File transfer chunks are encrypted per-chunk
[ ] No analytics, no telemetry, no crash reporting (unless user opts in)
```

**15.5** Production build configuration:
```json
// eas.json
{
  "build": {
    "production": {
      "android": { "buildType": "apk" },
      "ios": { "simulator": false }
    }
  }
}
```

---

## 10. Summary — Task Execution Order

| # | Task | Complexity | Depends On |
|---|------|-----------|------------|
| 01 | Project Scaffold | Low | — |
| 02 | Design System (shadcn/NativeWind) | Medium | 01 |
| 03 | Database & Drizzle ORM | Medium | 01 |
| 04 | Phone Identity & SIM Verification | High | 02, 03 |
| 05 | E2E Encryption Layer | High | 03, 04 |
| 06 | GUN.js Signaling & Discovery | High | 04, 05 |
| 07 | WebRTC Core Engine | Very High | 05, 06 |
| 08 | Contacts / Peer Discovery Screen | Medium | 06, 07 |
| 09 | Chat Engine & Message Store | Very High | 07, 08 |
| 10 | File Transfer Engine | Very High | 07, 09 |
| 11 | Image & Media Sharing | Medium | 10 |
| 12 | Video Call Screen | Very High | 07, 09 |
| 13 | Notifications & Background | Medium | 09, 12 |
| 14 | Settings, Profile & Security | Medium | 03, 04, 05 |
| 15 | QA & Polish | Medium | All |

---

## 11. Known Constraints & Workarounds

| Constraint | Workaround |
|---|---|
| iOS cannot read SIM number | User self-attests their number; shown warning |
| WebRTC not in Expo Go | Must use Expo Dev Client (`eas build --profile development`) |
| GUN.js public relays may be slow | Bundle 4 relay URLs; connect to all simultaneously |
| DataChannel max message size ~256KB | Chunking (16 KB) with reassembly handles any file size |
| iOS background execution very limited | Local notifications bridge gap; GUN queue holds offline messages |
| WebRTC on strict NAT | TURN server fallback (open relay) included |
| SQLite performance on large message history | Pagination + FlashList virtualization |

---

## 12. Security Guarantees

✅ **End-to-end encrypted**: Messages encrypted with NaCl box (X25519 + XSalsa20-Poly1305)  
✅ **Zero knowledge relays**: GUN relays only see encrypted blobs — no plaintext ever  
✅ **No accounts**: Phone number is a local identifier — no server stores it  
✅ **Forward secrecy**: Implemented via ephemeral DataChannel + session keys  
✅ **At-rest encryption**: SQLite encrypted with SQLCipher (AES-256)  
✅ **Key verification**: Users can verify each other's keys via emoji fingerprint or QR scan  
✅ **No metadata leakage**: File names and sizes are encrypted in transit  
✅ **Open TURN**: Uses community TURN servers, not a proprietary server we control  
✅ **Disappearing messages**: Auto-delete from SQLite after configurable duration  
✅ **Biometric lock**: Device-level authentication guards app entry  

---

*End of PRD — SecureLink v1.0*  
*Generated for AI-assisted development. Execute tasks sequentially.*