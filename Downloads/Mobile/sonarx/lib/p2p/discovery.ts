import type { Identity } from "@/db/schema";
import nacl from "tweetnacl";
import { decodeBase64, encodeBase64 } from "tweetnacl-util";
import "../crypto/prng";
import { SL_NAMESPACE, getGun, subscribeToGun, writeToGun } from "./gun";

export interface PeerPresence {
  peerId: string;
  publicKey: string;
  signingPublicKey: string;
  displayName: string;
  timestamp: number;
  signature: string;
}

const PRESENCE_PATH = `${SL_NAMESPACE}/presence`;
const PRESENCE_TTL_MS = 3 * 60 * 1000; // 3 minutes — generous window for network delays
const ANNOUNCE_INTERVAL_MS = 30 * 1000;

export async function createPresencePayload(
  identity: Identity,
  signingSecretKey: Uint8Array,
): Promise<PeerPresence> {
  const timestamp = Date.now();
  const dataToSign = `${identity.phoneNumber}:${timestamp}`;
  const signature = nacl.sign.detached(
    new TextEncoder().encode(dataToSign),
    signingSecretKey,
  );

  return {
    peerId: identity.phoneNumber,
    publicKey: identity.publicKey,
    signingPublicKey: identity.signingPublicKey,
    displayName: identity.displayName,
    timestamp,
    signature: encodeBase64(signature),
  };
}

export function verifyPresenceSignature(
  presence: PeerPresence,
  signingPublicKey: Uint8Array,
): boolean {
  try {
    const dataToVerify = `${presence.peerId}:${presence.timestamp}`;
    const signature = decodeBase64(presence.signature);

    return nacl.sign.detached.verify(
      new TextEncoder().encode(dataToVerify),
      signature,
      signingPublicKey,
    );
  } catch {
    return false;
  }
}

export async function announcePresence(
  identity: Identity,
  signingSecretKey: Uint8Array,
): Promise<void> {
  const payload = await createPresencePayload(identity, signingSecretKey);
  const path = `${PRESENCE_PATH}/${identity.phoneNumber}`;
  const presenceData = payload as unknown as Record<string, unknown>;
  await writeToGun(path, presenceData, 60 * 2);
}

export function subscribeToPeerPresence(
  peerId: string,
  onUpdate: (status: { isOnline: boolean; lastSeen: Date | null }) => void,
): () => void {
  const path = `${PRESENCE_PATH}/${peerId}`;

  return subscribeToGun(path, (data: unknown) => {
    if (!data || typeof data !== "object") {
      onUpdate({ isOnline: false, lastSeen: null });
      return;
    }

    const presence = data as PeerPresence;
    const timestamp = presence.timestamp;

    if (!timestamp) {
      // Partial Gun.js soul/metadata arrived without actual presence fields — skip
      // to avoid flickering the contact to offline before real data arrives.
      return;
    }

    const isOnline = Date.now() - timestamp < PRESENCE_TTL_MS;
    onUpdate({
      isOnline,
      lastSeen: new Date(timestamp),
    });
  });
}

export function subscribeToAllPresence(
  peerIds: string[],
  onUpdate: (
    peerId: string,
    status: { isOnline: boolean; lastSeen: Date | null },
  ) => void,
): () => void {
  const unsubscribers: (() => void)[] = [];

  peerIds.forEach((peerId) => {
    const unsub = subscribeToPeerPresence(peerId, (status) => {
      onUpdate(peerId, status);
    });
    unsubscribers.push(unsub);
  });

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}

export async function getPeerPresence(
  peerId: string,
): Promise<PeerPresence | null> {
  const path = `${PRESENCE_PATH}/${peerId}`;
  console.log("[getPeerPresence] Searching at path:", path);
  const gun = getGun();

  return new Promise((resolve) => {
    let resolved = false;
    const node = gun.get(path);

    const handler = (data: unknown) => {
      if (resolved) return;

      if (!data || typeof data !== "object") {
        // No data yet, keep waiting
        return;
      }

      // Got valid data from network
      resolved = true;
      off();
      console.log("[getPeerPresence] Found presence for:", peerId);
      resolve(data as PeerPresence);
    };

    const off = () => node.off();
    node.on(handler as any);

    // Set a timeout to give up if no data is received
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        off();
        console.log(
          "[getPeerPresence] Timeout - no data found for:",
          peerId,
        );
        resolve(null);
      }
    }, 10000); // 10 second timeout

    // Also try to get cached data immediately
    node.once((data: any) => {
      if (resolved) return;

      if (data && typeof data === "object") {
        resolved = true;
        off();
        clearTimeout(timeout);
        console.log("[getPeerPresence] Found cached presence for:", peerId);
        resolve(data as PeerPresence);
      }
    });
  });
}

export function isPeerOnline(presence: PeerPresence | null): boolean {
  if (!presence?.timestamp) return false;
  return Date.now() - presence.timestamp < PRESENCE_TTL_MS;
}
