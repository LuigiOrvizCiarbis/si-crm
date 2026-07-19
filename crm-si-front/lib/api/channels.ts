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

export async function updateChannelName(id: number, name: string): Promise<Channel> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found");

  const response = await fetch(`/api/channels/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throwApiError(response.status, error, "Error al actualizar el canal");
  }

  const json = await response.json();

  return json.data;
}

export type BusinessVerificationStatus =
  | "verified"
  | "pending"
  | "not_verified"
  | "failed"
  | "business_id_missing"
  | "permission_missing"
  | "token_invalid"
  | "unknown";

export interface BusinessVerification {
  business_id: string | null;
  business_name: string | null;
  status: BusinessVerificationStatus;
  raw_verification_status: string | null;
  verify_url: string | null;
}

export async function getBusinessVerification(
  channelId: number
): Promise<BusinessVerification> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found");

  const response = await fetch(`/api/channels/${channelId}/business-verification`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throwApiError(response.status, error, "Error al obtener la verificación de negocio");
  }

  const json = await response.json();

  return json.data;
}