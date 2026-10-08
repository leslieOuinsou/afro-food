import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Cookies',
  description: 'Les cookies utilisés par Afro-food et comment gérer vos choix.',
  alternates: { canonical: `${SITE_URL}/cookies` },
  openGraph: { title: 'Cookies', description: 'Les cookies utilisés par Afro-food et comment gérer vos choix.', url: `${SITE_URL}/cookies` },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
