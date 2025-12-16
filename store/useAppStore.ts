import { create } from "zustand"
import { persist } from "zustand/middleware"
import { leadsData } from "@/lib/data"

export interface Lead {
  id: string
  nombre: string
  canal: "WhatsApp" | "Instagram" | "Web" | "Email"
  score: number // 0-100
  estado: "nuevo" | "en_curso" | "ganado" | "perdido"
  prob: number // probability percentage
  fechaEstimacion: string
  valor: number
  owner?: string
  dropReason?: string
  stage?: string // Added stage property
  sortIndex?: number // Added sortIndex for reordering within same stage
}

export interface Conversacion {
  id: string
  contacto: string
  canal: "WhatsApp" | "Instagram" | "Web" | "Email"
  ultimoMensaje: string
  noLeido: boolean
  timestamp: number
  leadScore?: number
}

export interface Cliente {
  id: string
  cliente: string
  plan: string
  estadoPago: "pagado" | "pendiente" | "vencido"
  riesgo: "bajo" | "medio" | "alto"
  mrr: number
  arr: number
}

export interface AppFilters {
  rango: 7 | 30 | 90
  canal: string
  owner: string
}

export interface StageColor {
  id: string
  name: string
  color: string // hex color
}

interface AppStore {
  // User state
  usuario: { nombre: string; email: string } | null
  setUsuario: (usuario: { nombre: string; email: string } | null) => void

  // Filters
  filters: AppFilters
  setFilters: (filters: Partial<AppFilters>) => void

  // Leads/Pipeline - Using centralized data
  leads: Lead[]
  setLeads: (leads: Lead[]) => void
  addLead: (lead: Lead) => void
  updateLead: (id: string, updates: Partial<Lead>) => void
  moveLead: (id: string, newEstado: Lead["estado"]) => void
  moveLeadToStage: (leadId: string, stageId: string) => void // Added moveLeadToStage function
  reorderLeadsInStage: (stageId: string, leadIds: string[]) => void // Added reorderLeadsInStage for sortable support
  updateLeadStage: (leadId: string, stageId: string) => void // Added updateLeadStage for cross-module sync

  // Conversations
  conversaciones: Conversacion[]
  setConversaciones: (conversaciones: Conversacion[]) => void
  markAsRead: (id: string) => void

  // Clients
  clientes: Cliente[]
  setClientes: (clientes: Cliente[]) => void

  // UI State
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void

  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void

  // WhatsApp Integration
  whatsappConnected: boolean
  setWhatsappConnected: (connected: boolean) => void

  // Stage Colors Management
  stageColors: StageColor[]
  setStageColor: (stageId: string, color: string) => void
  resetStageColor: (stageId: string) => void

  getStageById: (stageId: string) => StageColor | undefined
  getStageColor: (stageId: string) => string
}

