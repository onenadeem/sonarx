import { create } from "zustand";
const addItemToCollection = (items, item) => [...items, item];
const updateById = (items, id, updater) =>
  items.map((item) => (item.id === id ? updater(item) : item));
const removeById = (items, id) => items.filter((item) => item.id !== id);
export const useContactsStore = create()((set) => ({
  contacts: [],
  isLoading: false,
  error: null,
  setContacts: (contacts) => set({ contacts }),
  addContact: (contact) =>
    set((state) => ({
      contacts: addItemToCollection(state.contacts, contact),
    })),
  updateContact: (id, updates) =>
    set((state) => ({
      contacts: updateById(state.contacts, id, (contact) => ({
        ...contact,
        ...updates,
      })),
    })),
  removeContact: (id) =>
    set((state) => ({
      contacts: removeById(state.contacts, id),
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
