import { getAuthToken } from "./auth-token";

export interface PipelineStage {
  id: number
  name: string
  color: string
  sort_order: number
  is_default: boolean
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function getPipelineStages(): Promise<PipelineStage[]> {
  const token = getAuthToken();

  if (!token) return [];

  try {
    const res = await fetch("/api/pipeline-stages", {
      headers: authHeaders(token),
    });

    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error fetching pipeline stages:", error);
    return [];
  }
}

export async function createPipelineStage(data: {
  name: string
  color: string
}): Promise<PipelineStage> {
  const token = getAuthToken();
  if (!token) throw new Error("No autenticado");

  const res = await fetch("/api/pipeline-stages", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("No se pudo crear la etapa");
  return await res.json();
}

export async function updatePipelineStage(
  id: number,
  data: { name?: string; color?: string; sort_order?: number }
): Promise<PipelineStage> {
  const token = getAuthToken();
  if (!token) throw new Error("No autenticado");

  const res = await fetch(`/api/pipeline-stages/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("No se pudo actualizar la etapa");
  return await res.json();
}

export async function deletePipelineStage(id: number): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error("No autenticado");

  const res = await fetch(`/api/pipeline-stages/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  if (!res.ok) throw new Error("No se pudo eliminar la etapa");
}

export async function reorderPipelineStages(
  stages: { id: number; sort_order: number }[]
): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error("No autenticado");

  const res = await fetch("/api/pipeline-stages/reorder", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ stages }),
  });

  if (!res.ok) throw new Error("No se pudo reordenar las etapas");
}
