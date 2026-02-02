import { ContactsStats } from "@/components/contacts-stats"
import { ContactsList } from "@/components/contacts-list"
import { SidebarLayout } from "@/components/SidebarLayout"

export default function ContactosPage() {
  return (
    <SidebarLayout>
      <div className="flex-1 space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Base de Datos de Contactos</h1>
          <p className="text-muted-foreground">Gestiona todos tus leads, prospectos y clientes en un solo lugar</p>
        </div>

        <ContactsStats />
        <ContactsList />
      </div>
    </SidebarLayout>
  )
}
