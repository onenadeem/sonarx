import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const zustandStorage = {
  getItem: async (name: string) => {
    const value = await SecureStore.getItemAsync(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string) => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string) => {
    await SecureStore.deleteItemAsync(name);
  },
};

export interface LocalIdentity {
  id: string;
  phoneNumber: string;
  displayName: string;
  avatarUri?: string | null;
  publicKey: string;
  signingPublicKey: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IdentityState {
  isOnboarded: boolean;
  identity: LocalIdentity | null;
  setIdentity: (id: LocalIdentity) => void;
  clearIdentity: () => void;
  updateProfile: (
    updates: Partial<Pick<LocalIdentity, "displayName" | "avatarUri">>,
  ) => void;
}

export const useIdentityStore = create<IdentityState>()(
  persist(
    (set) => ({
      isOnboarded: false,
      identity: null,
      setIdentity: (id) =>
        set({
          identity: id,
          isOnboarded: true,
        }),
      clearIdentity: () =>
        set({
          identity: null,
          isOnboarded: false,
        }),
      updateProfile: (updates) =>
        set((state) => ({
          identity: state.identity ? { ...state.identity, ...updates } : null,
        })),
    }),
    {
      name: "identity-storage",
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);

export { useIdentityStore as useIdentity };
