"use client"

import { ContactsStats } from "@/components/contacts-stats"
import { ContactsList } from "@/components/contacts-list"
import { SidebarLayout } from "@/components/sidebar-layout"
import { ContactsCompactHeader } from "@/components/contacts-compact-header"
import { useState } from "react"

export default function ContactosPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const handleNewContact = () => {
    // Handle new contact
    console.log("[v0] New contact clicked")
  }

  const handleExportCSV = () => {
    // Trigger export from ContactsList
    const event = new CustomEvent("contacts-export-csv")
    window.dispatchEvent(event)
  }

  return (
    <SidebarLayout>
      <ContactsCompactHeader
        onSearch={setSearchQuery}
        onStatusFilter={setStatusFilter}
        onExportCSV={handleExportCSV}
        onNewContact={handleNewContact}
      />

      <div className="flex-1">
        <div className="p-6 space-y-6">
          <ContactsStats />
          <ContactsList searchQuery={searchQuery} statusFilter={statusFilter} />
        </div>
      </div>
    </SidebarLayout>
  )
}
