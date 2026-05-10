'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';
import {
  fetchProfil,
  isAuthenticated,
  logout as logoutService,
  clearClientSession,
  type User,
} from '@/services/auth';

export function isVendorRole(role: string | undefined): boolean {
  if (!role) return false;
  const r = role.toLowerCase();
  return (
    r === 'vendeur' ||
    r === 'vendeuse' ||
    r === 'admin' ||
    r === 'seller' ||
    r === 'superadmin'
  );
}

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isVendor: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (typeof window === 'undefined' || !isAuthenticated()) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchProfil();
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
        if (res.status === 401 || res.status === 403) {
          clearClientSession();
        }
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [pathname, refresh]);

  const logout = useCallback(async () => {
    await logoutService();
    setUser(null);
  }, []);

  const isVendor = isVendorRole(user?.role);

  const value = useMemo(
    () => ({ user, loading, isVendor, refresh, logout }),
    [user, loading, isVendor, refresh, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return ctx;
}
