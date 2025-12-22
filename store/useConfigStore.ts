import { create } from "zustand"
import { persist } from "zustand/middleware"

export type AccountType = "persona" | "empresa"
export type IntegrationType = "whatsapp" | "instagram" | "facebook" | "telegram" | "smtp" | "gcal" | "mp" | "stripe"
export type PlanId = "starter" | "classic" | "intermediate" | "high" | "agency" | "enterprise"
export type Role = "admin" | "vendedor"

export interface Profile {
  accountType: AccountType
  persona?: {
    nombre: string
    dni?: string
    apodo?: string
  }
  empresa?: {
    razonSocial: string
    cuit?: string
    fantasia?: string
  }
  comunes: {
    website?: string
    email?: string
    contacto?: {
      whatsapp?: string
      telegram?: string
    }
    redes?: {
      ig?: string
      fb?: string
      lin?: string
      tt?: string
      x?: string
      yt?: string
    }
  }
}

export interface Integration {
  id: IntegrationType
  nombre: string
  descripcion: string
  conectado: boolean
  icono: string
}

export interface NotificationPrefs {
  nuevoMensaje: boolean
  tareaVencida: boolean
  tareaProxima: boolean
  cierreVenta: boolean
  recordatoriosDiarios: boolean
  reporteSemanal: boolean
}

export interface Session {
  id: string
  agente: string
  dispositivo: string
  ultimaActividad: string
  actual?: boolean
}

export interface Security {
  twoFAEnabled: boolean
  sesiones: Session[]
}

export interface Channel {
  id: string
  tipo: "whatsapp" | "instagram" | "facebook" | "telegram" | "email"
  label: string
  handle: string
  activo: boolean
}

export interface ApiKey {
  id: string
  env: "live" | "test"
  masked: string
  createdAt: string
}

export interface Billing {
  actual: PlanId
  vencimiento: string
  montoUSD: number
}

export interface UserWithRole {
  id: string
  nombre: string
  email: string
  role: Role
}

interface ConfigStore {
  profile: Profile
  setProfile: (profile: Profile) => void
  updateProfile: (updates: Partial<Profile>) => void

  integrations: Integration[]
  toggleIntegration: (id: IntegrationType) => void

  notifications: NotificationPrefs
  setNotifications: (prefs: Partial<NotificationPrefs>) => void

  security: Security
  setSecurity: (security: Partial<Security>) => void
  removeSession: (id: string) => void

  channels: Channel[]
  addChannel: (channel: Channel) => void
  removeChannel: (id: string) => void

  apiKeys: ApiKey[]
  generateApiKey: (env: "live" | "test") => void
  revokeApiKey: (id: string) => void

  billing: Billing
  setBilling: (billing: Partial<Billing>) => void

