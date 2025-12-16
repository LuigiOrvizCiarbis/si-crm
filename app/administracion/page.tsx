"use client"

import { useState } from "react"
import { SidebarLayout } from "@/components/sidebar-layout"
import { ClientManagement } from "@/components/client-management"
import { AdministracionCompactHeader } from "@/components/administracion-compact-header"

export default function AdministracionPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showNewPaymentDialog, setShowNewPaymentDialog] = useState(false)

  return (
    <SidebarLayout>
      <AdministracionCompactHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onNewPayment={() => setShowNewPaymentDialog(true)}
      />

      <div className="flex-1 p-4 md:p-8">
        <ClientManagement
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          showNewPaymentDialog={showNewPaymentDialog}
          onCloseDialog={() => setShowNewPaymentDialog(false)}
        />
      </div>
    </SidebarLayout>
  )
}
