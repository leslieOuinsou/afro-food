import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SITE_URL, jsonLdPlat, lirePlatServeur } from '@/lib/seo';

type Props = { children: ReactNode; params: Promise<{ id: string }> };

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const plat = await lirePlatServeur(id);
  if (!plat) return { title: 'Plat introuvable', robots: { index: false } };
  const prix = plat.prixPromo && plat.prixPromo > 0 && plat.prixPromo < plat.prix ? plat.prixPromo : plat.prix;
  const description = (plat.description || `Commandez ${plat.nom} chez Afro-food, cuisine camerounaise et béninoise livrée à domicile.`).slice(0, 160);
  return {
    title: `${plat.nom} — ${prix.toFixed(2).replace('.', ',')} €`,
    description,
    alternates: { canonical: `${SITE_URL}/produit/${id}` },
    openGraph: {
      title: plat.nom,
      description,
      url: `${SITE_URL}/produit/${id}`,
      type: 'website',
      images: plat.images?.principale ? [{ url: plat.images.principale }] : undefined,
    },
    twitter: { card: 'summary_large_image', title: plat.nom, description },
  };
}

export default async function ProduitLayout({ children, params }: Props) {
  const { id } = await params;
  const plat = await lirePlatServeur(id);
  return (
    <>
      {plat && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdPlat(plat)).replace(/</g, '\\u003c') }} />}
      {children}
    </>
  );
}
