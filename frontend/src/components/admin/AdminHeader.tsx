'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import NotificationBell from '@/components/NotificationBell';

const pageTitles: Record<string, string> = {
  '/admin-dashboard': 'Tableau de bord',
  '/commande-admin': 'Commandes',
  '/admin-plats': 'Gestion des Plats',
  '/admin-promos': 'Codes promo',
  '/admin-avis': 'Avis clients',
  '/admin-messagerie': 'Messagerie',
  '/admin-parametres': 'Paramètres'
};

interface AdminHeaderProps {
  onToggleSidebar: () => void;
}

export default function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const title = pageTitles[pathname ?? ''] ?? 'Administration';

  return (
    <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shadow-sm sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="md:hidden p-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
          onClick={onToggleSidebar}
          aria-label="Ouvrir le menu latéral"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-lg sm:text-xl font-semibold text-gray-800">{title}</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <NotificationBell role="admin" />

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-gray-800">Administrateur</p>
            <p className="text-xs text-gray-500">{user?.email ?? ''}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md">
            <span className="text-white font-semibold text-sm">A</span>
          </div>
        </div>
      </div>
    </header>
  );
}
