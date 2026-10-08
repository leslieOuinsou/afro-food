import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Carrières',
  description: 'Rejoignez l’équipe Afro-food : livreurs, cuisiniers et plus encore.',
  alternates: { canonical: `${SITE_URL}/careers` },
  openGraph: { title: 'Carrières', description: 'Rejoignez l’équipe Afro-food : livreurs, cuisiniers et plus encore.', url: `${SITE_URL}/careers` },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
