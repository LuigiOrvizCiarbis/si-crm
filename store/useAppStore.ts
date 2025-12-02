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
}

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
      leads: leadsData, // Using centralized data
      setLeads: (leads) => set({ leads }),
      addLead: (lead) => set((state) => ({ leads: [...state.leads, lead] })),
      updateLead: (id, updates) =>
        set((state) => ({
          leads: state.leads.map((lead) => (lead.id === id ? { ...lead, ...updates } : lead)),
        })),
      moveLead: (id, newEstado) =>
        set((state) => ({
          leads: state.leads.map((lead) => (lead.id === id ? { ...lead, estado: newEstado } : lead)),
        })),

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
    }),
    {
      name: "social-impulse-store",
      partialize: (state) => ({
        usuario: state.usuario,
        filters: state.filters,
        sidebarCollapsed: state.sidebarCollapsed,
        whatsappConnected: state.whatsappConnected,
      }),
    },
  ),
)
