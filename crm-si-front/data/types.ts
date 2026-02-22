import { ChannelType } from "./enums"



export interface Channel {
  id:  number
  tenant_id: number
  user_id: number
  type: ChannelType  // Usa el enum sincronizado
  name: string
  status: "active" | "disconnected"
  created_at: string
  updated_at: string
  whatsapp_config?: {
    id: number
    channel_id: number
    phone_number_id: string
    display_phone_number?: string
    waba_id: string
    verify_token: string | null
    created_at: string
    updated_at: string
  }
  instagram_config?: {
    id: number
    channel_id: number
    page_id: string
    access_token: string
    created_at: string
    updated_at: string
  }
  facebook_config?: {
    id: number
    channel_id: number
    page_id: string
    access_token: string
    created_at: string
    updated_at: string
  }
  user: {
    id: number
    tenant_id: number
    name: string
    email: string
    role: number
    created_at: string
    updated_at: string
  }
  conversationsCount: number
  phone?: string

}

export interface Conversation {
  id: number
  channelId: number
  contact: {id: string, name: string, phone?: string}
  last_message: string
  timestamp: string
  unread: boolean
  leadScore?: number
  stage?: "nuevo" | "calificado" | "demo" | "cierre"
  pipeline_stage_id?: number // Nuevo campo para etapas dinámicas
  priority?: "baja" | "media" | "alta" | "hot"
  assigneeId?: number | string
  archived?: boolean,
  channel?: Channel,
  last_message_at?: string,
  created_at?: string,
  unread_count?: number,
  messages?: Message[]

}

export type FilterType = 
  | "todos" 
  | "no-leidos" 
  | "whatsapp" 
  | "instagram" 
  | "facebook" 
  | "linkedin"    // ✅ Ahora soportado en backend
  | "telegram"    // ✅ Ahora soportado en backend
  | "web"         // ✅ Ahora soportado en backend
  | "mail"        // ✅ Ahora soportado en backend
  | "manual"
export interface TeamMember {
  id: string
  name: string
  role: string
}

export interface FilterButton {
  key: string
  label: string
  icon: React.ReactNode
}

export interface Message {
  id: number
  conversation_id: number
  content: string
  sender_type: "user" | "contact" | "system"  // Mapea SenderType enum del backend
  direction: "inbound" | "outbound"            // Mapea MessageDirection enum
  delivered_at?: string | null
  read_at?: string | null
  created_at: string
  updated_at?: string
}