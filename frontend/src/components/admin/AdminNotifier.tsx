'use client';

import { useEffect, useRef } from 'react';
import { getCommandes } from '@/services/adminCommandes';
import { getAvis } from '@/services/adminAvis';
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
  const avisConnus = useRef<Set<string> | null>(null);
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

        // Nouveaux avis clients
        const res = await getAvis({ limite: 10 });
        if (res.success && res.data) {
          const cles = res.data.avis.map((a) => `${a.commandeId}-${a.note}`);
          if (avisConnus.current) {
            const fraisAvis = res.data.avis.filter((a) => !avisConnus.current!.has(`${a.commandeId}-${a.note}`));
            fraisAvis.forEach((a) =>
              ajouterNotif('admin', {
                id: `avis-${a.commandeId}`,
                titre: `Nouvel avis ${'★'.repeat(a.note)}${'☆'.repeat(5 - a.note)}`,
                detail: `${a.client.nom || 'Client'}${a.commentaire ? ` · ${a.commentaire}` : ''}`,
                href: '/admin-avis',
              })
            );
            if (fraisAvis.length && sonActif('admin')) jouerBip();
          }
          avisConnus.current = new Set(cles);
        }
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
