import { MessageCircle, Mail, Globe, type LucideIcon } from "lucide-react"

export function getChannelIcon(channel: string): LucideIcon {
  const channelLower = channel.toLowerCase()

  const iconMap: Record<string, LucideIcon> = {
    whatsapp: MessageCircle, // WhatsApp uses MessageCircle as closest match
    instagram: MessageCircle, // Instagram uses MessageCircle
    facebook: MessageCircle, // Facebook uses MessageCircle
    messenger: MessageCircle, // Messenger uses MessageCircle
    linkedin: MessageCircle, // LinkedIn uses MessageCircle
    tiktok: MessageCircle, // TikTok uses MessageCircle
    gmail: Mail,
    email: Mail,
    outlook: Mail,
    web: Globe,
    telegram: MessageCircle, // Telegram uses MessageCircle
  }

  return iconMap[channelLower] || MessageCircle
}
