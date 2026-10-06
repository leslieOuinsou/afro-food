'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';

/**
 * Ne monte la page admin (et donc ses appels API) que pour un compte admin confirmé.
 * Les autres comptes sont redirigés par RoleGuard, sans générer d'erreurs 403.
 */
export default function AdminGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (user?.role !== 'admin' || (loading && !user)) {
    return <div className="min-h-screen bg-gray-50" aria-busy="true" />;
  }
  return <>{children}</>;
}
