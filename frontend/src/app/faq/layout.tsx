import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Questions fréquentes',
  description: 'Livraison, paiement, allergènes, retours : toutes les réponses à vos questions sur Afro-food.',
  alternates: { canonical: `${SITE_URL}/faq` },
  openGraph: { title: 'Questions fréquentes', description: 'Livraison, paiement, allergènes, retours : toutes les réponses à vos questions sur Afro-food.', url: `${SITE_URL}/faq` },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
