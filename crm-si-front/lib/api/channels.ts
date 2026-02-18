import { Channel } from "@/data/types";
import { getAuthToken } from "./auth-token";

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
    throw new Error(error.message || "Failed to fetch channels");
  }

  const json = await response.json();

  return json.data ?? [];
}