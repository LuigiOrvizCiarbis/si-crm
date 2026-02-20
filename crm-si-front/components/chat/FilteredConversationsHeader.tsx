"use client"

import { FilterType } from "@/data/types"
import { useTranslation } from "@/hooks/useTranslation"

interface FilteredConversationsHeaderProps {
  activeFilter: FilterType
}

export function FilteredConversationsHeader({ activeFilter }: FilteredConversationsHeaderProps) {
  const { t } = useTranslation()

  const filterTitles: Record<FilterType, string> = {
    todos: t("chats.filterAll"),
    "no-leidos": t("chats.filterUnread"),
    whatsapp: t("chats.filterWhatsApp"),
    instagram: t("chats.filterInstagram"),
    facebook: t("chats.filterFacebook"),
    manual: t("chats.filterManual"),
    linkedin: t("chats.filterLinkedIn"),
    telegram: t("chats.filterTelegram"),
    web: t("chats.filterWeb"),
    mail: t("chats.filterMail"),
  }

  return (
    <div className="p-4 border-b border-border bg-card">
      <h3 className="font-medium">{filterTitles[activeFilter]}</h3>
    </div>
  )
}
