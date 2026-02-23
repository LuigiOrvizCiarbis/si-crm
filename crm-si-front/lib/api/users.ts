import { getAuthToken } from "./auth-token";

export interface SystemUser {
  id: number;
  name: string;
  email?: string;
  role?: string;
}

export async function getUsers(): Promise<SystemUser[]> {
  const token = getAuthToken();
  if (!token) return [];

  try {
    const res = await fetch('/api/users', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.warn('[getUsers] error', res.status, errJson);
      return [];
    }
    const payload = await res.json();
    const users = Array.isArray(payload) ? payload : payload.data || [];

    const mapped = users.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role || 'Vendedor'
    }));
    return mapped;
  } catch (e) {
    console.error('Error fetching users', e);
    return [];
  }
}
