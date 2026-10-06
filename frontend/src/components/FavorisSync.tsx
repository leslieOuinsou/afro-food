'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FAVORITES_STORAGE_KEY, FAVORITES_UPDATED_EVENT, dispatchFavoritesUpdated } from '@/lib/favoritesStorage';
import { basculerFavoriServeur, getFavorisServeur, type FavoriServeur } from '@/services/favoris';

function lireLocal(): FavoriServeur[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]') as unknown;
    return Array.isArray(parsed) ? (parsed as FavoriServeur[]) : [];
  } catch {
    return [];
  }
}

// Les produits de démonstration (ids « 1 », « 2 »…) n'existent pas en base : on ne les envoie pas au serveur
const idServeurValide = (id: string) =>
  /^c[a-z0-9]{24,}$/i.test(id) ||
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

/**
 * Synchronise les favoris (localStorage) avec le compte connecté.
 * - à la connexion : fusion locale + serveur
 * - ensuite : chaque ajout/retrait local est répercuté sur le serveur
 */
export default function FavorisSync() {
  const { user } = useAuth();
  const serveurIds = useRef<Set<string> | null>(null);
  const file = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!user) {
      serveurIds.current = null;
      return;
    }
    let annule = false;

    const synchroniser = async () => {
      const ids = serveurIds.current;
      if (!ids) return;
      const locaux = new Map(lireLocal().map((f) => [f.id, f]));
      for (const id of locaux.keys()) {
        if (idServeurValide(id) && !ids.has(id) && (await basculerFavoriServeur(id)) === true) ids.add(id);
      }
      for (const id of [...ids]) {
        if (!locaux.has(id) && (await basculerFavoriServeur(id)) === false) ids.delete(id);
      }
    };

    const planifier = () => {
      file.current = file.current.then(synchroniser).catch(() => undefined);
    };

    (async () => {
      const serveur = await getFavorisServeur();
      if (annule || !serveur) return;
      serveurIds.current = new Set(serveur.map((f) => f.id));
      // fusion : union du local et du serveur
      const fusion = new Map(serveur.map((f) => [f.id, f]));
      for (const f of lireLocal()) fusion.set(f.id, fusion.get(f.id) ?? f);
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...fusion.values()]));
        dispatchFavoritesUpdated();
      } catch {
        /* ignore */
      }
      planifier(); // pousse les favoris locaux inconnus du serveur
    })();

    window.addEventListener(FAVORITES_UPDATED_EVENT, planifier);
    return () => {
      annule = true;
      window.removeEventListener(FAVORITES_UPDATED_EVENT, planifier);
    };
  }, [user]);

  return null;
}
