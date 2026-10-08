import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Aide',
  description: 'Centre d’aide Afro-food : commande, paiement, livraison et compte.',
  alternates: { canonical: `${SITE_URL}/help` },
  openGraph: { title: 'Aide', description: 'Centre d’aide Afro-food : commande, paiement, livraison et compte.', url: `${SITE_URL}/help` },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
