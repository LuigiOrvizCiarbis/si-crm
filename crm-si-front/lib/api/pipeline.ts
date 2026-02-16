import { getAuthToken } from "./auth-token";

export interface PipelineStage {
  id: number
  name: string
  sort_order: number
  is_default: boolean
}

export async function getPipelineStages(): Promise<PipelineStage[]> {
  const token = getAuthToken();

  if (!token) return [];

  try {
    const res = await fetch("/api/pipeline-stages", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error fetching pipeline stages:", error);
    return [];
  }
}
