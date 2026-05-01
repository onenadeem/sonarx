import { db } from "@/db/client";
import { attachments } from "@/db/schema";
import { decryptFromPeer } from "@/lib/crypto/box";
import { getOrCreateConversation, insertMessage, } from "@/db/queries";
export function MessageHandler() {
    return null;
}
export async function handleIncomingMessage(fromPeerId, encryptedBody, nonce, mySecretKey, senderPublicKey) {
    const decrypted = decryptFromPeer({ ciphertext: encryptedBody, nonce }, senderPublicKey, mySecretKey);
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
export async function handleIncomingFileMetadata(fromPeerId, fileId, fileName, fileSize, mimeType, chunkCount) {
    await db.insert(attachments).values({
        id: fileId,
        messageId: "",
        fileName,
        mimeType,
        fileSize,
        transferStatus: "pending",
        totalChunks: chunkCount,
        createdAt: new Date(),
    });
}
