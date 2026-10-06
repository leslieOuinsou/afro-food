'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PlatCard from './PlatCard';
import { fetchPlatsPopulaires, type Plat, prixUnitaireAffiche } from '@/services/plats';

type CardPlat = {
  id: string;
  nom: string;
  description: string;
  prix: string;
  image: string;
};

function mapPlat(p: Plat): CardPlat {
  const id = p._id || (p as { id?: string }).id || '';
  const prix = prixUnitaireAffiche(p);
  return {
    id,
    nom: p.nom,
    description: p.description,
    prix: `${prix.toFixed(2)} €`,
    image: p.images?.principale || '/images/plats/placeholder.jpg',
  };
}

export default function PopularDishes() {
  const [plats, setPlats] = useState<CardPlat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchPlatsPopulaires(6);
        if (cancelled) return;
        const list =
          (res.data as { plats?: Plat[] } | undefined)?.plats ||
          (Array.isArray(res.data) ? (res.data as Plat[]) : []);
        if (res.success && list.length > 0) {
          setPlats(list.map(mapPlat));
        }
      } catch {
        /* silencieux : section vide si API down */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loading && plats.length === 0) return null;

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">
          Nos Plats Populaires
        </h2>
        {loading ? (
          <p className="text-center text-gray-500">Chargement…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plats.map((plat) => (
              <Link key={plat.id} href={`/produit/${plat.id}`} className="block">
                <PlatCard
                  nom={plat.nom}
                  description={plat.description}
                  prix={plat.prix}
                  image={plat.image}
                  hidePriceAndCart
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
