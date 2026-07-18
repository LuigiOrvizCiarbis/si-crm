import { getAuthToken } from "./auth-token"
import { throwApiError } from "./api-error"

export interface MediaAsset {
  id: number
  name: string
  mime_type: string
  size: number
  url: string
  created_at: string
}

export async function uploadMediaAsset(file: File): Promise<MediaAsset> {
  const token = getAuthToken()
  if (!token) throw new Error("No authentication token found")

  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch("/api/media-assets", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throwApiError(res.status, data, "Error al subir el archivo")

  return data.data
}
