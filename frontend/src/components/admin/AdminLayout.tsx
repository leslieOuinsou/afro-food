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
    setIsSidebarOpen(false);
  }, [pathname]);

  // Rien n'est affiché (ni appelé côté API) tant que le rôle admin n'est pas confirmé ;
  // RoleGuard redirige les autres comptes.
  if (user?.role !== 'admin' || (loading && !user)) {
    return <div className="min-h-screen bg-gray-50" aria-busy="true" />;
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
