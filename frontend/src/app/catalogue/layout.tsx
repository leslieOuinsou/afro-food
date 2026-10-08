import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Catalogue des plats',
  description: 'Plats camerounais et béninois, boissons et spécialités africaines livrés à domicile. Filtrez par région, catégorie ou budget.',
  alternates: { canonical: `${SITE_URL}/catalogue` },
  openGraph: { title: 'Catalogue des plats', description: 'Plats camerounais et béninois, boissons et spécialités africaines livrés à domicile. Filtrez par région, catégorie ou budget.', url: `${SITE_URL}/catalogue` },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
