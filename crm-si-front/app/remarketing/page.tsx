import { RemarketingCampaigns } from "@/components/remarketing-campaigns"
import { SidebarLayout } from "@/components/SidebarLayout"

export default function RemarketingPage() {
  return (
    <SidebarLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Remarketing</h1>
          <p className="text-muted-foreground">Mensajes masivos personalizados por etapa y etiqueta</p>
        </div>
        <RemarketingCampaigns />
      </div>
    </SidebarLayout>
  )
}
