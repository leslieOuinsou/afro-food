'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getCommandes } from '@/services/adminCommandes';

/**
 * Bandeau réservé aux comptes vendeur : nombre de commandes en attente de traitement.
 */
export function VendorStatusBar() {
  const { user, isVendor: vendeur } = useAuth();
  // Compte admin uniquement : un livreur n'a pas accès à la liste complète des commandes
  const isVendor = vendeur && user?.role === 'admin';
  const [pending, setPending] = useState<number | null>(null);

  useEffect(() => {
    if (!isVendor) return;
    let cancelled = false;
    (async () => {
      try {
        const { commandes, pagination } = await getCommandes({
          statut: 'en_attente',
          limite: 1, // on lit seulement le total dans la pagination (le backend limite à 100)
        });
        if (cancelled) return;
        const n =
          typeof pagination?.totalCommandes === 'number'
            ? pagination.totalCommandes
            : commandes.length;
        setPending(n);
      } catch {
        if (!cancelled) setPending(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isVendor]);

  if (!isVendor) return null;

  const count = pending ?? 0;

  return (
    <div className="border-b border-af-wood/10 bg-af-saffron/95 px-4 py-2 text-center shadow-sm backdrop-blur-sm">
      <p className="font-ui text-[13px] font-semibold text-af-wood">
        <span className="tabular-nums">{count}</span> commande{count > 1 ? 's' : ''} en attente
        {' · '}
        <Link
          href="/commande-admin"
          className="underline decoration-af-wood/40 underline-offset-2 transition hover:text-af-wood/90"
        >
          Gérer les commandes
        </Link>
      </p>
    </div>
  );
}
