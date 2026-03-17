// src/api/endpoints/auth.ts
import { api, apiRequest, TokenStorage } from '../client';
import type { ApiResponse, AuthResponse, LoginRequest } from '../types';

export async function login(req: LoginRequest): Promise<AuthResponse> {
  const res = await apiRequest<ApiResponse<AuthResponse>>(
    '/api/auth/login',
    { method: 'POST', body: JSON.stringify(req) },
    true, // skipAuth
  );
  if (!res.success || !res.data) throw new Error(res.message ?? 'Login failed');

  // Sadece ADMIN veya DOCTOR giriş yapabilir bu panelde
  const role = res.data.role;
  if (role !== 'ADMIN' && role !== 'DOCTOR') {
    throw new Error('Bu panel sadece Admin ve Doktor hesapları içindir.');
  }

  TokenStorage.setAccess(res.data.accessToken);
  TokenStorage.setRefresh(res.data.refreshToken);
  return res.data;
}

export async function logout(): Promise<void> {
  try { await api.post('/api/auth/logout', {}); } catch { /* ignore */ }
  TokenStorage.clear();
}
