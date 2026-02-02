"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/useAuthStore"
import { MetricsCards } from "@/components/metrics-cards"
import { SalesFunnel } from "@/components/sales-funnel"
import { RecentActivity } from "@/components/recent-activity"
import { OmnichannelStats } from "@/components/omnichannel-stats"
import { SidebarLayout } from "@/components/SidebarLayout"
import { Button } from "@/components/ui/button"
import { Plus, FileSpreadsheet } from "lucide-react"
import { AdvancedFunnelMetrics } from "@/components/advanced-funnel-metrics"
import { ConversionAnalytics } from "@/components/conversion-analytics"
import { ExecutiveDashboard } from "@/components/executive-dashboard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Dashboard() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  return (
    <SidebarLayout>
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">CRM Multicuenta Omnicanal con IA</h1>
            <p className="text-muted-foreground">Tablero principal</p>
          </div>
          <div className="flex gap-3">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo lead
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent">
              <FileSpreadsheet className="w-4 h-4" />
              Importar CSV
            </Button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="p-6 space-y-6">
        {/* Metrics */}
        <MetricsCards />

        <div>
          <h2 className="text-lg font-semibold mb-4">Estadísticas Omnicanal</h2>
          <OmnichannelStats />
        </div>

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <SalesFunnel />
          </div>
          <div className="lg:col-span-2">
            <RecentActivity />
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Métricas Avanzadas</h2>
          <Tabs defaultValue="funnel" className="space-y-4">
            <TabsList>
              <TabsTrigger value="funnel">Embudo Detallado</TabsTrigger>
              <TabsTrigger value="conversion">Análisis de Conversión</TabsTrigger>
              <TabsTrigger value="executive">Dashboard Ejecutivo</TabsTrigger>
            </TabsList>

            <TabsContent value="funnel" className="space-y-4">
              <AdvancedFunnelMetrics />
            </TabsContent>

            <TabsContent value="conversion" className="space-y-4">
              <ConversionAnalytics />
            </TabsContent>

            <TabsContent value="executive" className="space-y-4">
              <ExecutiveDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SidebarLayout>
  )
}
