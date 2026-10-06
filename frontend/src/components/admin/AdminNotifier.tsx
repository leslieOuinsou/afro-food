'use client';

import { useEffect, useRef } from 'react';
import { getCommandes } from '@/services/adminCommandes';
import {
  NOTIFS_UPDATED_EVENT,
  ajouterNotif,
  jouerBip,
  lireNotifs,
  sonActif,
} from '@/lib/notifications';

const money = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

/**
 * Surveille les nouvelles commandes sur toutes les pages admin et alimente la cloche
 * (NotificationBell) : notification, bip, compteur dans le titre de l'onglet.
 */
export default function AdminNotifier() {
  const idsConnus = useRef<Set<string> | null>(null);
  const titreInitial = useRef('');

  useEffect(() => {
    titreInitial.current = document.title;
    const majTitre = () => {
      const n = lireNotifs('admin').filter((x) => !x.lue).length;
      document.title = n > 0 ? `(${n}) ${titreInitial.current}` : titreInitial.current;
    };
    majTitre();

    const tick = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const { commandes } = await getCommandes({ limite: 20 });
        if (!commandes) return;
        if (idsConnus.current) {
          const fraiches = commandes.filter((c) => !idsConnus.current!.has(c.id));
          fraiches.forEach((c) =>
            ajouterNotif('admin', {
              id: `cmd-${c.id}`,
              titre: `Nouvelle commande ${c.numeroCommande}`,
              detail: `${c.client?.nom ? `${c.client.nom} · ` : ''}${money(c.montantTotal)}`,
              href: '/commande-admin',
            })
          );
          if (fraiches.length) {
            if (sonActif('admin')) jouerBip();
            window.dispatchEvent(new Event('afro:nouvelle-commande'));
          }
        }
        idsConnus.current = new Set(commandes.map((c) => c.id));
      } catch {
        /* on réessaie au prochain passage */
      }
    };
    void tick();
    const t = window.setInterval(() => void tick(), 8000);
    const auRetour = () => void tick();
    document.addEventListener('visibilitychange', auRetour);
    window.addEventListener(NOTIFS_UPDATED_EVENT, majTitre);
    return () => {
      window.clearInterval(t);
      document.removeEventListener('visibilitychange', auRetour);
      window.removeEventListener(NOTIFS_UPDATED_EVENT, majTitre);
      if (titreInitial.current) document.title = titreInitial.current;
    };
  }, []);

  return null;
}
