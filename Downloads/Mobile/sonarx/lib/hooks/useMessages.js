import { useCallback } from "react";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { db } from "@/db/client";
import { messages } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getOrCreateConversation, insertMessage } from "@/db/queries";
import { useIdentityStore } from "@/stores/identity.store";
import * as SecureStore from "expo-secure-store";
import { decodeBase64 } from "tweetnacl-util";
import { sendGunMessage } from "@/lib/p2p/messaging";
const SECRET_KEY_STORE_KEY = "sonarx-secret-keys";
export function useMessages(conversationId) {
    const { data, error } = useLiveQuery(db.query.messages.findMany({
        where: eq(messages.conversationId, conversationId ?? "__pending_conversation__"),
        orderBy: desc(messages.sentAt),
        limit: 50,
    }), [conversationId]);
    return {
        messages: data || [],
        isLoading: !data && !error,
        error,
    };
}
export function useSendMessage(peerId) {
    const identity = useIdentityStore((state) => state.identity);
    const sendMessage = useCallback(async (content, type = "text") => {
        if (!identity)
            return false;
        try {
            const msgId = crypto.randomUUID();
            const conversation = await getOrCreateConversation(peerId);
            // Save locally first (optimistic, status = "sending")
            await insertMessage({
                id: msgId,
                conversationId: conversation.id,
                peerId: identity.phoneNumber,
                type,
                body: content,
                status: "sending",
            });
            // Fetch peer's public key and my secret key, then relay via GUN
            const peer = await db.query.peers.findFirst({
                where: (peers, { eq }) => eq(peers.id, peerId),
            });
            if (!peer) {
                console.warn("[useSendMessage] Peer not found in contacts:", peerId);
                return false;
            }
            const secretKeyStr = await SecureStore.getItemAsync(SECRET_KEY_STORE_KEY);
            if (!secretKeyStr) {
                console.warn("[useSendMessage] No secret key available");
                return false;
            }
            const mySecretKey = decodeBase64(secretKeyStr);
            const peerPublicKey = decodeBase64(peer.publicKey);
            await sendGunMessage(peerId, msgId, content, peerPublicKey, mySecretKey, identity.phoneNumber);
            // Mark local message as sent
            await db
                .update(messages)
                .set({ status: "sent" })
                .where(eq(messages.id, msgId));
            return true;
        }
        catch (error) {
            console.error("Failed to send message:", error);
            return false;
        }
    }, [peerId, identity]);
    return { sendMessage };
}
