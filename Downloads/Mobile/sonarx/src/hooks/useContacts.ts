import { useCallback, useEffect, useState } from 'react'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { asc } from 'drizzle-orm'

import { db } from '@/db/client'
import { peers } from '@/db/schema'
import { searchContacts as searchContactsDb } from '@/src/db/queries/contacts'
import { useContactsStore } from '@/src/store/contactsStore'
import type { Contact } from '@/src/db/schema'
import type { Peer } from '@/db/schema'

function peerToContact(peer: Peer): Contact {
  return {
    id: peer.id,
    phoneNumber: peer.id,
    displayName: peer.displayName,
    avatarUri: peer.avatarUri ?? null,
    lastSeen: peer.lastSeen ? (peer.lastSeen as Date).getTime() : null,
    isOnline: 0,
  }
}

export function useContacts() {
  const { contacts, isLoading, error, setContacts, setLoading, setError } =
    useContactsStore()

  // Use the peers table (existing schema) as the reactive source of truth
  const { data: peersData } = useLiveQuery(
    db.query.peers.findMany({ orderBy: asc(peers.displayName) }),
  )

  useEffect(() => {
    if (peersData) {
      setContacts(peersData.map(peerToContact))
    }
  }, [peersData, setContacts])

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const fresh = await db.query.peers.findMany({
        orderBy: asc(peers.displayName),
      })
      setContacts(fresh.map(peerToContact))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }, [setContacts, setLoading, setError])

  const searchContacts = useCallback(
    async (query: string): Promise<Contact[]> => {
      if (!query.trim()) return contacts

      // Search from the in-memory list first (peers mapped to contacts)
      const lower = query.toLowerCase()
      const localResults = contacts.filter(
        (c) =>
          c.displayName.toLowerCase().includes(lower) ||
          c.phoneNumber.toLowerCase().includes(lower),
      )
      if (localResults.length > 0) return localResults

      // Fall back to DB query on new contacts table
      return searchContactsDb(query)
    },
    [contacts],
  )

  return { contacts, isLoading, error, refetch, searchContacts }
}

export function useContact(id: string) {
  const contacts = useContactsStore((state) => state.contacts)
  const [isLoading, setIsLoading] = useState(false)

  const storeContact = contacts.find((c) => c.id === id) ?? null

  const [dbContact, setDbContact] = useState<Contact | null>(null)

  useEffect(() => {
    if (storeContact) return
    setIsLoading(true)
    db.query.peers
      .findFirst({ where: (p, { eq }) => eq(p.id, id) })
      .then((peer) => {
        setDbContact(peer ? peerToContact(peer) : null)
      })
      .catch(() => setDbContact(null))
      .finally(() => setIsLoading(false))
  }, [id, storeContact])

  return {
    contact: storeContact ?? dbContact,
    isLoading,
  }
}
