import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
const zustandStorage = {
    getItem: async (name) => {
        const value = await SecureStore.getItemAsync(name);
        return value ?? null;
    },
    setItem: async (name, value) => {
        await SecureStore.setItemAsync(name, value);
    },
    removeItem: async (name) => {
        await SecureStore.deleteItemAsync(name);
    },
};
export const useIdentityStore = create()(persist((set) => ({
    isOnboarded: false,
    identity: null,
    setIdentity: (id) => set({
        identity: id,
        isOnboarded: true,
    }),
    clearIdentity: () => set({
        identity: null,
        isOnboarded: false,
    }),
    updateProfile: (updates) => set((state) => ({
        identity: state.identity ? { ...state.identity, ...updates } : null,
    })),
}), {
    name: "identity-storage",
    storage: createJSONStorage(() => zustandStorage),
}));
export { useIdentityStore as useIdentity };
