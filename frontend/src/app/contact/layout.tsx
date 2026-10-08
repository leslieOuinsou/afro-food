import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Une question, une suggestion ? Contactez l’équipe Afro-food.',
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: { title: 'Contact', description: 'Une question, une suggestion ? Contactez l’équipe Afro-food.', url: `${SITE_URL}/contact` },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
