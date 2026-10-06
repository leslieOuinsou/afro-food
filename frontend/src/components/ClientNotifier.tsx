'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMesCommandes } from '@/services/commandes';
import { ajouterNotif, jouerBip, sonActif, viderNotifs } from '@/lib/notifications';

const MESSAGES: Record<string, string> = {
  confirmee: 'Votre commande est confirmée.',
  en_preparation: 'Nos cuisiniers préparent votre commande.',
  prete: 'Votre commande est prête.',
  en_livraison: 'Votre commande est en route !',
  livree: 'Votre commande a été livrée. Bon appétit !',
  annulee: 'Votre commande a été annulée.',
  remboursee: 'Votre commande a été remboursée.',
};

const CLE_STATUTS = 'afro_client_statuts';
const CLE_UTILISATEUR = 'afro_client_notif_user';

/**
 * Pour un compte client : suit les changements de statut de ses commandes et alimente la cloche.
 * Le premier chargement sert de référence (aucune notification pour l'existant).
 */
export default function ClientNotifier() {
  const { user } = useAuth();
  const statuts = useRef<Record<string, string> | null>(null);
  const userId = user?.role === 'client' ? (user.id ?? null) : null;

  useEffect(() => {
    if (!userId) return;

    // Autre compte que la dernière fois : on repart de zéro
    try {
      if (localStorage.getItem(CLE_UTILISATEUR) !== userId) {
        viderNotifs('client');
        localStorage.removeItem(CLE_STATUTS);
        localStorage.setItem(CLE_UTILISATEUR, userId);
      }
      const sauve = localStorage.getItem(CLE_STATUTS);
      statuts.current = sauve ? (JSON.parse(sauve) as Record<string, string>) : null;
    } catch {
      statuts.current = null;
    }

    const tick = async () => {
      if (document.visibilityState !== 'visible') return;
      const res = await getMesCommandes({ limite: 20 });
      if (!res.success || !res.data?.commandes) return;
      const actuels: Record<string, string> = {};
      let nouveau = false;
      for (const c of res.data.commandes) {
        actuels[c._id] = c.statut;
        const avant = statuts.current?.[c._id];
        // Commande connue dont le statut a changé (ou nouvelle commande apparue après le chargement initial)
        if (statuts.current && avant !== c.statut && MESSAGES[c.statut]) {
          ajouterNotif('client', {
            id: `${c._id}-${c.statut}`,
            titre: `Commande ${c.numeroCommande}`,
            detail: MESSAGES[c.statut],
            href: `/commande/${c._id}`,
          });
          nouveau = true;
        }
      }
      statuts.current = actuels;
      try {
        localStorage.setItem(CLE_STATUTS, JSON.stringify(actuels));
      } catch {
        /* ignore */
      }
      if (nouveau && sonActif('client')) jouerBip();
    };

    void tick();
    const t = window.setInterval(() => void tick(), 15000);
    const auRetour = () => void tick();
    document.addEventListener('visibilitychange', auRetour);
    return () => {
      window.clearInterval(t);
      document.removeEventListener('visibilitychange', auRetour);
    };
  }, [userId]);

  return null;
}
