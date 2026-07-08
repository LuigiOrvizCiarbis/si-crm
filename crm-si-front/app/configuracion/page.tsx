"use client"

import { SidebarLayout } from "@/components/SidebarLayout"
import { Settings } from "lucide-react"
import { RolesCard } from "@/components/config/RolesCard"
import { SucursalesCard } from "@/components/config/SucursalesCard"
import { TeamInvitationsCard } from "@/components/config/TeamInvitationsCard"
import { MessageHotkeysCard } from "@/components/config/MessageHotkeysCard"
import { FieldsCard } from "@/components/config/FieldsCard"
import { PipelineStagesCard } from "@/components/config/PipelineStagesCard"
import { AiAssistantCard } from "@/components/config/AiAssistantCard"
import { WooCommerceCard } from "@/components/config/WooCommerceCard"
import { useTranslation } from "@/hooks/useTranslation"

export default function ConfiguracionPage() {
  const { t } = useTranslation()

  return (
    <SidebarLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 md:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-gray-500" />
              <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* <ProfileCard />
          <NotificationsCard />
          <SecurityCard />
          <IntegrationsCard />
          <ChannelsCard /> */}
            <div className="lg:col-span-2 xl:col-span-3">
              <RolesCard />
            </div>
            <div className="lg:col-span-2 xl:col-span-3">
              <SucursalesCard />
            </div>
            <TeamInvitationsCard />
            <MessageHotkeysCard />
            <FieldsCard />
            <PipelineStagesCard />
            <AiAssistantCard />
            <WooCommerceCard />
            {/*  <ApiKeysCard />
          <BillingCard /> */}
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
}