  users: UserWithRole[]
  updateUserRole: (userId: string, role: Role) => void
}

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set, get) => ({
      profile: {
        accountType: "persona",
        persona: {
          nombre: "Juan Pérez",
          dni: "12345678",
          apodo: "juanp",
        },
        comunes: {
          email: "juan@socialimpulse.agency",
          website: "https://socialimpulse.agency",
          contacto: {
            whatsapp: "+54 9 11 1234-5678",
          },
          redes: {
            ig: "@socialimpulse",
            lin: "https://linkedin.com/company/socialimpulse",
          },
        },
      },
      setProfile: (profile) => set({ profile }),
      updateProfile: (updates) =>
        set((state) => ({
          profile: { ...state.profile, ...updates },
        })),

      integrations: [
        {
          id: "whatsapp",
          nombre: "WhatsApp (Meta Cloud API)",
          descripcion: "API oficial de WhatsApp Business",
          conectado: true,
          icono: "whatsapp",
        },
        {
          id: "instagram",
          nombre: "Instagram",
          descripcion: "Mensajes directos de Instagram",
          conectado: false,
          icono: "instagram",
        },
        {
          id: "facebook",
          nombre: "Facebook",
          descripcion: "Messenger de Facebook",
          conectado: false,
          icono: "facebook",
        },
        {
          id: "telegram",
          nombre: "Telegram",
          descripcion: "Bot de Telegram",
          conectado: false,
          icono: "telegram",
        },
        {
          id: "smtp",
          nombre: "Email (SMTP)",
          descripcion: "Servidor de correo electrónico",
          conectado: false,
          icono: "mail",
        },
        {
          id: "gcal",
          nombre: "Google Calendar",
          descripcion: "Sincronización de calendario",
          conectado: false,
          icono: "calendar",
        },
        {
          id: "mp",
          nombre: "Mercado Pago",
          descripcion: "Pagos en Argentina",
          conectado: false,
          icono: "credit-card",
        },
        {
          id: "stripe",
          nombre: "Stripe",
          descripcion: "Pagos internacionales",
          conectado: false,
          icono: "dollar-sign",
        },
      ],
      toggleIntegration: (id) =>
        set((state) => ({
          integrations: state.integrations.map((int) => (int.id === id ? { ...int, conectado: !int.conectado } : int)),
        })),

      notifications: {
        nuevoMensaje: true,
        tareaVencida: true,
        tareaProxima: true,
        cierreVenta: true,
        recordatoriosDiarios: false,
        reporteSemanal: true,
      },
      setNotifications: (prefs) =>
        set((state) => ({
          notifications: { ...state.notifications, ...prefs },
        })),

      security: {
        twoFAEnabled: false,
        sesiones: [
          {
            id: "1",
            agente: "Chrome",
            dispositivo: "Windows",
            ultimaActividad: "Hace 5 minutos",
            actual: true,
          },
          {
            id: "2",
            agente: "Safari",
            dispositivo: "iPhone",
            ultimaActividad: "Hace 2 horas",
          },
        ],
      },
      setSecurity: (security) =>
        set((state) => ({
          security: { ...state.security, ...security },
        })),
      removeSession: (id) =>
        set((state) => ({
          security: {
            ...state.security,
            sesiones: state.security.sesiones.filter((s) => s.id !== id),
          },
        })),

      channels: [
        {
          id: "1",
          tipo: "whatsapp",
          label: "WhatsApp Account 1",
          handle: "+54 11 1234-5678",
          activo: true,
        },
        {
          id: "2",
          tipo: "whatsapp",
          label: "WhatsApp Account 2",
          handle: "+54 11 8765-4321",
          activo: true,
        },
        {
          id: "3",
          tipo: "instagram",
          label: "Instagram @socialimpulse",
          handle: "@socialimpulse",
          activo: true,
        },
      ],
      addChannel: (channel) =>
        set((state) => ({
          channels: [...state.channels, channel],
        })),
      removeChannel: (id) =>
        set((state) => ({
          channels: state.channels.filter((c) => c.id !== id),
        })),

      apiKeys: [
        {
          id: "1",
          env: "live",
          masked: "sk_live_••••••••••••4521",
          createdAt: "Hace 3 meses",
        },
        {
          id: "2",
          env: "test",
          masked: "sk_test_••••••••••••8932",
          createdAt: "Hace 1 mes",
        },
      ],
      generateApiKey: (env) =>
        set((state) => ({
          apiKeys: [
            ...state.apiKeys,
            {
              id: Date.now().toString(),
              env,
              masked: `sk_${env}_••••••••••••${Math.floor(Math.random() * 10000)}`,
              createdAt: "Ahora",
            },
          ],
        })),
      revokeApiKey: (id) =>
        set((state) => ({
          apiKeys: state.apiKeys.filter((key) => key.id !== id),
        })),

      billing: {
        actual: "intermediate",
        vencimiento: "15 de febrero, 2024",
        montoUSD: 250,
      },
      setBilling: (billing) =>
        set((state) => ({
          billing: { ...state.billing, ...billing },
        })),

      users: [
        {
          id: "1",
          nombre: "Juan Pérez",
          email: "juan@empresa.com",
          role: "admin",
        },
        {
          id: "2",
          nombre: "María González",
          email: "maria@empresa.com",
          role: "vendedor",
        },
      ],
      updateUserRole: (userId, role) =>
        set((state) => ({
          users: state.users.map((user) => (user.id === userId ? { ...user, role } : user)),
        })),
    }),
    {
      name: "config-store",
    },
  ),
)
