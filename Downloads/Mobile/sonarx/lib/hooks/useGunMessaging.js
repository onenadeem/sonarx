import { useEffect, useRef } from "react";
import * as SecureStore from "expo-secure-store";
import { decodeBase64 } from "tweetnacl-util";
import { useIdentityStore } from "@/stores/identity.store";
import { subscribeToInbox } from "@/lib/p2p/messaging";
import { decryptFromPeer } from "@/lib/crypto/box";
import { db } from "@/db/client";
import { messages } from "@/db/schema";
import { getOrCreateConversation, insertMessage } from "@/db/queries";
import { eq } from "drizzle-orm";
const SECRET_KEY_STORE_KEY = "sonarx-secret-keys";
/**
 * Subscribe to the GUN inbox for the current user.
 * Decrypts incoming messages and saves them to the local SQLite DB.
 * Mount this once at the root tab layout so it runs while the app is open.
 */
const sanitizeIncomingMessage = (msg) => {
    if (!msg || typeof msg !== "object")
        return null;
    if (!msg.id || !msg.fromPeerId || !msg.ciphertext || !msg.nonce) {
        return null;
    }
    return {
        id: String(msg.id),
        fromPeerId: String(msg.fromPeerId),
        ciphertext: String(msg.ciphertext),
        nonce: String(msg.nonce),
        timestamp: typeof msg.timestamp === "number" ? msg.timestamp : Date.now(),
    };
};
export function useGunMessaging() {
    const identity = useIdentityStore((state) => state.identity);
    const unsubRef = useRef(null);
    useEffect(() => {
        if (!identity)
            return;
        let isMounted = true;
        async function start() {
            const secretKeyStr = await SecureStore.getItemAsync(SECRET_KEY_STORE_KEY);
            if (!secretKeyStr || !isMounted)
                return;
            const mySecretKey = decodeBase64(secretKeyStr);
            const unsub = subscribeToInbox(identity.phoneNumber, async (rawMsg) => {
                if (!isMounted)
                    return;
                const msg = sanitizeIncomingMessage(rawMsg);
                if (!msg) {
                    return;
                }
                try {
                    // Dedup: skip if we already have this message
                    const existing = await db.query.messages.findFirst({
                        where: eq(messages.id, msg.id),
                    });
                    if (existing)
                        return;
                    // Only process messages from known contacts
                    const peer = await db.query.peers.findFirst({
                        where: (peers, { eq }) => eq(peers.id, msg.fromPeerId),
                    });
                    if (!peer) {
                        console.warn("[GunMessaging] Message from unknown peer:", msg.fromPeerId);
                        return;
                    }
                    // Decrypt
                    const decrypted = decryptFromPeer({ ciphertext: msg.ciphertext, nonce: msg.nonce }, decodeBase64(peer.publicKey), mySecretKey);
                    if (!decrypted) {
                        console.warn("[GunMessaging] Decryption failed from:", msg.fromPeerId);
                        return;
                    }
                    // Save to local DB
                    const conv = await getOrCreateConversation(msg.fromPeerId);
                    await insertMessage({
                        id: msg.id,
                        conversationId: conv.id,
                        peerId: msg.fromPeerId,
                        type: "text",
                        body: decrypted,
                        sentAt: new Date(msg.timestamp),
                        status: "delivered",
                    });
                    console.log("[GunMessaging] Received message from:", msg.fromPeerId);
                }
                catch (err) {
                    console.error("[GunMessaging] Error handling message:", err);
                }
            });
            if (isMounted) {
                unsubRef.current = unsub;
            }
            else {
                unsub();
            }
        }
        start();
        return () => {
            isMounted = false;
            unsubRef.current?.();
            unsubRef.current = null;
        };
    }, [identity?.phoneNumber]);
}
