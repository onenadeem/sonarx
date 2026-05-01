import { SL_NAMESPACE, writeToGun, subscribeToGun } from "./gun";
import { encryptForPeer, decryptFromPeer, } from "@/lib/crypto/box";
const signalPath = (targetPeerId, sourcePeerId, type) => `${SL_NAMESPACE}/signal/${targetPeerId}/${sourcePeerId}/${type}`;
const icePath = (targetPeerId, sourcePeerId) => `${SL_NAMESPACE}/ice/${targetPeerId}/${sourcePeerId}`;
const SIGNAL_TTL_SECONDS = {
    offer: 60 * 5,
    answer: 60 * 5,
    ice: 60 * 10,
};
const SIGNAL_TYPES = {
    offer: "offer",
    answer: "answer",
};
function publishSignalingPayload(targetPeerId, sourcePeerId, payloadType, payload, targetPublicKey, mySecretKey, ttlSeconds) {
    const message = JSON.stringify(payload);
    const encrypted = encryptForPeer(message, targetPublicKey, mySecretKey);
    const path = signalPath(targetPeerId, sourcePeerId, payloadType);
    return writeToGun(path, {
        ...encrypted,
        from: sourcePeerId,
        timestamp: Date.now(),
    }, ttlSeconds);
}
async function publishIceCandidatePayload(path, candidate, sourcePeerId, targetPublicKey, mySecretKey, ttlSeconds) {
    const encrypted = encryptForPeer(JSON.stringify(candidate), targetPublicKey, mySecretKey);
    await writeToGun(path, {
        ...encrypted,
        from: sourcePeerId,
        timestamp: Date.now(),
    }, ttlSeconds);
}
function handleEncryptedSignal(data, mySecretKey, senderPublicKey, onParsed, parseErrorMessage) {
    if (!data?.ciphertext || !data?.nonce)
        return;
    const decrypted = decryptFromPeer(data, senderPublicKey, mySecretKey);
    if (!decrypted)
        return;
    try {
        onParsed(JSON.parse(decrypted));
    }
    catch {
        console.error(parseErrorMessage);
    }
}
export async function sendOffer(targetPeerId, offer, myIdentity, targetPublicKey, mySecretKey) {
    await publishSignalingPayload(targetPeerId, myIdentity.phoneNumber, SIGNAL_TYPES.offer, offer, targetPublicKey, mySecretKey, SIGNAL_TTL_SECONDS.offer);
}
export async function sendAnswer(targetPeerId, answer, myIdentity, targetPublicKey, mySecretKey) {
    await publishSignalingPayload(targetPeerId, myIdentity.phoneNumber, SIGNAL_TYPES.answer, answer, targetPublicKey, mySecretKey, SIGNAL_TTL_SECONDS.answer);
}
export function subscribeToOffers(myPeerId) {
    const path = `${SL_NAMESPACE}/signal/${myPeerId}`;
    return subscribeToGun(path, () => { });
}
export function subscribeToAnswer(fromPeerId, myPeerId, mySecretKey, senderPublicKey, onAnswer) {
    const path = signalPath(myPeerId, fromPeerId, "answer");
    return subscribeToGun(path, (data) => {
        handleEncryptedSignal(data, mySecretKey, senderPublicKey, onAnswer, "Failed to parse answer SDP");
    });
}
export async function sendIceCandidate(targetPeerId, candidate, myIdentity, targetPublicKey, mySecretKey) {
    const path = icePath(targetPeerId, myIdentity.phoneNumber);
    await publishIceCandidatePayload(path, candidate, myIdentity.phoneNumber, targetPublicKey, mySecretKey, SIGNAL_TTL_SECONDS.ice);
}
export function subscribeToIceCandidates(fromPeerId, myPeerId, mySecretKey, senderPublicKey, onCandidate) {
    const path = icePath(myPeerId, fromPeerId);
    return subscribeToGun(path, (data) => {
        handleEncryptedSignal(data, mySecretKey, senderPublicKey, onCandidate, "Failed to parse ICE candidate");
    });
}
