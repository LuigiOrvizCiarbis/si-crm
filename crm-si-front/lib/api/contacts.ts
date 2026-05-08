import { getAuthToken } from "./auth-token";
import { throwApiError } from "./api-error";

export interface ContactsSummary {
  total_contacts: number
  new_this_month: number
  active_leads: number
  qualified: number
  won: number
  conversion_rate: number
}

export interface ContactUpdate {
  name?: string
  phone?: string | null
  email?: string | null
  source?: string
}

export interface Contact {
  id: number
  name: string
  email: string | null
  phone: string | null
  source: string
  created_at: string
  updated_at: string
}

export async function getContactsSummary(): Promise<ContactsSummary> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found");

  const response = await fetch("/api/contacts/summary", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throwApiError(response.status, payload, "Error al cargar resumen de contactos");
  }

  return payload as ContactsSummary;
}

export async function updateContact(contactId: number, updates: ContactUpdate): Promise<Contact> {
  const token = getAuthToken();
  if (!token) throw new Error("No authentication token found");

  const response = await fetch(`/api/contacts/${contactId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throwApiError(response.status, payload, "Error al actualizar contacto");
  }

  return (payload.data ?? payload) as Contact;
}
