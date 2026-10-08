import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Conditions générales de vente',
  description: 'Conditions générales de vente et d’utilisation d’Afro-food.',
  alternates: { canonical: `${SITE_URL}/terms` },
  openGraph: { title: 'Conditions générales de vente', description: 'Conditions générales de vente et d’utilisation d’Afro-food.', url: `${SITE_URL}/terms` },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
