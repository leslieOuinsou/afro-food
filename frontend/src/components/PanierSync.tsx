'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { apiPut } from '@/lib/api';

/**
 * Envoie le panier du client connecté au serveur (après une courte pause) :
 * il sert uniquement à relancer par e-mail un panier laissé en attente.
 */
export default function PanierSync() {
  const { user } = useAuth();
  const { items } = useCart();
  const derniere = useRef<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'client') {
      derniere.current = null;
      return;
    }
    const contenu = JSON.stringify(items.map((i) => [i.id, i.quantite]));
    if (contenu === derniere.current) return;
    const t = window.setTimeout(() => {
      derniere.current = contenu;
      void apiPut('/api/panier', {
        items: items.map((i) => ({ id: i.id, nom: i.nom, prixUnitaire: i.prixUnitaire, quantite: i.quantite, image: i.image })),
      });
    }, 3000);
    return () => window.clearTimeout(t);
  }, [user, items]);

  return null;
}
