import { 
  MessageCircle, 
  Instagram, 
  Facebook, 
  Linkedin, 
  Send, 
  Globe, 
  Mail,
  MessageSquareMore 
} from "lucide-react"

interface PlatformIconProps {
  type: string
  className?: string
}

export function PlatformIcon({ type, className = "w-5 h-5" }: PlatformIconProps) {
  const icons = {
    whatsapp: MessageCircle,
    instagram: Instagram,
    facebook: Facebook,
    linkedin: Linkedin,
    telegram: Send,
    web: Globe,
    mail: Mail,
    manual: MessageSquareMore,
  } as const

  const Icon = icons[type as keyof typeof icons] || MessageSquareMore
  
  // ✅ Colores específicos por plataforma
  const getIconColor = (type: string) => {
    switch (type) {
      case 'whatsapp':
        return 'text-green-600'
      case 'instagram':
        return 'text-pink-600'
      case 'facebook':
        return 'text-blue-600'
      case 'linkedin':
        return 'text-blue-700'
      case 'telegram':
        return 'text-blue-500'
      case 'web':
        return 'text-purple-600'
      case 'mail':
        return 'text-orange-600'
      case 'manual':
        return 'text-gray-600'
      default:
        return 'text-gray-500'
    }
  }

  return <Icon className={`${className} ${getIconColor(type)}`} />
}