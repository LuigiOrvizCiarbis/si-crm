import { MetricsCards } from "@/components/metrics-cards"
import { SalesFunnel } from "@/components/sales-funnel"
import { RecentActivity } from "@/components/recent-activity"
import { OmnichannelStats } from "@/components/omnichannel-stats"
import { SidebarLayout } from "@/components/sidebar-layout"
import { AdvancedFunnelMetrics } from "@/components/advanced-funnel-metrics"
import { ConversionAnalytics } from "@/components/conversion-analytics"
import { ExecutiveDashboard } from "@/components/executive-dashboard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DemoLiveToggle } from "@/components/DemoLiveToggle"
import { QuickActions } from "@/components/QuickActions"
import { PipelineHealth } from "@/components/PipelineHealth"
import {
  FunnelByChannelChart,
  TimeSeriesChart,
  TopVendorsChart,
  ChannelDistributionChart,
} from "@/components/dashboard-charts"

export default function Dashboard() {
  return (
    <SidebarLayout>
      {/* Header with Demo/Live toggle */}
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard V1.3</h1>
            <p className="text-muted-foreground">Funnel realista con modo Demo y Live</p>
          </div>
          <DemoLiveToggle />
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="p-6 space-y-6">
        {/* Quick Actions */}
        <QuickActions />

        {/* Main Metrics - 6 KPIs */}
        <div>
          <h2 className="text-lg font-semibold mb-4">KPIs del embudo de ventas</h2>
          <MetricsCards />
        </div>

        {/* Charts Row 1: Funnel + Time Series */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FunnelByChannelChart />
          <TimeSeriesChart />
        </div>

        {/* Charts Row 2: Vendors + Channels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopVendorsChart />
          <ChannelDistributionChart />
        </div>

        {/* Pipeline Health */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Salud del pipeline</h2>
          <PipelineHealth />
        </div>

        {/* Previous Dashboard Sections */}
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
