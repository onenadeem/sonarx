import { asc, eq, like, or } from 'drizzle-orm'

import { db } from '@/db/client'
import {
  contacts,
  type Contact,
  type NewContact,
} from '@/src/db/schema'

export async function getContacts(): Promise<Contact[]> {
  return db.select().from(contacts).orderBy(asc(contacts.displayName))
}

export async function getContact(id: string): Promise<Contact | null> {
  const [contact] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, id))
    .limit(1)
  return contact ?? null
}

export async function getContactByPhone(phone: string): Promise<Contact | null> {
  const [contact] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.phoneNumber, phone))
    .limit(1)
  return contact ?? null
}

export async function insertContact(contact: NewContact): Promise<Contact> {
  await db.insert(contacts).values(contact)

  const [created] = await db
    .select()
    .from(contacts)
    .where(eq(contacts.id, contact.id))
    .limit(1)

  if (!created) throw new Error('Failed to insert contact')
  return created
}

export async function updateContact(
  id: string,
  updates: Partial<NewContact>,
): Promise<void> {
  await db.update(contacts).set(updates).where(eq(contacts.id, id))
}

export async function updateContactPresence(
  id: string,
  isOnline: boolean,
  lastSeen?: number,
): Promise<void> {
  const updates: Partial<NewContact> = { isOnline: isOnline ? 1 : 0 }
  if (lastSeen !== undefined) updates.lastSeen = lastSeen
  await db.update(contacts).set(updates).where(eq(contacts.id, id))
}

export async function deleteContact(id: string): Promise<void> {
  await db.delete(contacts).where(eq(contacts.id, id))
}

export async function searchContacts(query: string): Promise<Contact[]> {
  const pattern = `%${query}%`
  return db
    .select()
    .from(contacts)
    .where(
      or(
        like(contacts.displayName, pattern),
        like(contacts.phoneNumber, pattern),
      ),
    )
    .orderBy(asc(contacts.displayName))
}
