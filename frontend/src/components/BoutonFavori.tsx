'use client';

import { useCallback, useEffect, useState, type MouseEvent } from 'react';
import { FAVORITES_STORAGE_KEY, FAVORITES_UPDATED_EVENT, dispatchFavoritesUpdated } from '@/lib/favoritesStorage';
import { trackAddToWishlist } from '@/lib/analytics';

type FavItem = { id: string; nom: string; image: string };

function lire(): FavItem[] {
  try {
    const p = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]') as unknown;
    return Array.isArray(p) ? (p as FavItem[]) : [];
  } catch {
    return [];
  }
}

/**
 * Cœur « favori » : ajoute ou retire un plat de la liste des favoris (navigateur, puis compte si connecté).
 * variante « icone » : petit cœur rond sur une photo ; « texte » : bouton avec libellé (fiche du plat).
 */
export default function BoutonFavori({
  id,
  nom,
  image,
  variante = 'icone',
}: {
  id: string;
  nom: string;
  image: string;
  variante?: 'icone' | 'texte';
}) {
  const [favori, setFavori] = useState(false);

  useEffect(() => {
    const maj = () => setFavori(lire().some((f) => f.id === id));
    maj();
    window.addEventListener(FAVORITES_UPDATED_EVENT, maj);
    window.addEventListener('storage', maj);
    return () => {
      window.removeEventListener(FAVORITES_UPDATED_EVENT, maj);
      window.removeEventListener('storage', maj);
    };
  }, [id]);

  const basculer = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const liste = lire();
      const present = liste.some((f) => f.id === id);
      const suite = present ? liste.filter((f) => f.id !== id) : [...liste, { id, nom, image }];
      if (!present) trackAddToWishlist({ item_id: id, item_name: nom, price: 0, quantity: 1 });
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(suite));
        setFavori(!present);
        dispatchFavoritesUpdated();
      } catch {
        /* stockage indisponible */
      }
    },
    [id, nom, image]
  );

  const coeur = (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill={favori ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
  const libelle = favori ? 'Retirer des favoris' : 'Ajouter aux favoris';

  if (variante === 'texte') {
    return (
      <button
        type="button"
        onClick={basculer}
        aria-pressed={favori}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
          favori
            ? 'border-[var(--brick)]/40 bg-[var(--brick)]/10 text-[var(--brick)]'
            : 'border-[var(--wood)]/20 bg-white text-[var(--wood)] hover:bg-[var(--ivory)]'
        }`}
      >
        {coeur}
        {libelle}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={basculer}
      aria-pressed={favori}
      aria-label={libelle}
      title={libelle}
      className={`flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur transition ${
        favori ? 'border-[var(--brick)]/40 bg-[var(--brick)]/90 text-[var(--ivory)]' : 'border-white/30 bg-white/85 text-[var(--wood)] hover:bg-white'
      }`}
    >
      {coeur}
    </button>
  );
}
