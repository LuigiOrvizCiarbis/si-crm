"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, UserPlus, RefreshCcw, Zap, FileSpreadsheet } from "lucide-react"
import { useDashboardStore } from "@/store/useDashboardStore"
import { toast } from "sonner"

export function QuickActions() {
  const { regenerateDemo, mode } = useDashboardStore()

  const handleRegenerate = () => {
    regenerateDemo(Date.now())
    toast.success("Datos demo regenerados con nueva semilla")
  }

  const handleReassign = () => {
    toast.info("Reasignando 10 leads sin contacto a agentes disponibles...")
    setTimeout(() => {
      toast.success("10 leads reasignados exitosamente")
    }, 1500)
  }

  const handleNewCampaign = () => {
    toast.info("Funcionalidad de campaña próximamente")
  }

  const handleImportLeads = () => {
    toast.info("Importación de leads próximamente")
  }

  const handleExportCSV = () => {
    toast.success("Exportando datos a CSV...")
    // In real app, trigger CSV download
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleNewCampaign} className="gap-2">
            <Zap className="w-4 h-4" />
            Crear campaña
          </Button>

          <Button onClick={handleImportLeads} variant="outline" className="gap-2 bg-transparent">
            <Upload className="w-4 h-4" />
            Importar leads
          </Button>

          <Button onClick={handleReassign} variant="outline" className="gap-2 bg-transparent">
            <UserPlus className="w-4 h-4" />
            Reasignar pendientes
          </Button>

          <Button onClick={handleExportCSV} variant="outline" className="gap-2 bg-transparent">
            <FileSpreadsheet className="w-4 h-4" />
            Exportar CSV
          </Button>

          {mode === "demo" && (
            <Button onClick={handleRegenerate} variant="secondary" className="gap-2 ml-auto">
              <RefreshCcw className="w-4 h-4" />
              Regenerar Demo
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
