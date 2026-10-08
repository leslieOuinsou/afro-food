import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'À propos',
  description: 'Découvrez l’histoire d’Afro-food, notre équipe et notre passion pour la cuisine camerounaise et béninoise.',
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: { title: 'À propos', description: 'Découvrez l’histoire d’Afro-food, notre équipe et notre passion pour la cuisine camerounaise et béninoise.', url: `${SITE_URL}/about` },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
