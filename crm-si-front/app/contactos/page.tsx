"use client"

import { useState } from "react"
import { ContactsCompactHeader } from "@/components/contacts-compact-header"
import { ContactsStats } from "@/components/contacts-stats"
import { ContactsList } from "@/components/contacts-list"
import { SidebarLayout } from "@/components/SidebarLayout"

export default function ContactosPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleNewContact = (): void => {
    window.dispatchEvent(new CustomEvent("contacts-new-contact"))
  }

  const handleExportCSV = (): void => {
    window.dispatchEvent(new CustomEvent("contacts-export-csv"))
  }

  return (
    <SidebarLayout>
      <ContactsCompactHeader
        onExportCSV={handleExportCSV}
        onNewContact={handleNewContact}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 md:px-6 lg:px-8 py-6 space-y-6">
          <ContactsStats refreshKey={refreshKey} />
          <ContactsList hideToolbar />
        </div>
      </div>
    </SidebarLayout>
  )
}
