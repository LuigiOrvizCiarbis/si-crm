import { WhatsAppTemplate } from "@/data/types";
import { getAuthToken } from "./auth-token";

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
  if (!res.ok) throw new Error(data.message || "Failed to fetch templates");

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
  if (!res.ok) throw new Error(data.message || "Failed to sync templates");

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
  if (!res.ok) throw new Error(data.message || "Failed to send template");

  return data;
}
