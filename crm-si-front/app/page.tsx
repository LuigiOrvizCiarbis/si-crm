"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/useAuthStore"
import { SidebarLayout } from "@/components/SidebarLayout"
import { DashboardCompactHeader } from "@/components/dashboard-compact-header"
import { MetricsCards } from "@/components/metrics-cards"
import { SalesFunnel } from "@/components/sales-funnel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics"
import { useTranslation } from "@/hooks/useTranslation"
import type { DashboardFilters, DashboardPeriodo } from "@/lib/api/dashboard"

const TAB_KEYS = ["general", "channels", "salespeople", "tasks", "finance"] as const
type TabKey = (typeof TAB_KEYS)[number]

export default function Dashboard() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { t } = useTranslation()

  const [activeTab, setActiveTab] = useState<TabKey>("general")
  const [vista, setVista] = useState("dueno")
  const [periodo, setPeriodo] = useState<DashboardPeriodo>("este-mes")
  const [canal, setCanal] = useState("todos")

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login")
    }
  }, [isAuthenticated, router])

  const filters = useMemo<DashboardFilters>(
    () => ({
      periodo,
      canal: canal === "todos" ? null : canal,
      owner: vista === "dueno" ? null : vista,
    }),
    [periodo, canal, vista]
  )

  const { data, isLoading, error, refresh } = useDashboardMetrics(filters)

  if (!isAuthenticated) {
    return null
  }

  return (
    <SidebarLayout>
      <DashboardCompactHeader
        vista={vista}
        onVistaChange={setVista}
        periodo={periodo}
        onPeriodoChange={setPeriodo}
        canal={canal}
        onCanalChange={setCanal}
      />

      <div className="px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
          <TabsList className="h-11 p-1 gap-1 bg-muted/40">
            <TabsTrigger value="general" className="text-sm font-medium px-6 py-2 h-9">
              {t("dashboard.tabs.general")}
            </TabsTrigger>
            <TabsTrigger value="channels" className="text-sm font-medium px-6 py-2 h-9">
              {t("dashboard.tabs.channels")}
            </TabsTrigger>
            <TabsTrigger value="salespeople" className="text-sm font-medium px-6 py-2 h-9">
              {t("dashboard.tabs.salespeople")}
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-sm font-medium px-6 py-2 h-9">
              {t("dashboard.tabs.tasks")}
            </TabsTrigger>
            <TabsTrigger value="finance" className="text-sm font-medium px-6 py-2 h-9">
              {t("dashboard.tabs.finance")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 mt-6">
            {error ? (
              <Card>
                <CardContent className="py-8 flex flex-col items-center gap-3">
                  <p className="text-sm text-destructive">{t("dashboard.errors.loadFailed")}</p>
                  <p className="text-xs text-muted-foreground">{error}</p>
                  <Button variant="outline" size="sm" onClick={refresh}>
                    {t("dashboard.errors.retry")}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <MetricsCards
                  kpis={data?.kpis}
                  previous={data?.previous}
                  trends={data?.trends as Record<string, number> | undefined}
                  isLoading={isLoading}
                />
                <SalesFunnel stages={data?.stages} isLoading={isLoading} />
              </>
            )}
          </TabsContent>

          {(["channels", "salespeople", "tasks", "finance"] as const).map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-6">
              <Card>
                <CardContent className="py-12 text-center space-y-2">
                  <p className="text-base font-medium">{t("dashboard.placeholders.comingSoon")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("dashboard.placeholders.tabComingSoonDesc")}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </SidebarLayout>
  )
}
