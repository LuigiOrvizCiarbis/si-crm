import type { ComponentType } from "react"
import type { LucideIcon } from "lucide-react"
import { Bot, ShoppingBag, Webhook } from "lucide-react"

import { AiAssistantSettings } from "@/components/config/AiAssistantSettings"
import { WebhooksSettings } from "@/components/config/WebhooksSettings"
import { WooCommerceSettings } from "@/components/config/WooCommerceSettings"
import { getAiConfig } from "@/lib/api/ai-config"
import { listWebhookEndpoints } from "@/lib/api/webhooks"
import { getWooConfig } from "@/lib/api/woocommerce"

export type IntegrationStatus =
  | "connected"
  | "available"
  | "error"
  | "comingSoon"

export type IntegrationCategory = "ai" | "ecommerce" | "developer"

export interface IntegrationDefinition {
  id: string
  icon: LucideIcon
  nameKey: string
  descriptionKey: string
  category: IntegrationCategory
  Detail: ComponentType
  fetchStatus: () => Promise<IntegrationStatus>
}

// Agregar una integración = agregar una entrada acá. El directorio, el detalle
// y el deep-link por hash (#integrations/<id>) salen de esta lista.
export const INTEGRATIONS: IntegrationDefinition[] = [
  {
    id: "ai-assistant",
    icon: Bot,
    nameKey: "settings.aiAssistant.title",
    descriptionKey: "settings.aiAssistant.description",
    category: "ai",
    Detail: AiAssistantSettings,
    fetchStatus: async () => {
      const config = await getAiConfig()
      return config?.has_api_key ? "connected" : "available"
    },
  },
  {
    id: "woocommerce",
    icon: ShoppingBag,
    nameKey: "settings.woocommerce.title",
    descriptionKey: "settings.woocommerce.description",
    category: "ecommerce",
    Detail: WooCommerceSettings,
    fetchStatus: async () => {
      const config = await getWooConfig()
      return config?.has_credentials ? "connected" : "available"
    },
  },
  {
    id: "webhooks",
    icon: Webhook,
    nameKey: "settings.webhooks.title",
    descriptionKey: "settings.webhooks.description",
    category: "developer",
    Detail: WebhooksSettings,
    fetchStatus: async () => {
      const endpoints = await listWebhookEndpoints()
      return endpoints.length > 0 ? "connected" : "available"
    },
  },
]
