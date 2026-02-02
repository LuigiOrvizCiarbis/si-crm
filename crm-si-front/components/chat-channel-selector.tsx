"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Instagram, Facebook, Linkedin, Phone, Mail } from "lucide-react"

interface Channel {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  unreadCount: number
  isActive: boolean
}

const channels: Channel[] = [
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: MessageSquare,
    color: "text-green-500",
    unreadCount: 12,
    isActive: false,
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "text-pink-500",
    unreadCount: 8,
    isActive: true,
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: Facebook,
    color: "text-blue-500",
    unreadCount: 5,
    isActive: false,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    color: "text-blue-600",
    unreadCount: 3,
    isActive: false,
  },
  {
    id: "sms",
    name: "SMS",
    icon: Phone,
    color: "text-gray-500",
    unreadCount: 2,
    isActive: false,
  },
  {
    id: "email",
    name: "Email",
    icon: Mail,
    color: "text-orange-500",
    unreadCount: 15,
    isActive: false,
  },
]

export function ChatChannelSelector() {
  return (
    <div className="border-b border-border p-3">
      {/* Filtros principales */}
      <div className="flex gap-2 mb-3">
        <Button variant="default" size="sm" className="flex-1">
          Todos
          <Badge variant="secondary" className="ml-2 text-xs">
            45
          </Badge>
        </Button>
        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
          No leídos
          <Badge variant="destructive" className="ml-2 text-xs">
            12
          </Badge>
        </Button>
      </div>

      {/* Canales con scroll horizontal */}
      <div className="overflow-x-auto">
        <div className="flex gap-2 pb-2 min-w-max">
          {channels.map((channel) => {
            const Icon = channel.icon
            return (
              <Button
                key={channel.id}
                variant={channel.isActive ? "secondary" : "outline"}
                size="sm"
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <Icon className={`w-3 h-3 ${channel.color}`} />
                <span className="text-xs">{channel.name}</span>
                {channel.unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs h-4 px-1">
                    {channel.unreadCount}
                  </Badge>
                )}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
