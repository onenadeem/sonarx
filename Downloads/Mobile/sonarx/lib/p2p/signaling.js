import { SL_NAMESPACE, writeToGun, subscribeToGun } from "./gun";
import { encryptForPeer, decryptFromPeer, } from "@/lib/crypto/box";
const signalPath = (targetPeerId, sourcePeerId, type) => `${SL_NAMESPACE}/signal/${targetPeerId}/${sourcePeerId}/${type}`;
const icePath = (targetPeerId, sourcePeerId) => `${SL_NAMESPACE}/ice/${targetPeerId}/${sourcePeerId}`;
export async function sendOffer(targetPeerId, offer, myIdentity, targetPublicKey, mySecretKey) {
    const offerData = JSON.stringify(offer);
    const encrypted = encryptForPeer(offerData, targetPublicKey, mySecretKey);
    const path = signalPath(targetPeerId, myIdentity.phoneNumber, "offer");
    await writeToGun(path, {
        ...encrypted,
        from: myIdentity.phoneNumber,
        timestamp: Date.now(),
    }, 60 * 5);
}
export async function sendAnswer(targetPeerId, answer, myIdentity, targetPublicKey, mySecretKey) {
    const answerData = JSON.stringify(answer);
    const encrypted = encryptForPeer(answerData, targetPublicKey, mySecretKey);
    const path = signalPath(targetPeerId, myIdentity.phoneNumber, "answer");
    await writeToGun(path, {
        ...encrypted,
        from: myIdentity.phoneNumber,
        timestamp: Date.now(),
    }, 60 * 5);
}
export function subscribeToOffers(myPeerId) {
    const path = `${SL_NAMESPACE}/signal/${myPeerId}`;
    return subscribeToGun(path, () => { });
}
export function subscribeToAnswer(fromPeerId, myPeerId, mySecretKey, senderPublicKey, onAnswer) {
    const path = signalPath(myPeerId, fromPeerId, "answer");
    return subscribeToGun(path, (data) => {
        if (!data?.ciphertext || !data?.nonce)
            return;
        const decrypted = decryptFromPeer(data, senderPublicKey, mySecretKey);
        if (!decrypted)
            return;
        try {
            const answer = JSON.parse(decrypted);
            onAnswer(answer);
        }
        catch {
            console.error("Failed to parse answer SDP");
        }
    });
}
export async function sendIceCandidate(targetPeerId, candidate, myIdentity, targetPublicKey, mySecretKey) {
    const candidateData = JSON.stringify(candidate);
    const encrypted = encryptForPeer(candidateData, targetPublicKey, mySecretKey);
    const path = icePath(targetPeerId, myIdentity.phoneNumber);
    await writeToGun(path, {
        ...encrypted,
        from: myIdentity.phoneNumber,
        timestamp: Date.now(),
    }, 60 * 10);
}
export function subscribeToIceCandidates(fromPeerId, myPeerId, mySecretKey, senderPublicKey, onCandidate) {
    const path = icePath(myPeerId, fromPeerId);
    return subscribeToGun(path, (data) => {
        if (!data?.ciphertext || !data?.nonce)
            return;
        const decrypted = decryptFromPeer(data, senderPublicKey, mySecretKey);
        if (!decrypted)
            return;
        try {
            const candidate = JSON.parse(decrypted);
            onCandidate(candidate);
        }
        catch {
            console.error("Failed to parse ICE candidate");
        }
    });
}
