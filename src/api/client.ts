// src/api/client.ts
// Backend API client — token otomatik ekleme, refresh handling

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'https://api.healthviatech.website';

// ─── Token Storage ──────────────────────────────────────────────────────────
export const TokenStorage = {
  getAccess:   ()    => localStorage.getItem('hv_access'),
  getRefresh:  ()    => localStorage.getItem('hv_refresh'),
  setAccess:   (t: string) => localStorage.setItem('hv_access', t),
  setRefresh:  (t: string) => localStorage.setItem('hv_refresh', t),
  clear:       ()    => { localStorage.removeItem('hv_access'); localStorage.removeItem('hv_refresh'); },
};

// ─── Core request ───────────────────────────────────────────────────────────
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  skipAuth = false,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = TokenStorage.getAccess();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  // 401 → token yenile ve tekrar dene
  if (res.status === 401 && !skipAuth) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${TokenStorage.getAccess()}`;
      const retry = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
      if (!retry.ok) throw new ApiError(retry.status, await retry.json());
      return retry.json();
    }
    TokenStorage.clear();
    window.location.href = '/auth/login';
    throw new ApiError(401, { message: 'Session expired' });
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, body);
  }

  // 204 No Content
  if (res.status === 204) return null as T;

  return res.json();
}

async function tryRefresh(): Promise<boolean> {
  const refresh = TokenStorage.getRefresh();
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(refresh),
    });
    if (!res.ok) return false;
    const data = await res.json();
    TokenStorage.setAccess(data.data?.accessToken ?? data.accessToken);
    return true;
  } catch {
    return false;
  }
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super(`API Error ${status}`);
    this.status = status;
    this.body = body;
  }
}

// ─── Convenience methods ────────────────────────────────────────────────────
export const api = {
  get:    <T>(path: string)                    => apiRequest<T>(path, { method: 'GET' }),
  post:   <T>(path: string, body: unknown)     => apiRequest<T>(path, { method: 'POST',  body: JSON.stringify(body) }),
  patch:  <T>(path: string, body?: unknown)    => apiRequest<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  put:    <T>(path: string, body: unknown)     => apiRequest<T>(path, { method: 'PUT',   body: JSON.stringify(body) }),
  delete: <T>(path: string)                    => apiRequest<T>(path, { method: 'DELETE' }),
};
