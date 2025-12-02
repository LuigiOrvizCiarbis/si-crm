import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  type DemoTargets,
  type DailySeriesData,
  type ChannelDistribution,
  type VendedorStats,
  generateDemoTargets,
  generateDailySeries,
  generateChannelDistribution,
  generateVendorStats,
  calculateConversions,
  generateTrends,
  DEMO_TARGETS,
} from "@/lib/demo-generator"

interface DashboardState {
  mode: "demo" | "live"
  targets: DemoTargets
  dailySeries: DailySeriesData[]
  channelDistribution: ChannelDistribution[]
  vendorStats: VendedorStats[]
  conversions: ReturnType<typeof calculateConversions>
  trends: ReturnType<typeof generateTrends>
  lastGenerated: string | null

  // Actions
  toggleMode: () => void
  setMode: (mode: "demo" | "live") => void
  regenerateDemo: (seed?: number) => void
  syncWithPipeline: () => void
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      mode: "demo",
      targets: DEMO_TARGETS,
      dailySeries: [],
      channelDistribution: [],
      vendorStats: [],
      conversions: calculateConversions(DEMO_TARGETS),
      trends: generateTrends(),
      lastGenerated: null,

      toggleMode: () => {
        const currentMode = get().mode
        const newMode = currentMode === "demo" ? "live" : "demo"
        set({ mode: newMode })

        if (newMode === "demo") {
          get().regenerateDemo()
        }
      },

      setMode: (mode) => {
        set({ mode })
        if (mode === "demo") {
          get().regenerateDemo()
        }
      },

      regenerateDemo: (seed?: number) => {
        const targets = generateDemoTargets(seed)
        const dailySeries = generateDailySeries(targets)
        const channelDistribution = generateChannelDistribution(targets.leads)
        const vendorStats = generateVendorStats(targets)
        const conversions = calculateConversions(targets)
        const trends = generateTrends()

        set({
          targets,
          dailySeries,
          channelDistribution,
          vendorStats,
          conversions,
          trends,
          lastGenerated: new Date().toISOString(),
        })
      },

      syncWithPipeline: () => {
        const state = get()
        const { targets, channelDistribution, vendorStats } = state

        console.log("[v0] Syncing dashboard data with Pipeline, Contactos, and Chats")

        // Map dashboard targets to pipeline stages
        const stageMapping = {
          "Lead/Prospecto": targets.leads - targets.contactados,
          Contactado: targets.contactados - targets.seguimiento,
          "En seguimiento": Math.floor(targets.seguimiento * 0.6),
          "Re-contactar": Math.floor(targets.seguimiento * 0.4),
          "Entrevista pactada": Math.floor(targets.entrevistas * 0.4),
          "Entrevista realizada": Math.floor(targets.entrevistas * 0.3),
          "Reagendar entrevista": Math.floor(targets.entrevistas * 0.15),
          "2da Entrevista": Math.floor(targets.entrevistas * 0.15),
          "Seguimiento para cierre": targets.reservas,
          "Cliente Convertido": targets.ventas,
        }

        // Store sync data for other modules to consume
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "dashboard-sync",
            JSON.stringify({
              timestamp: new Date().toISOString(),
              stageMapping,
              channelDistribution,
              vendorStats,
              targets,
            }),
          )
        }

        console.log("[v0] Sync data stored:", stageMapping)
      },
    }),
    {
      name: "dashboard-storage",
    },
  ),
)

// Initialize demo data on first load
if (typeof window !== "undefined") {
  const store = useDashboardStore.getState()
  if (!store.lastGenerated) {
    store.regenerateDemo()
  }
}
