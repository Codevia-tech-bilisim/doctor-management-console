// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TokenStorage } from '@/api/client';
import { login as apiLogin, logout as apiLogout } from '@/api/endpoints/auth';
import type { AuthResponse, UserRole } from '@/api/types';

interface AuthUser {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// JWT payload parse (basit, verify yok — server verify ediyor)
function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sayfa yenilendiğinde token'dan kullanıcı geri yükle
  useEffect(() => {
    const token = TokenStorage.getAccess();
    if (token) {
      const payload = parseJwt(token);
      if (payload && typeof payload.exp === 'number' && payload.exp * 1000 > Date.now()) {
        setUser({
          userId:    String(payload.sub ?? payload.userId ?? ''),
          email:     String(payload.email ?? ''),
          firstName: String(payload.firstName ?? ''),
          lastName:  String(payload.lastName ?? ''),
          role:      String(payload.role ?? 'ADMIN') as UserRole,
        });
      } else {
        TokenStorage.clear();
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data: AuthResponse = await apiLogin({ username: email, password });
      setUser({
        userId:    data.userId,
        email:     data.email,
        firstName: data.firstName,
        lastName:  data.lastName,
        role:      data.role,
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message ?? 'Giriş başarısız' };
    }
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
