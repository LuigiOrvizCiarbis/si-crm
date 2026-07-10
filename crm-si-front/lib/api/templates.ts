import { WhatsAppTemplate } from "@/data/types";
import { getAuthToken } from "./auth-token";
import { throwApiError } from "./api-error";

export async function getTemplates(channelId: number): Promise<WhatsAppTemplate[]> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found");

  const res = await fetch(`/api/channels/${channelId}/templates`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwApiError(res.status, data, "Error al cargar plantillas");

  return Array.isArray(data) ? data : data.data ?? [];
}

export async function syncTemplates(channelId: number): Promise<{ message: string; count: number }> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found");

  const res = await fetch(`/api/channels/${channelId}/templates/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwApiError(res.status, data, "Error al sincronizar plantillas");

  return data;
}

/**
 * Sube un archivo a Meta (vía backend) para usarlo como header de plantilla.
 * Devuelve el media id de Meta (válido ~30 días).
 */
export async function uploadTemplateMedia(
  channelId: number,
  file: File,
): Promise<{ media_id: string }> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found");

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`/api/channels/${channelId}/media`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwApiError(res.status, data, "Error al subir el archivo");

  return data;
}

export async function sendTemplate(
  conversationId: number,
  templateId: number,
  components: any[] = []
) {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found");

  const res = await fetch(`/api/conversations/${conversationId}/send-template`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      template_id: templateId,
      components,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwApiError(res.status, data, "Error al enviar plantilla");

  return data;
}
