'use client';

import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import CookieConsent from '@/components/CookieConsent';
import ClientNotifier from '@/components/ClientNotifier';
import RoleGuard from '@/components/RoleGuard';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import FavorisSync from '@/components/FavorisSync';
import InstallApp from '@/components/InstallApp';
import { Suspense } from 'react';
import { ToastProvider } from '@/context/ToastContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <RoleGuard />
          <ClientNotifier />
          <FavorisSync />
          {children}
          <CookieConsent />
          <InstallApp />
          <Suspense fallback={null}>
            <GoogleAnalytics />
          </Suspense>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
