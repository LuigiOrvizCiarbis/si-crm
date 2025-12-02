import { RemarketingCampaigns } from "@/components/remarketing-campaigns"
import { CrmSidebar } from "@/components/crm-sidebar"

export default function RemarketingPage() {
  return (
    <div className="flex h-screen bg-background">
      <CrmSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Remarketing</h1>
            <p className="text-muted-foreground">Mensajes masivos personalizados por etapa y etiqueta</p>
          </div>
          <RemarketingCampaigns />
        </div>
      </main>
    </div>
  )
}
