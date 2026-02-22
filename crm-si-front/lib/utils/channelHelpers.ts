import { Channel, FilterType } from "@/data/types";
import { ChannelType } from "@/data/enums";

/**
 * Extrae el identificador del canal según su tipo.
 * Cada tipo de canal tiene su propio campo identificador.
 */
export function getChannelIdentifier(channel: Channel): string | undefined {
  switch (channel.type) {
    case ChannelType.WHATSAPP:
      return channel.whatsapp_config?.display_phone_number || channel.whatsapp_config?.phone_number_id;

    case ChannelType.INSTAGRAM:
      return channel.instagram_config?.page_id;

    case ChannelType.FACEBOOK:
      return channel.facebook_config?.page_id;

    case ChannelType.LINKEDIN:
      return channel.linkedin_config?.page_id;

    case ChannelType.TELEGRAM:
      return channel.telegram_config?.bot_token?.substring(0, 10) + "...";

    case ChannelType.WEB:
      return channel.web_config?.domain;

    case ChannelType.MAIL:
      return channel.mail_config?.username;

    case ChannelType.MANUAL:
      return undefined;

    default:
      return undefined;
  }
}

/**
 * Verifica si un canal está conectado
 */
export function isChannelConnected(channel: Channel): boolean {
  return channel.status === "active";
}

/**
 * Obtiene el número de conversaciones del canal
 */
export function getChannelConversationsCount(channel: Channel): number {
  return channel.conversations_count || 0;
}

/**
 * Helper para determinar si un canal soporta envío automático de mensajes
 */
export function canSendMessages(type: ChannelType): boolean {
  switch (type) {
    case ChannelType.WHATSAPP:
    case ChannelType.INSTAGRAM:
    case ChannelType.FACEBOOK:
    case ChannelType.TELEGRAM:
    case ChannelType.MAIL:
      return true;
    case ChannelType.LINKEDIN:
    case ChannelType.WEB:
    case ChannelType.MANUAL:
      return false;
    default:
      return false;
  }
}

/**
 * Obtiene el texto del botón de conexión según el filtro activo
 */
export function getConnectButtonLabel(filter: FilterType): string {
  const labels: Record<FilterType, string> = {
    whatsapp: "Conectar WhatsApp",
    instagram: "Conectar Instagram",
    facebook: "Conectar Facebook",
    linkedin: "Conectar LinkedIn",
    telegram: "Conectar Telegram",
    web: "Configurar Chat Web",
    mail: "Configurar Email",
    manual: "Crear Canal Manual",
    todos: "Conectar Canal",
    "no-leidos": "Conectar Canal",
  };
  return labels[filter];
}
