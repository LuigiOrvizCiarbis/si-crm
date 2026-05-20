import { Channel, FilterType } from "@/data/types";
import { ChannelType } from "@/data/enums";

/**
 * Extrae el identificador del canal según su tipo.
 * Cada tipo de canal tiene su propio campo identificador.
 */
export function formatPhoneNumber(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return raw;

  if (digits.startsWith("54") && digits.length >= 12) {
    const cc = digits.slice(0, 2);
    const mobile = digits.charAt(2) === "9" ? "9 " : "";
    const rest = digits.slice(mobile ? 3 : 2);
    const area = rest.slice(0, 3);
    const part1 = rest.slice(3, 6);
    const part2 = rest.slice(6);
    return `+${cc} ${mobile}${area} ${part1}-${part2}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  if (digits.length >= 10) {
    const cc = digits.length > 10 ? digits.slice(0, digits.length - 10) : "";
    const local = digits.slice(-10);
    return `${cc ? `+${cc} ` : ""}${local.slice(0, 3)} ${local.slice(3, 6)}-${local.slice(6)}`;
  }

  return `+${digits}`;
}

export function getChannelIdentifier(channel: Channel): string | undefined {
  switch (channel.type) {
    case ChannelType.WHATSAPP:
      return formatPhoneNumber(channel.whatsapp_config?.display_phone_number) || channel.whatsapp_config?.phone_number_id;

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
