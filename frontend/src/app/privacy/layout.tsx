import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Comment Afro-food protège et utilise vos données personnelles.',
  alternates: { canonical: `${SITE_URL}/privacy` },
  openGraph: { title: 'Politique de confidentialité', description: 'Comment Afro-food protège et utilise vos données personnelles.', url: `${SITE_URL}/privacy` },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
