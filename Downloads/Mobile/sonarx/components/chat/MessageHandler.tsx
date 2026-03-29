import { useEffect } from "react";
import { db } from "@/db/client";
import { messages, attachments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { peerManager } from "@/lib/p2p/peer-manager";
import { handleIncomingPacket } from "@/lib/p2p/data-channel";
import { decryptFromPeer } from "@/lib/crypto/box";
import {
  getOrCreateConversation,
  insertMessage,
  markMessageDelivered,
  markMessageRead,
} from "@/db/queries";
import type { Identity } from "@/db/schema";
import { decodeBase64 } from "tweetnacl-util";

interface MessageHandlerProps {
  identity: Identity | null;
}

export function MessageHandler({ identity }: MessageHandlerProps) {
  useEffect(() => {
    if (!identity) return;

    return () => {};
  }, [identity]);

  return null;
}

export async function handleIncomingMessage(
  fromPeerId: string,
  encryptedBody: string,
  nonce: string,
  mySecretKey: Uint8Array,
  senderPublicKey: Uint8Array,
): Promise<void> {
  const decrypted = decryptFromPeer(
    { ciphertext: encryptedBody, nonce },
    senderPublicKey,
    mySecretKey,
  );

  if (!decrypted) {
    console.error("Failed to decrypt message from", fromPeerId);
    return;
  }

  const conversation = await getOrCreateConversation(fromPeerId);

  await insertMessage({
    conversationId: conversation.id,
    peerId: fromPeerId,
    type: "text",
    body: decrypted,
    status: "delivered",
    sentAt: new Date(),
  });
}

export async function handleIncomingFileMetadata(
  fromPeerId: string,
  fileId: string,
  fileName: string,
  fileSize: number,
  mimeType: string,
  chunkCount: number,
): Promise<void> {
  await db.insert(attachments).values({
    id: fileId,
    messageId: "",
    fileName,
    mimeType,
    fileSize,
    transferStatus: "pending",
    totalChunks: chunkCount,
    createdAt: new Date(),
  } as any);
}

export async function handleIncomingFileChunk(
  fileId: string,
  chunkIndex: number,
  encryptedData: string,
  fileKey: Uint8Array,
  nonce: Uint8Array,
): Promise<void> {}
