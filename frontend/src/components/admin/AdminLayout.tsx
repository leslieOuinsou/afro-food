'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AdminNotifier from './AdminNotifier';
import { useAuth } from '@/context/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSidebarOpen(false);
  }, [pathname]);

  if (loading && !user) {
    return <div className="min-h-screen bg-gray-50" aria-busy="true" />;
  }

  // Compte non-admin : message clair (sinon écran vide = « commandes invisibles »)
  if (user?.role !== 'admin') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center text-gray-800">
        <p className="text-lg font-semibold">Espace admin réservé</p>
        <p className="max-w-md text-sm text-gray-600">
          Vous êtes connecté{user ? ` en tant que ${user.email} (${user.role})` : ' sans compte admin'}.
          Déconnectez-vous puis reconnectez-vous avec le compte admin pour voir les commandes.
        </p>
        <a href="/login?redirect=/commande-admin" className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white">
          Connexion admin
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminNotifier />
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="min-w-0 flex-1 flex flex-col md:ml-64">
        <AdminHeader onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
        <main className="min-w-0 flex-1 overflow-x-auto p-4 sm:p-6 lg:p-8 text-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}
