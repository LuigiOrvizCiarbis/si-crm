import type { Conversation } from "@/data/types";
import { getAuthToken } from "./auth-token";

export async function getConversations(): Promise<Conversation[]> {
  const token = getAuthToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch("/api/conversations", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || `HTTP ${response.status}: Failed to fetch conversations`
    );
  }

  const json = await response.json();

  const mapped: Conversation[] = (json.data || []).map((c: any) => ({
    id: c.id,
    channelId: c.channel_id,
    contact: c.contact,
    last_message: c.last_message_preview || "",
    timestamp: c.last_message_at || c.updated_at || c.created_at || "",
    unread: Boolean(c.unread_count && c.unread_count > 0),
    leadScore: c.lead_score ?? undefined,
    pipeline_stage_id: c.pipeline_stage_id,
    priority: c.priority,
    assigneeId: c.assigned_to,
    archived: c.archived,
    channel: c.channel,
    last_message_at: c.last_message_at,
    created_at: c.created_at,
    unread_count: c.unread_count,
    messages: c.messages
  }));

  return mapped;
}

export async function getChannelConversations(channelId: number, perPage = 50) {
  const token = getAuthToken();
  if (!token) throw new Error("Token faltante");

  const params = new URLSearchParams();
  params.set("channel_id", String(channelId));
  params.set("per_page", String(perPage));

  const res = await fetch(`/api/conversations?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload?.message || "Error conversaciones");

  const mapped: Conversation[] = (payload.data || []).map((c: any) => ({
    id: c.id,
    channelId: c.channel_id,
    contact: c.contact,
    last_message: c.last_message_preview || "",
    timestamp: c.last_message_at || c.updated_at || c.created_at || "",
    unread: Boolean(c.unread_count && c.unread_count > 0),
    leadScore: c.lead_score ?? undefined,
    pipeline_stage_id: c.pipeline_stage_id,
    priority: c.priority,
    assigneeId: c.assigned_to,
    archived: c.archived,
    channel: c.channel,
    last_message_at: c.last_message_at,
    created_at: c.created_at,
    unread_count: c.unread_count,
    messages: c.messages
  }));

  return mapped;
}

/**
 * Obtener conversaciones de un usuario específico (asignadas o de sus canales)
 * Usado por admin para ver las conversaciones de un vendedor
 */
export async function getUserConversations(userId: number, perPage = 50) {
  const token = getAuthToken();
  if (!token) throw new Error("Token faltante");

  const params = new URLSearchParams();
  params.set("user_id", String(userId));
  params.set("per_page", String(perPage));

  const res = await fetch(`/api/conversations?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload?.message || "Error conversaciones");

  const mapped: Conversation[] = (payload.data || []).map((c: any) => ({
    id: c.id,
    channelId: c.channel_id,
    contact: c.contact,
    last_message: c.last_message_preview || "",
    timestamp: c.last_message_at || c.updated_at || c.created_at || "",
    unread: Boolean(c.unread_count && c.unread_count > 0),
    leadScore: c.lead_score ?? undefined,
    pipeline_stage_id: c.pipeline_stage_id,
    priority: c.priority,
    assigneeId: c.assigned_to,
    archived: c.archived,
    channel: c.channel,
    last_message_at: c.last_message_at,
    created_at: c.created_at,
    unread_count: c.unread_count,
    messages: c.messages
  }));

  return mapped;
}

export async function getConversationWithMessages(conversationId: number) {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found");

  const res = await fetch(`/api/conversations/${conversationId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(payload?.message || "Error al cargar conversación");

  const data = payload.data;

  return {
    id: data.id,
    channelId: data.channel_id,
    contact: data.contact,
    last_message: data.last_message_preview || "",
    timestamp: data.last_message_at || data.updated_at || data.created_at || "",
    unread: Boolean(data.unread_count && data.unread_count > 0),
    leadScore: data.lead_score ?? undefined,
    pipeline_stage_id: data.pipeline_stage_id,
    priority: data.priority,
    assigneeId: data.assigned_to,
    archived: data.archived,
    channel: data.channel,
    last_message_at: data.last_message_at,
    created_at: data.created_at,
    unread_count: data.unread_count,
    messages: data.messages
  };
}

export async function getConversationMessages(conversationId: number, page: number = 1) {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found");

  const res = await fetch(`/api/conversations/${conversationId}/messages?page=${page}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(payload?.message || "Error al cargar historial de mensajes");

  return payload;
}

export async function updateConversationStage(conversationId: number, stage: number | string) {
  const token = getAuthToken();
  if (!token) throw new Error("No token found");

  const body = typeof stage === 'number'
    ? { pipeline_stage_id: stage }
    : { pipeline_stage_id: Number(stage) };

  const res = await fetch(`/api/conversations/${conversationId}/stage`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || "Failed to update stage");
  }

  return await res.json();
}

export async function assignConversationUser(conversationId: number, userId: number) {
  const token = getAuthToken();
  if (!token) throw new Error("No token found");

  const res = await fetch(`/api/conversations/${conversationId}/users/add`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ user_id: userId }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.message || "Failed to assign user");
  }

  return await res.json();
}
