import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Politique de remboursement',
  description: 'Conditions de remboursement et d’annulation des commandes Afro-food.',
  alternates: { canonical: `${SITE_URL}/refund` },
  openGraph: { title: 'Politique de remboursement', description: 'Conditions de remboursement et d’annulation des commandes Afro-food.', url: `${SITE_URL}/refund` },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
