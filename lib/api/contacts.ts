import type { Contact } from "@/components/contacts-list"
import { SyncManager } from "@/lib/sync-manager"

export async function updateContact(contactId: string, updates: Partial<Contact>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  if (Math.random() < 0.1) {
    throw new Error("Network error")
  }

  if (typeof window !== "undefined") {
    const storageKey = "contacts-data"
    const existingData = localStorage.getItem(storageKey)
    const contacts = existingData ? JSON.parse(existingData) : []

    const updatedContacts = contacts.map((c: Contact) => (c.id === contactId ? { ...c, ...updates } : c))

    localStorage.setItem(storageKey, JSON.stringify(updatedContacts))

    const syncManager = SyncManager.getInstance()
    syncManager.syncAll(contactId, updates)
  }

  console.log("[v0] Contact updated:", contactId, updates)
}

export async function bulkUpdateContacts(contactIds: string[], updates: Partial<Contact>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 800))

  if (Math.random() < 0.1) {
    throw new Error("Network error")
  }

  if (typeof window !== "undefined") {
    const storageKey = "contacts-data"
    const existingData = localStorage.getItem(storageKey)
    const contacts = existingData ? JSON.parse(existingData) : []

    const updatedContacts = contacts.map((c: Contact) => (contactIds.includes(c.id) ? { ...c, ...updates } : c))

    localStorage.setItem(storageKey, JSON.stringify(updatedContacts))

    const syncManager = SyncManager.getInstance()
    contactIds.forEach((contactId) => {
      syncManager.syncAll(contactId, updates)
    })
  }

  console.log("[v0] Bulk update completed:", contactIds.length, "contacts")
}
