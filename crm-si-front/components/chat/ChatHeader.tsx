import { Button } from "@/components/ui/button"
import { Zap, FileText, MessageCircle } from "lucide-react"

interface ChatHeaderProps {
  activeFilter: number|string
  onConnectChannel: () => void
  onImportTemplates: () => void
  onNewChat: () => void
}

export const ChatHeader = ({ 
  activeFilter, 
  onConnectChannel, 
  onImportTemplates, 
  onNewChat 
}: ChatHeaderProps) => {
  const getConnectButtonText = () => {
    switch (activeFilter) {
      case "whatsapp": return "Conectar WhatsApp"
      case "instagram": return "Conectar Instagram"
      case "facebook": return "Conectar Facebook"
      case "linkedin": return "Conectar LinkedIn"
      case "telegram": return "Conectar Telegram"
      case "web": return "Conectar Chat Web"
      case "mail": return "Conectar Mail"
      default: return "Conectar canal"
    }
  }

  return (
    <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Chats</h1>
        <div className="flex items-center gap-2">
          <Button onClick={onConnectChannel} className="gap-2">
            <Zap className="w-4 h-4" />
            {getConnectButtonText()}
          </Button>
          <Button variant="outline" onClick={onImportTemplates} className="gap-2 bg-transparent">
            <FileText className="w-4 h-4" />
            Importar plantillas
          </Button>
          <Button variant="outline" onClick={onNewChat} className="gap-2 bg-transparent">
            <MessageCircle className="w-4 h-4" />
            Nuevo chat
          </Button>
        </div>
      </div>
    </div>
  )
}