const defaultStageColors: StageColor[] = [
  { id: "prospecto", name: "Lead/Prospecto", color: "#3b82f6" }, // blue-500
  { id: "contactado", name: "Contactado", color: "#06b6d4" }, // cyan-500
  { id: "seguimiento", name: "En seguimiento", color: "#6366f1" }, // indigo-500
  { id: "propuesta", name: "Envié propuesta", color: "#a855f7" }, // purple-500
  { id: "interesado", name: "Interesado", color: "#ec4899" }, // pink-500
  { id: "recontactar", name: "Re-contactar", color: "#f59e0b" }, // amber-500
  { id: "entrevista-pactada", name: "Entrevista pactada", color: "#14b8a6" }, // teal-500
  { id: "entrevista-realizada", name: "Entrevista realizada", color: "#10b981" }, // emerald-500
  { id: "reagendar", name: "Reagendar entrevista", color: "#f97316" }, // orange-500
  { id: "segunda-entrevista", name: "2da Entrevista", color: "#84cc16" }, // lime-500
  { id: "cierre", name: "Seguimiento para cierre", color: "#22c55e" }, // green-500
  { id: "convertido", name: "Cliente Convertido", color: "#16a34a" }, // green-600
  { id: "no-interesa", name: "No le interesa", color: "#ef4444" }, // red-500
  { id: "partner", name: "Partner/Colega", color: "#8b5cf6" }, // violet-500
]

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // User state
      usuario: { nombre: "Juan Pérez", email: "juan@empresa.com" },
      setUsuario: (usuario) => set({ usuario }),

      // Filters
      filters: { rango: 30, canal: "todos", owner: "todos" },
      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),

      // Leads/Pipeline
      leads: leadsData.map((lead, index) => ({
        ...lead,
        sortIndex: lead.sortIndex ?? index,
      })),
      setLeads: (leads) => set({ leads }),
      addLead: (lead) =>
        set((state) => ({
          leads: [
            ...state.leads,
            {
              ...lead,
              sortIndex:
                Math.max(...state.leads.filter((l) => l.stage === lead.stage).map((l) => l.sortIndex ?? 0), -1) + 1,
            },
          ],
        })),
      updateLead: (id, updates) =>
        set((state) => ({
          leads: state.leads.map((lead) => (lead.id === id ? { ...lead, ...updates } : lead)),
        })),
      moveLead: (id, newEstado) =>
        set((state) => ({
          leads: state.leads.map((lead) => (lead.id === id ? { ...lead, estado: newEstado } : lead)),
        })),

      moveLeadToStage: (leadId: string, stageId: string) => {
        set((state) => {
          const lead = state.leads.find((l) => l.id === leadId)
          if (!lead) return state

          const oldStage = lead.stage

          // Update probability based on stage
          const probabilityMap: Record<string, number> = {
            prospecto: 15,
            contactado: 25,
            seguimiento: 40,
            propuesta: 55,
            interesado: 65,
            recontactar: 20,
            "entrevista-pactada": 70,
            "entrevista-realizada": 75,
            reagendar: 60,
            "segunda-entrevista": 85,
            cierre: 92,
            convertido: 100,
            "no-interesa": 0,
            partner: 50,
          }

          // Get max sortIndex in destination stage
          const maxSortIndex = Math.max(
            ...state.leads.filter((l) => l.stage === stageId).map((l) => l.sortIndex ?? 0),
            -1,
          )

          // Reindex old stage after removal
          const updatedLeads = state.leads.map((l) => {
            if (l.id === leadId) {
              // Move the lead to new stage
              return {
                ...l,
                stage: stageId as Lead["stage"],
                prob: probabilityMap[stageId] || 50,
                sortIndex: maxSortIndex + 1, // Add to end of destination stage
              }
            } else if (l.stage === oldStage && (l.sortIndex ?? 0) > (lead.sortIndex ?? 0)) {
              // Reindex leads in old stage that were after the moved lead
              return { ...l, sortIndex: (l.sortIndex ?? 0) - 1 }
            }
            return l
          })

          return { leads: updatedLeads }
        })
      },

      reorderLeadsInStage: (stageId: string, leadIds: string[]) => {
        set((state) => {
          const updatedLeads = state.leads.map((lead) => {
            if (lead.stage === stageId) {
              const newIndex = leadIds.indexOf(lead.id)
              if (newIndex !== -1) {
                return { ...lead, sortIndex: newIndex }
              }
            }
            return lead
          })
          return { leads: updatedLeads }
        })
      },

      updateLeadStage: (leadId: string, stageId: string) => {
        get().moveLeadToStage(leadId, stageId)
      },

      // Conversations
      conversaciones: [
        {
          id: "1",
          contacto: "María González",
          canal: "WhatsApp",
          ultimoMensaje: "Hola, me interesa el plan Pro",
          noLeido: true,
          timestamp: Date.now() - 300000,
          leadScore: 85,
        },
        {
          id: "2",
          contacto: "Carlos Rodríguez",
          canal: "Instagram",
          ultimoMensaje: "Gracias por la información",
          noLeido: false,
          timestamp: Date.now() - 600000,
          leadScore: 72,
        },
      ],
      setConversaciones: (conversaciones) => set({ conversaciones }),
      markAsRead: (id) =>
        set((state) => ({
          conversaciones: state.conversaciones.map((conv) => (conv.id === id ? { ...conv, noLeido: false } : conv)),
        })),

      // Clients
      clientes: [
        {
          id: "1",
          cliente: "Empresa ABC",
          plan: "Pro",
          estadoPago: "pagado",
          riesgo: "bajo",
          mrr: 299,
          arr: 3588,
        },
        {
          id: "2",
          cliente: "Startup XYZ",
          plan: "Basic",
          estadoPago: "pendiente",
          riesgo: "medio",
          mrr: 99,
          arr: 1188,
        },
      ],
      setClientes: (clientes) => set({ clientes }),

      // UI State
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      // WhatsApp Integration
      whatsappConnected: false,
      setWhatsappConnected: (connected) => set({ whatsappConnected: connected }),

      // Stage Colors Management
      stageColors: defaultStageColors,
      setStageColor: (stageId, color) =>
        set((state) => ({
          stageColors: state.stageColors.map((stage) => (stage.id === stageId ? { ...stage, color } : stage)),
        })),
      resetStageColor: (stageId) =>
        set((state) => ({
          stageColors: state.stageColors.map((stage) =>
            stage.id === stageId
              ? { ...stage, color: defaultStageColors.find((s) => s.id === stageId)?.color || "#6b7280" }
              : stage,
          ),
        })),

      getStageById: (stageId: string) => {
        return get().stageColors.find((s) => s.id === stageId)
      },
      getStageColor: (stageId: string) => {
        return get().stageColors.find((s) => s.id === stageId)?.color || "#6b7280"
      },
    }),
    {
      name: "social-impulse-store",
      partialize: (state) => ({
        usuario: state.usuario,
        filters: state.filters,
        sidebarCollapsed: state.sidebarCollapsed,
        whatsappConnected: state.whatsappConnected,
        stageColors: state.stageColors,
        leads: state.leads, // Persist leads with sortIndex
      }),
    },
  ),
)
