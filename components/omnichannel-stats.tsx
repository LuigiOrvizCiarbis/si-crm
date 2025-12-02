import type React from "react"
import { Card } from "@/components/ui/card"
import { MessageSquare, Instagram, Facebook, Linkedin, Phone, Mail } from "lucide-react"

interface ChannelStat {
  name: string
  icon: React.ComponentType<{ className?: string }>
  conversations: number
  unread: number
  responseTime: string
  color: string
}

const channelStats: ChannelStat[] = [
  {
    name: "WhatsApp",
    icon: MessageSquare,
    conversations: 45,
    unread: 12,
    responseTime: "2.3 min",
    color: "text-green-500",
  },
  {
    name: "Instagram",
    icon: Instagram,
    conversations: 32,
    unread: 8,
    responseTime: "4.1 min",
    color: "text-pink-500",
  },
  {
    name: "Facebook",
    icon: Facebook,
    conversations: 28,
    unread: 5,
    responseTime: "6.2 min",
    color: "text-blue-500",
  },
  {
    name: "LinkedIn",
    icon: Linkedin,
    conversations: 15,
    unread: 3,
    responseTime: "12.5 min",
    color: "text-blue-600",
  },
  {
    name: "SMS",
    icon: Phone,
    conversations: 8,
    unread: 2,
    responseTime: "8.7 min",
    color: "text-gray-500",
  },
  {
    name: "Email",
    icon: Mail,
    conversations: 67,
    unread: 15,
    responseTime: "45.2 min",
    color: "text-orange-500",
  },
]

export function OmnichannelStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {channelStats.map((channel) => {
        const Icon = channel.icon
        return (
          <Card key={channel.name} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">{channel.name}</span>
              <Icon className={`w-4 h-4 ${channel.color}`} />
            </div>
            <div className="text-2xl font-bold mb-2">{channel.conversations}</div>
            <div className="text-xs text-muted-foreground">
              <div className="text-destructive font-medium">{channel.unread} sin leer</div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
