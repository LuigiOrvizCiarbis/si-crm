import { SidebarLayout } from "@/components/sidebar-layout"
import { ClientManagement } from "@/components/client-management"

export default function AdministracionPage() {
  return (
    <SidebarLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Administración de Clientes</h2>
        </div>
        <ClientManagement />
      </div>
    </SidebarLayout>
  )
}
