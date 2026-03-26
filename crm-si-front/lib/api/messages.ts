import { Message } from "react-hook-form";
import { getAuthToken } from "./auth-token";
import { throwApiError } from "./api-error";

export async function sendMessage(conversationId: number, content: string) {
  const token = getAuthToken();
  if (!token) throw new Error("Token faltante");

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
