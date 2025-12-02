"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageSquare, Instagram, Facebook } from "lucide-react"

interface Conversation {
  id: string
  contactName: string
  lastMessage: string
  timestamp: string
  unreadCount: number
  channel: "whatsapp" | "instagram" | "facebook" | "linkedin"
  avatar?: string
  isActive: boolean
}

const conversations: Conversation[] = [
  {
    id: "1",
    contactName: "María González",
    lastMessage: "Hola, me interesa conocer más sobre sus servicios de marketing digital...",
    timestamp: "10:30",
    unreadCount: 2,
    channel: "instagram",
    isActive: true,
  },
  {
    id: "2",
    contactName: "Carlos Rodríguez",
    lastMessage: "¿Podrían enviarme una cotización para redes sociales?",
    timestamp: "09:45",
    unreadCount: 1,
    channel: "whatsapp",
    isActive: false,
  },
  {
    id: "3",
    contactName: "Ana Martínez",
    lastMessage: "Perfecto, agendemos una reunión para la próxima semana",
    timestamp: "Ayer",
    unreadCount: 0,
    channel: "facebook",
    isActive: false,
  },
  {
    id: "4",
    contactName: "Roberto Silva",
    lastMessage: "Gracias por la información, voy a revisarla con mi equipo",
    timestamp: "Ayer",
    unreadCount: 0,
    channel: "linkedin",
    isActive: false,
  },
  {
    id: "5",
    contactName: "Laura Pérez",
    lastMessage: "¿Cuándo podríamos hacer una videollamada?",
    timestamp: "2d",
    unreadCount: 3,
    channel: "whatsapp",
    isActive: false,
  },
  {
    id: "6",
    contactName: "Diego Morales",
    lastMessage: "Me parece excelente la propuesta que enviaron",
    timestamp: "2d",
    unreadCount: 0,
    channel: "instagram",
    isActive: false,
  },
  {
    id: "7",
    contactName: "Carmen López",
    lastMessage: "Necesito más detalles sobre los precios",
    timestamp: "3d",
    unreadCount: 1,
    channel: "facebook",
    isActive: false,
  },
  {
    id: "8",
    contactName: "Andrés Ruiz",
    lastMessage: "¡Perfecto! Vamos adelante con el proyecto",
    timestamp: "3d",
    unreadCount: 0,
    channel: "linkedin",
    isActive: false,
  },
  {
    id: "9",
    contactName: "Patricia Vega",
    lastMessage: "¿Tienen disponibilidad para esta semana?",
    timestamp: "4d",
    unreadCount: 2,
    channel: "whatsapp",
    isActive: false,
  },
]

function getChannelIcon(channel: string) {
  switch (channel) {
    case "whatsapp":
      return <MessageSquare className="w-3 h-3 text-green-500" />
    case "instagram":
      return <Instagram className="w-3 h-3 text-pink-500" />
    case "facebook":
      return <Facebook className="w-3 h-3 text-blue-500" />
    default:
      return <MessageSquare className="w-3 h-3" />
  }
}

export function ChatConversationList() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="p-3 border-b border-border">
        <h3 className="font-semibold text-sm">Conversaciones</h3>
        <p className="text-xs text-muted-foreground">Instagram • 8 sin leer</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-border">
          {conversations.map((conversation) => (
            <Button
              key={conversation.id}
              variant="ghost"
              className={`w-full p-2 h-auto justify-start ${conversation.isActive ? "bg-muted" : ""}`}
            >
              <div className="flex items-start gap-2 w-full">
                <div className="relative">
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={conversation.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs">
                      {conversation.contactName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5">{getChannelIcon(conversation.channel)}</div>
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="font-medium text-xs truncate">{conversation.contactName}</h4>
                    <span className="text-xs text-muted-foreground">{conversation.timestamp}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate leading-tight">{conversation.lastMessage}</p>
                </div>

                {conversation.unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs h-4 px-1">
                    {conversation.unreadCount}
                  </Badge>
                )}
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
