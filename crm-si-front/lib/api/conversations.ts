import type { Conversation } from "@/data/types";
import { getAuthToken } from "./auth-token";

function mapConversation(c: any): Conversation {
  return {
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
    messages: c.messages,
  };
}

function requireToken(): string {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found");
  return token;
}

export async function getConversations(): Promise<Conversation[]> {
  const token = requireToken();

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
  return (json.data || []).map(mapConversation);
}

export async function getChannelConversations(channelId: number, perPage = 50) {
  const token = requireToken();

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

  return (payload.data || []).map(mapConversation);
}

export async function getUserConversations(userId: number, perPage = 50) {
  const token = requireToken();

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

  return (payload.data || []).map(mapConversation);
}

export async function getConversationWithMessages(conversationId: number): Promise<Conversation> {
  const token = requireToken();

  const res = await fetch(`/api/conversations/${conversationId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(payload?.message || "Error al cargar conversación");

  return mapConversation(payload.data);
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
