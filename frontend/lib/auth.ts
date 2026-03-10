import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { apiFetch } from './api';

export type Role = 'member' | 'manager' | 'admin';

export interface User {
  id: number;
  email: string;
  full_name?: string | null;
  role: Role;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: Role | Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'standup_jwt';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
    if (!storedToken) {
      setLoading(false);
      return;
    }

    setToken(storedToken);

    apiFetch<User>('/auth/me', { method: 'GET' }, storedToken)
      .then((me) => {
        setUser(me);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiFetch<{ access_token: string; token_type: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: email, password }),
    });

    const jwt = res.access_token;
    setToken(jwt);
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_STORAGE_KEY, jwt);
    }

    const me = await apiFetch<User>('/auth/me', { method: 'GET' }, jwt);
    setUser(me);

    if (me.role === 'manager' || me.role === 'admin') {
      router.push('/manager/dashboard');
    } else {
      router.push('/standup/today');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    router.push('/login');
  };

  const hasRole = (roles: Role | Role[]) => {
    if (!user) return false;
    const list = Array.isArray(roles) ? roles : [roles];
    return list.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
