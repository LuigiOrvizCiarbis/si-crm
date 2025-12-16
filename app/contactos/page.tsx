"use client"

import { ContactsStats } from "@/components/contacts-stats"
import { ContactsList } from "@/components/contacts-list"
import { SidebarLayout } from "@/components/sidebar-layout"
import { useState } from "react"

export default function ContactosPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const handleNewContact = () => {
    // Handle new contact
  }

  return (
    <SidebarLayout>
      <div className="flex-1 space-y-6 p-6">
        <ContactsStats />
        <ContactsList />
      </div>
    </SidebarLayout>
  )
}
