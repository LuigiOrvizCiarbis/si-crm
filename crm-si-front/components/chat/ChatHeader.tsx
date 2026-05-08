"use client"

import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"

interface ChatHeaderProps {
  onImportTemplates: () => void
}

export const ChatHeader = ({
  onImportTemplates
}: ChatHeaderProps) => {
  const { t } = useTranslation()

  return (
    <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("chats.title")}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onImportTemplates} className="gap-2 bg-transparent">
            <FileText className="w-4 h-4" />
            {t("chats.importTemplates")}
          </Button>
        </div>
      </div>
    </div>
  )
}
