import { useCallback, useEffect, useState } from 'react';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { asc } from 'drizzle-orm';
import { db } from '@/db/client';
import { peers } from '@/db/schema';
// In-memory search only - no separate contacts DB table needed
import { useContactsStore } from '@/src/store/contactsStore';
function peerToContact(peer) {
    return {
        id: peer.id,
        phoneNumber: peer.id,
        displayName: peer.displayName,
        avatarUri: peer.avatarUri ?? null,
        lastSeen: peer.lastSeen ? peer.lastSeen.getTime() : null,
        isOnline: 0,
    };
}
const toContacts = (peers) => peers.map(peerToContact);
const toLower = (value) => value.toLowerCase();
const matchesContact = (contact, query) => toLower(contact.displayName).includes(query) || toLower(contact.phoneNumber).includes(query);
export function useContacts() {
    const { contacts, isLoading, error, setContacts, setLoading, setError } = useContactsStore();
    // Use the peers table (existing schema) as the reactive source of truth
    const { data: peersData } = useLiveQuery(db.query.peers.findMany({ orderBy: asc(peers.displayName) }));
    useEffect(() => {
        if (peersData) {
            setContacts(toContacts(peersData));
        }
    }, [peersData, setContacts]);
    const refetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const fresh = await db.query.peers.findMany({ orderBy: asc(peers.displayName) });
            setContacts(toContacts(fresh));
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load contacts');
        }
        finally {
            setLoading(false);
        }
    }, [setContacts, setLoading, setError]);
    const searchContacts = useCallback(async (query) => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery)
            return contacts;
        return contacts.filter((c) => matchesContact(c, normalizedQuery));
    }, [contacts]);
    return { contacts, isLoading, error, refetch, searchContacts };
}
export function useContact(id) {
    const contacts = useContactsStore((state) => state.contacts);
    const [isLoading, setIsLoading] = useState(false);
    const storeContact = contacts.find((c) => c.id === id) ?? null;
    const [dbContact, setDbContact] = useState(null);
    useEffect(() => {
        if (storeContact)
            return;
        let isMounted = true;
        setIsLoading(true);
        db.query.peers
            .findFirst({ where: (p, { eq }) => eq(p.id, id) })
            .then((peer) => {
            if (isMounted) {
                setDbContact(peer ? peerToContact(peer) : null);
            }
        })
            .catch(() => {
            if (isMounted) {
                setDbContact(null);
            }
        })
            .finally(() => {
            if (isMounted) {
                setIsLoading(false);
            }
        });
        return () => {
            isMounted = false;
        };
    }, [id, storeContact]);
    return {
        contact: storeContact ?? dbContact,
        isLoading,
    };
}
