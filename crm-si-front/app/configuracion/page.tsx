"use client"

import { SidebarLayout } from "@/components/SidebarLayout"
import { Settings } from "lucide-react"
import { ProfileCard } from "@/components/config/ProfileCard"
import { IntegrationsCard } from "@/components/config/IntegrationsCard"
import { NotificationsCard } from "@/components/config/NotificationsCard"
import { SecurityCard } from "@/components/config/SecurityCard"
import { ChannelsCard } from "@/components/config/ChannelsCard"
import { ApiKeysCard } from "@/components/config/ApiKeysCard"
import { BillingCard } from "@/components/config/BillingCard"
import { RolesCard } from "@/components/config/RolesCard"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { useTranslation } from "@/hooks/useTranslation"

export default function ConfiguracionPage() {
  const { t } = useTranslation()

  return (
    <SidebarLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-gray-500" />
            <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
          </div>
          <LanguageSwitcher />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <ProfileCard />
          <NotificationsCard />
          <RolesCard />
          <SecurityCard />
          <IntegrationsCard />
          <ChannelsCard />
          <ApiKeysCard />
          <BillingCard />
        </div>
      </div>
    </SidebarLayout>
  )
}
