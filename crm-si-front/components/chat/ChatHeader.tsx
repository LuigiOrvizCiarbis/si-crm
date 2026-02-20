"use client"

import { Button } from "@/components/ui/button"
import { Zap, FileText, MessageCircle } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"

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
  const { t } = useTranslation()

  const getConnectButtonText = () => {
    switch (activeFilter) {
      case "whatsapp": return t("chats.connectWhatsApp")
      case "instagram": return t("chats.connectInstagram")
      case "facebook": return t("chats.connectFacebook")
      case "linkedin": return t("chats.connectLinkedIn")
      case "telegram": return t("chats.connectTelegram")
      case "web": return t("chats.connectWebChat")
      case "mail": return t("chats.connectMail")
      default: return t("chats.connectChannel")
    }
  }

  return (
    <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("chats.title")}</h1>
        <div className="flex items-center gap-2">
          <Button onClick={onConnectChannel} className="gap-2">
            <Zap className="w-4 h-4" />
            {getConnectButtonText()}
          </Button>
          <Button variant="outline" onClick={onImportTemplates} className="gap-2 bg-transparent">
            <FileText className="w-4 h-4" />
            {t("chats.importTemplates")}
          </Button>
          <Button variant="outline" onClick={onNewChat} className="gap-2 bg-transparent">
            <MessageCircle className="w-4 h-4" />
            {t("chats.newChat")}
          </Button>
        </div>
      </div>
    </div>
  )
}
