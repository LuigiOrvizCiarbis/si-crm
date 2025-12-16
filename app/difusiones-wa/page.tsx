import { SidebarLayout } from "@/components/sidebar-layout"

export default function DifusionesWAPage() {
  return (
    <SidebarLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold">Difusiones WhatsApp</h1>
        <p className="text-muted-foreground mt-2">Envía mensajes masivos a tus contactos</p>
        <div className="mt-6 p-8 border border-dashed border-border rounded-lg text-center">
          <p className="text-muted-foreground">Contenido en desarrollo</p>
        </div>
      </div>
    </SidebarLayout>
  )
}
