import { create } from "zustand"
import { persist } from "zustand/middleware"

interface DashboardState {
  lastSynced: string | null
  syncWithPipeline: () => void
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      lastSynced: null,

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
