import * as SecureStore from "expo-secure-store";
import { identity, type NewIdentity } from "@/db/schema";
import { db } from "@/db/client";
import { useIdentityStore } from "@/stores/identity.store";
import { generateBoxKeypair, generateSignKeypair } from "./crypto/identity";
import { encodeBase64 } from "tweetnacl-util";

const SECRET_KEY_STORE_KEY = "sonarx-secret-keys";
const SIGNING_KEY_STORE_KEY = "sonarx-signing-keys";

interface CreateIdentityParams {
  phoneNumber: string;
  displayName: string;
  avatarUri?: string;
}

import { eq } from "drizzle-orm";

// ... [existing code up to createIdentity] ...

export async function createIdentity(
  params: CreateIdentityParams,
): Promise<void> {
  const { phoneNumber, displayName, avatarUri } = params;

  const existing = await db.query.identity.findFirst({
    where: (i, { eq }) => eq(i.id, "local_user"),
  });

  // If identity exists during onboarding, it's a corrupted half-state 
  // or a double-click. We wipe it so they can cleanly proceed.
  if (existing) {
    await db.delete(identity).where(eq(identity.id, "local_user"));
  }

  const boxKeypair = generateBoxKeypair();
  const signKeypair = generateSignKeypair();

  await SecureStore.setItemAsync(
    SECRET_KEY_STORE_KEY,
    encodeBase64(boxKeypair.secretKey),
  );
  await SecureStore.setItemAsync(
    SIGNING_KEY_STORE_KEY,
    encodeBase64(signKeypair.secretKey),
  );

  const now = new Date();
  const newIdentity: NewIdentity = {
    id: "local_user",
    phoneNumber,
    displayName,
    avatarUri: avatarUri || null,
    publicKey: encodeBase64(boxKeypair.publicKey),
    secretKey: "[STORED_IN_SECURE_STORAGE]",
    signingPublicKey: encodeBase64(signKeypair.publicKey),
    signingSecretKey: "[STORED_IN_SECURE_STORAGE]",
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(identity).values(newIdentity);

  useIdentityStore.getState().setIdentity({
    id: "local_user",
    phoneNumber,
    displayName,
    avatarUri: avatarUri || null,
    publicKey: newIdentity.publicKey,
    signingPublicKey: newIdentity.signingPublicKey,
    createdAt: now,
    updatedAt: now,
  });
}

export async function loadIdentity(): Promise<
  | (Omit<NewIdentity, "secretKey" | "signingSecretKey"> & { createdAt: Date })
  | null
> {
  const storeIdentity = useIdentityStore.getState().identity;

  if (storeIdentity) {
    return storeIdentity as any;
  }

  const dbIdentity = await db.query.identity.findFirst({
    where: (i, { eq }) => eq(i.id, "local_user"),
  });

  if (!dbIdentity) {
    return null;
  }

  const secretKey = await SecureStore.getItemAsync(SECRET_KEY_STORE_KEY);
  const signingKey = await SecureStore.getItemAsync(SIGNING_KEY_STORE_KEY);

  if (!secretKey || !signingKey) {
    console.error("Identity exists but secret keys are missing!");
    return null;
  }

  const identityData = {
    id: dbIdentity.id,
    phoneNumber: dbIdentity.phoneNumber,
    displayName: dbIdentity.displayName,
    avatarUri: dbIdentity.avatarUri,
    publicKey: dbIdentity.publicKey,
    signingPublicKey: dbIdentity.signingPublicKey,
    createdAt: dbIdentity.createdAt,
    updatedAt: dbIdentity.updatedAt,
  };

  useIdentityStore.getState().setIdentity(identityData);

  return identityData;
}

export async function hasIdentity(): Promise<boolean> {
  if (useIdentityStore.getState().isOnboarded) {
    return true;
  }

  const dbIdentity = await db.query.identity.findFirst({
    where: (i, { eq }) => eq(i.id, "local_user"),
  });

  return !!dbIdentity;
}
