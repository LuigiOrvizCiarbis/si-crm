import { Channel } from "@/data/types";
import { getAuthToken } from "./auth-token";
import { throwApiError } from "./api-error";

export async function getChannels(): Promise<Channel[]> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found");

  const response = await fetch("/api/channels", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throwApiError(response.status, error, "Error al cargar canales");
  }

  const json = await response.json();

  return json.data ?? [];
}