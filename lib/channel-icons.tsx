import { MessageCircle, Mail, Globe, Instagram, Facebook, Linkedin, type LucideIcon } from "lucide-react"

export function getChannelIcon(channel: string): LucideIcon {
  const channelLower = channel.toLowerCase()

  const iconMap: Record<string, LucideIcon> = {
    whatsapp: MessageCircle, // WhatsApp green bubble
    instagram: Instagram, // Instagram camera icon
    facebook: Facebook, // Facebook F
    messenger: Facebook, // Messenger uses Facebook icon
    linkedin: Linkedin, // LinkedIn logo
    tiktok: MessageCircle, // TikTok uses generic message
    gmail: Mail,
    email: Mail,
    outlook: Mail,
    web: Globe,
    telegram: MessageCircle, // Telegram plane icon (using MessageCircle as fallback)
  }

  return iconMap[channelLower] || MessageCircle
}
