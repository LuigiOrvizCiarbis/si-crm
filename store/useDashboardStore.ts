import { create } from "zustand"
import { persist } from "zustand/middleware"

interface DailyData {
  date: string
  leads: number
  contactados: number
  seguimiento: number
  entrevistas: number
  reservas: number
  ventas: number
}

interface DashboardState {
  lastSynced: string | null
  targets: {
    leads: number
    contactados: number
    seguimiento: number
    entrevistas: number
    reservas: number
    ventas: number
  }
  conversions: {
    contactadoRate: string
    seguimientoRate: string
    entrevistaRate: string
    reservaRate: string
    ventaRate: string
    finalRate: string
  }
  trends: {
    leads: string
    contactados: string
    seguimiento: string
    entrevistas: string
    reservas: string
    ventas: string
  }
  dailySeries: DailyData[]
  syncWithPipeline: () => void
}

const generateDailySeries = (): DailyData[] => {
  const days = 30
  const series: DailyData[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    series.push({
      date: date.toISOString().split("T")[0],
      leads: Math.floor(Math.random() * 50) + 80,
      contactados: Math.floor(Math.random() * 40) + 60,
      seguimiento: Math.floor(Math.random() * 30) + 50,
      entrevistas: Math.floor(Math.random() * 20) + 30,
      reservas: Math.floor(Math.random() * 15) + 20,
      ventas: Math.floor(Math.random() * 10) + 8,
    })
  }
  return series
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      lastSynced: null,
      targets: {
        leads: 100,
        contactados: 80,
        seguimiento: 65,
        entrevistas: 45,
        reservas: 35,
        ventas: 25,
      },
      conversions: {
        contactadoRate: "80.0",
        seguimientoRate: "81.3",
        entrevistaRate: "69.2",
        reservaRate: "77.8",
        ventaRate: "71.4",
        finalRate: "25.0",
      },
      trends: {
        leads: "+12.5",
        contactados: "+8.3",
        seguimiento: "+5.7",
        entrevistas: "+15.2",
        reservas: "+10.1",
        ventas: "+18.4",
      },
      dailySeries: generateDailySeries(),

      syncWithPipeline: () => {
        console.log("[v0] Syncing dashboard data with Pipeline, Contactos, and Chats")

        if (typeof window !== "undefined") {
          localStorage.setItem(
            "dashboard-sync",
            JSON.stringify({
              timestamp: new Date().toISOString(),
            }),
          )
        }

        set({ lastSynced: new Date().toISOString() })
      },
    }),
    {
      name: "dashboard-storage",
    },
  ),
)
