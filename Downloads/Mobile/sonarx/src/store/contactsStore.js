import { create } from 'zustand';
export const useContactsStore = create()((set) => ({
    contacts: [],
    isLoading: false,
    error: null,
    setContacts: (contacts) => set({ contacts }),
    addContact: (contact) => set((state) => ({ contacts: [...state.contacts, contact] })),
    updateContact: (id, updates) => set((state) => ({
        contacts: state.contacts.map((c) => c.id === id ? { ...c, ...updates } : c),
    })),
    removeContact: (id) => set((state) => ({
        contacts: state.contacts.filter((c) => c.id !== id),
    })),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
}));
