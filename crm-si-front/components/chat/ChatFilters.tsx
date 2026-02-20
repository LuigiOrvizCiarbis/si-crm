"use client"

import { Button } from "@/components/ui/button"
import { PlatformIcon } from "./PlatformIcon"
import { MessageSquare } from "lucide-react"
import { FilterType } from "@/data/types"
import { useTranslation } from "@/hooks/useTranslation"

interface ChatFiltersProps {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
  availableChannelTypes?: FilterType[]
}

export const ChatFilters = ({
  activeFilter,
  onFilterChange,
  availableChannelTypes
}: ChatFiltersProps) => {
  const { t } = useTranslation()

  const allFilterButtons = [
    {
      key: "todos" as FilterType,
      label: t("chats.all"),
      icon: <MessageSquare className="w-3 h-3" />
    },
    {
      key: "no-leidos" as FilterType,
      label: t("chats.unread"),
      icon: <div className="w-3 h-3 bg-blue-500 rounded-full" />
    },
    {
      key: "whatsapp" as FilterType,
      label: "WHATSAPP",
      icon: <PlatformIcon type="whatsapp" className="w-3 h-3" />
    },
    {
      key: "instagram" as FilterType,
      label: "INSTAGRAM",
      icon: <PlatformIcon type="instagram" className="w-3 h-3" />
    },
    {
      key: "facebook" as FilterType,
      label: "FACEBOOK",
      icon: <PlatformIcon type="facebook" className="w-3 h-3" />
    },
    {
      key: "linkedin" as FilterType,
      label: "LINKEDIN",
      icon: <PlatformIcon type="linkedin" className="w-3 h-3" />
    },
    {
      key: "telegram" as FilterType,
      label: "TELEGRAM",
      icon: <PlatformIcon type="telegram" className="w-3 h-3" />
    },
    {
      key: "web" as FilterType,
      label: "WEB",
      icon: <PlatformIcon type="web" className="w-3 h-3" />
    },
    {
      key: "mail" as FilterType,
      label: "EMAIL",
      icon: <PlatformIcon type="mail" className="w-3 h-3" />
    },
    {
      key: "manual" as FilterType,
      label: "MANUAL",
      icon: <PlatformIcon type="manual" className="w-3 h-3" />
    },
  ]

  const filterButtons = availableChannelTypes
    ? allFilterButtons.filter(btn =>
        btn.key === "todos" ||
        btn.key === "no-leidos" ||
        availableChannelTypes.includes(btn.key)
      )
    : allFilterButtons

  return (
    <div className="p-4 border-b border-border">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {filterButtons.map((button) => (
          <Button
            key={button.key}
            variant={activeFilter === button.key ? "default" : "outline"}
            size="sm"
            className="whitespace-nowrap text-xs gap-1 shrink-0"
            onClick={() => onFilterChange(button.key)}
          >
            {button.icon}
            {button.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
