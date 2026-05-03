import * as SecureStore from "expo-secure-store";
import { identity } from "@/db/schema";
import { db } from "@/db/client";
import { useIdentityStore } from "@/stores/identity.store";
import { eq } from "drizzle-orm";
import { generateBoxKeypair, generateSignKeypair } from "./crypto/identity";
import { encodeBase64 } from "tweetnacl-util";
const SECRET_KEY_STORE_KEY = "sonarance-secret-keys";
const SIGNING_KEY_STORE_KEY = "sonarance-signing-keys";
const LOCAL_USER_ID = "local_user";
const STORED_KEY_PLACEHOLDER = "[STORED_IN_SECURE_STORAGE]";
const getLocalIdentityQuery = () => {
    return db.query.identity.findFirst({
        where: (i, { eq }) => eq(i.id, LOCAL_USER_ID),
    });
};
const toRuntimeIdentity = (dbIdentity) => ({
    id: dbIdentity.id,
    phoneNumber: dbIdentity.phoneNumber,
    displayName: dbIdentity.displayName,
    avatarUri: dbIdentity.avatarUri,
    publicKey: dbIdentity.publicKey,
    signingPublicKey: dbIdentity.signingPublicKey,
    createdAt: dbIdentity.createdAt,
    updatedAt: dbIdentity.updatedAt,
});
export async function createIdentity(params) {
    const { phoneNumber, displayName, avatarUri } = params;
    const existing = await getLocalIdentityQuery();
    // If identity exists during onboarding, it's a corrupted half-state 
    // or a double-click. We wipe it so they can cleanly proceed.
    if (existing) {
        await db.delete(identity).where(eq(identity.id, LOCAL_USER_ID));
    }
    const boxKeypair = generateBoxKeypair();
    const signKeypair = generateSignKeypair();
    await SecureStore.setItemAsync(SECRET_KEY_STORE_KEY, encodeBase64(boxKeypair.secretKey));
    await SecureStore.setItemAsync(SIGNING_KEY_STORE_KEY, encodeBase64(signKeypair.secretKey));
    const now = new Date();
    const identityPayload = {
        id: LOCAL_USER_ID,
        phoneNumber,
        displayName,
        avatarUri: avatarUri || null,
        publicKey: encodeBase64(boxKeypair.publicKey),
        secretKey: STORED_KEY_PLACEHOLDER,
        signingPublicKey: encodeBase64(signKeypair.publicKey),
        signingSecretKey: STORED_KEY_PLACEHOLDER,
        createdAt: now,
        updatedAt: now,
    };
    const newIdentity = {
        ...identityPayload,
        createdAt: now,
        updatedAt: now,
    };
    await db.insert(identity).values(newIdentity);
    useIdentityStore.getState().setIdentity({
        id: LOCAL_USER_ID,
        phoneNumber,
        displayName,
        avatarUri: newIdentity.avatarUri,
        publicKey: newIdentity.publicKey,
        signingPublicKey: newIdentity.signingPublicKey,
        createdAt: now,
        updatedAt: now,
    });
}
export async function loadIdentity() {
    const storeIdentity = useIdentityStore.getState().identity;
    if (storeIdentity) {
        return storeIdentity;
    }
    const dbIdentity = await getLocalIdentityQuery();
    if (!dbIdentity) {
        return null;
    }
    const secretKey = await SecureStore.getItemAsync(SECRET_KEY_STORE_KEY);
    const signingKey = await SecureStore.getItemAsync(SIGNING_KEY_STORE_KEY);
    if (!secretKey || !signingKey) {
        console.error("Identity exists but secret keys are missing!");
        return null;
    }
    const identityData = toRuntimeIdentity(dbIdentity);
    useIdentityStore.getState().setIdentity(identityData);
    return identityData;
}
export async function hasIdentity() {
    if (useIdentityStore.getState().isOnboarded) {
        return true;
    }
    const dbIdentity = await getLocalIdentityQuery();
    return !!dbIdentity;
}
