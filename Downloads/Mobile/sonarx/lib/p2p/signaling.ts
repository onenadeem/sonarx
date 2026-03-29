import { SL_NAMESPACE, getGun, writeToGun, subscribeToGun } from "./gun";
import {
  encryptForPeer,
  decryptFromPeer,
  type EncryptedPayload,
} from "@/lib/crypto/box";
import type { Identity } from "@/db/schema";

const signalPath = (targetPeerId: string, sourcePeerId: string, type: string) =>
  `${SL_NAMESPACE}/signal/${targetPeerId}/${sourcePeerId}/${type}`;

const icePath = (targetPeerId: string, sourcePeerId: string) =>
  `${SL_NAMESPACE}/ice/${targetPeerId}/${sourcePeerId}`;

export async function sendOffer(
  targetPeerId: string,
  offer: RTCSessionDescriptionInit,
  myIdentity: Identity,
  targetPublicKey: Uint8Array,
  mySecretKey: Uint8Array,
): Promise<void> {
  const offerData = JSON.stringify(offer);
  const encrypted = encryptForPeer(offerData, targetPublicKey, mySecretKey);

  const path = signalPath(targetPeerId, myIdentity.phoneNumber, "offer");
  await writeToGun(
    path,
    {
      ...encrypted,
      from: myIdentity.phoneNumber,
      timestamp: Date.now(),
    },
    60 * 5,
  );
}

export async function sendAnswer(
  targetPeerId: string,
  answer: RTCSessionDescriptionInit,
  myIdentity: Identity,
  targetPublicKey: Uint8Array,
  mySecretKey: Uint8Array,
): Promise<void> {
  const answerData = JSON.stringify(answer);
  const encrypted = encryptForPeer(answerData, targetPublicKey, mySecretKey);

  const path = signalPath(targetPeerId, myIdentity.phoneNumber, "answer");
  await writeToGun(
    path,
    {
      ...encrypted,
      from: myIdentity.phoneNumber,
      timestamp: Date.now(),
    },
    60 * 5,
  );
}

export function subscribeToOffers(
  myPeerId: string,
  mySecretKey: Uint8Array,
  onOffer: (fromPeerId: string, offer: RTCSessionDescriptionInit) => void,
): () => void {
  const path = `${SL_NAMESPACE}/signal/${myPeerId}`;

  return subscribeToGun(path, (data: any) => {
    if (!data) return;

    Object.entries(data).forEach(([peerId, payload]) => {
      if (!payload || typeof payload !== "object") return;
      if (!(payload as any).ciphertext || !(payload as any).nonce) return;
    });
  });
}

export function subscribeToAnswer(
  fromPeerId: string,
  myPeerId: string,
  mySecretKey: Uint8Array,
  senderPublicKey: Uint8Array,
  onAnswer: (answer: RTCSessionDescriptionInit) => void,
): () => void {
  const path = signalPath(myPeerId, fromPeerId, "answer");

  return subscribeToGun(path, (data: any) => {
    if (!data?.ciphertext || !data?.nonce) return;

    const decrypted = decryptFromPeer(data, senderPublicKey, mySecretKey);
    if (!decrypted) return;

    try {
      const answer: RTCSessionDescriptionInit = JSON.parse(decrypted);
      onAnswer(answer);
    } catch {
      console.error("Failed to parse answer SDP");
    }
  });
}

export async function sendIceCandidate(
  targetPeerId: string,
  candidate: RTCIceCandidateInit,
  myIdentity: Identity,
  targetPublicKey: Uint8Array,
  mySecretKey: Uint8Array,
): Promise<void> {
  const candidateData = JSON.stringify(candidate);
  const encrypted = encryptForPeer(candidateData, targetPublicKey, mySecretKey);

  const path = icePath(targetPeerId, myIdentity.phoneNumber);
  await writeToGun(
    path,
    {
      ...encrypted,
      from: myIdentity.phoneNumber,
      timestamp: Date.now(),
    },
    60 * 10,
  );
}

export function subscribeToIceCandidates(
  fromPeerId: string,
  myPeerId: string,
  mySecretKey: Uint8Array,
  senderPublicKey: Uint8Array,
  onCandidate: (candidate: RTCIceCandidateInit) => void,
): () => void {
  const path = icePath(myPeerId, fromPeerId);

  return subscribeToGun(path, (data: any) => {
    if (!data?.ciphertext || !data?.nonce) return;

    const decrypted = decryptFromPeer(data, senderPublicKey, mySecretKey);
    if (!decrypted) return;

    try {
      const candidate: RTCIceCandidateInit = JSON.parse(decrypted);
      onCandidate(candidate);
    } catch {
      console.error("Failed to parse ICE candidate");
    }
  });
}
