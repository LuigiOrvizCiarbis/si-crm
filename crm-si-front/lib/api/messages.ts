import { Message } from "@/data/types";
import { getAuthToken } from "./auth-token";
import { throwApiError } from "./api-error";

function resolveMediaType(file: File): "image" | "audio" {
  if (file.type.startsWith("audio/")) {
    return "audio";
  }

  return "image";
}

export async function sendMessage(conversationId: number, content: string, media?: File) {
  const token = getAuthToken();
  if (!token) throw new Error("Token faltante");

  if (media) {
    const type = resolveMediaType(media);
    const formData = new FormData();
    formData.append("conversation_id", String(conversationId));
    formData.append("type", type);
    formData.append(type, media);
    if (content && type === "image") formData.append("content", content);

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throwApiError(
        res.status,
        data,
        type === "audio" ? "No se pudo enviar el audio" : "No se pudo enviar la imagen"
      );
    }
    return data.data;
  }

  const res = await fetch("/api/messages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      conversation_id: conversationId,
      content,
      type: "text",
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwApiError(res.status, data, "No se pudo enviar el mensaje");
  return data.data;
}

export async function getMessages(): Promise<Message[]> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found");

  const response = await fetch("/api/messages", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throwApiError(response.status, error, "Error al cargar mensajes");
  }

  const json = await response.json();

  return json.data ?? [];
}

export async function editMessage(messageId: number, content: string): Promise<Message> {
  const token = getAuthToken();
  if (!token) throw new Error("Token faltante");

  const res = await fetch(`/api/messages/${messageId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ content }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwApiError(res.status, data, "No se pudo editar el mensaje");
  return data.data;
}

export async function deleteMessage(messageId: number): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error("Token faltante");

  const res = await fetch(`/api/messages/${messageId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throwApiError(res.status, data, "No se pudo eliminar el mensaje");
  }
}
