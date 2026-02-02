import { TeamMember } from './types'
import { MessageSquare, Instagram, Facebook, Linkedin, Globe, Mail } from "lucide-react"

export const aiSuggestions = [
  "Enviar plan Pro", 
  "Agendar demo hoy 11:00", 
  "Pedir datos de facturación"
]

export const teamMembers: TeamMember[] = [
  { id: "me", name: "Luigi Ciarbis", role: "Owner" },
  { id: "v1", name: "Julieta Vendedora", role: "Vendedor" },
  { id: "v2", name: "Pablo Vendedor", role: "Vendedor" },
  { id: "sup", name: "Claudia Supervisor", role: "Supervisor" },
]

export const filterButtons = [
  { key: "todos", label: "TODOS", icon: MessageSquare },
  { key: "no-leidos", label: "NO LEÍDOS", icon: "circle" },
  { key: "whatsapp", label: "WHATSAPP", icon: MessageSquare },
  { key: "instagram", label: "INSTAGRAM", icon: Instagram },
  { key: "facebook", label: "FACEBOOK", icon: Facebook },
  { key: "linkedin", label: "LINKEDIN", icon: Linkedin },
  { key: "telegram", label: "TELEGRAM", icon: "circle" },
  { key: "web", label: "WEB", icon: Globe },
  { key: "mail", label: "MAIL", icon: Mail },
]