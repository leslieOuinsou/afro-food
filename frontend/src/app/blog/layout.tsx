import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Recettes, traditions culinaires et actualités d’Afro-food.',
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: { title: 'Blog', description: 'Recettes, traditions culinaires et actualités d’Afro-food.', url: `${SITE_URL}/blog` },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
