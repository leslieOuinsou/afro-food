/** Adresse publique du site (sitemap, liens canoniques, données structurées). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://afrofood.vercel.app').replace(/\/$/, '');
export const API_PUBLIC = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');

type PlatSeo = {
  _id: string;
  nom: string;
  description?: string;
  prix: number;
  prixPromo?: number;
  images?: { principale?: string };
  categorie?: string;
  disponible?: boolean;
  enRupture?: boolean;
  notemoyenne?: number;
  nombreAvis?: number;
  origineAfricaine?: { pays?: string };
};

/** Lecture d'un plat côté serveur (mise en cache 5 min). */
export async function lirePlatServeur(id: string): Promise<PlatSeo | null> {
  try {
    const res = await fetch(`${API_PUBLIC}/api/plats/${encodeURIComponent(id)}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const j = (await res.json()) as { data?: { plat?: PlatSeo } & PlatSeo };
    return j.data?.plat ?? (j.data as PlatSeo | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function listerPlatsServeur(): Promise<PlatSeo[]> {
  try {
    const res = await fetch(`${API_PUBLIC}/api/plats?limite=100`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const j = (await res.json()) as { data?: { plats?: PlatSeo[] } };
    return j.data?.plats ?? [];
  } catch {
    return [];
  }
}

/** Données structurées schema.org « Product » d'un plat. */
export function jsonLdPlat(p: PlatSeo) {
  const prix = p.prixPromo && p.prixPromo > 0 && p.prixPromo < p.prix ? p.prixPromo : p.prix;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.nom,
    description: p.description,
    image: p.images?.principale ? [p.images.principale] : undefined,
    category: p.categorie,
    brand: { '@type': 'Brand', name: 'Afro-food' },
    url: `${SITE_URL}/produit/${p._id}`,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price: prix.toFixed(2),
      availability: p.disponible === false || p.enRupture ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      url: `${SITE_URL}/produit/${p._id}`,
    },
    ...(p.notemoyenne && p.nombreAvis
      ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: p.notemoyenne, reviewCount: p.nombreAvis } }
      : {}),
  };
}

/** Fiche « Restaurant » de l'entreprise (page d'accueil). */
export const jsonLdRestaurant = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  name: 'Afro-food',
  description: 'Cuisine camerounaise et béninoise livrée à domicile.',
  url: SITE_URL,
  image: `${SITE_URL}/icon-512.png`,
  servesCuisine: ['Camerounaise', 'Béninoise', 'Africaine'],
  priceRange: '€€',
  hasMenu: `${SITE_URL}/catalogue`,
  potentialAction: { '@type': 'OrderAction', target: `${SITE_URL}/catalogue` },
};
