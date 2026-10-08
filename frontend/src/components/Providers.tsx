'use client';

import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import CookieConsent from '@/components/CookieConsent';
import ClientNotifier from '@/components/ClientNotifier';
import RoleGuard from '@/components/RoleGuard';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import FavorisSync from '@/components/FavorisSync';
import PanierSync from '@/components/PanierSync';
import InstallApp from '@/components/InstallApp';
import { Suspense } from 'react';
import { ToastProvider } from '@/context/ToastContext';
import { I18nProvider } from '@/context/I18nContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <RoleGuard />
          <ClientNotifier />
          <FavorisSync />
          <PanierSync />
          {children}
          <CookieConsent />
          <InstallApp />
          <Suspense fallback={null}>
            <GoogleAnalytics />
          </Suspense>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
    </I18nProvider>
  );
}
