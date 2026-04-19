import { create } from 'zustand'

import type { Contact } from '@/src/db/schema'

interface ContactsState {
  contacts: Contact[]
  isLoading: boolean
  error: string | null
}

interface ContactsActions {
  setContacts: (contacts: Contact[]) => void
  addContact: (contact: Contact) => void
  updateContact: (id: string, updates: Partial<Contact>) => void
  removeContact: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useContactsStore = create<ContactsState & ContactsActions>()(
  (set) => ({
    contacts: [],
    isLoading: false,
    error: null,

    setContacts: (contacts) => set({ contacts }),

    addContact: (contact) =>
      set((state) => ({ contacts: [...state.contacts, contact] })),

    updateContact: (id, updates) =>
      set((state) => ({
        contacts: state.contacts.map((c) =>
          c.id === id ? { ...c, ...updates } : c,
        ),
      })),

    removeContact: (id) =>
      set((state) => ({
        contacts: state.contacts.filter((c) => c.id !== id),
      })),

    setLoading: (isLoading) => set({ isLoading }),

    setError: (error) => set({ error }),
  }),
)
