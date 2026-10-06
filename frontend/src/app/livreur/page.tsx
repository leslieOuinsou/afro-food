'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { apiGet, apiPatch } from '@/lib/api';
import NotificationBell from '@/components/NotificationBell';
import { NOTIFS_UPDATED_EVENT, ajouterNotif, jouerBip, lireNotifs, sonActif } from '@/lib/notifications';

type CommandeLivreur = {
  _id: string;
  numeroCommande: string;
  statut: 'prete' | 'en_livraison' | 'livree' | string;
  informationsClient: { nom: string; prenom: string; telephone: string };
  adresseLivraison?: { adresse?: string; ville?: string; codePostal?: string; complementAdresse?: string; instructions?: string };
  articles: Array<{ quantite: number; informationsPlat?: { nom?: string } }>;
  montants: { total: number };
  methodePaiement?: string;
  statutPaiement?: string;
};

const money = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

export default function LivreurPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [commandes, setCommandes] = useState<CommandeLivreur[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [occupe, setOccupe] = useState<string | null>(null);
  const [partage, setPartage] = useState(false);
  const [infoGps, setInfoGps] = useState('');
  const dernierEnvoi = useRef(0);
  const idsEnCours = useRef<string[]>([]);
  const pretesConnues = useRef<Set<string> | null>(null);
  const titreInitial = useRef('');

  const charger = useCallback(async () => {
    const res = await apiGet<{ commandes: CommandeLivreur[] }>('/api/commandes?limite=50');
    if (res.success) {
      const liste = (res.data?.commandes ?? []).filter((c) => ['prete', 'en_livraison'].includes(c.statut));
      setCommandes(liste);
      // Nouvelle commande prête : bip + badge
      const pretes = new Set(liste.filter((c) => c.statut === 'prete').map((c) => c._id));
      if (pretesConnues.current) {
        const fraiches = liste.filter((c) => c.statut === 'prete' && !pretesConnues.current!.has(c._id));
        fraiches.forEach((c) =>
          ajouterNotif('livreur', {
            id: `prete-${c._id}`,
            titre: `Commande ${c.numeroCommande} prête à livrer`,
            detail: `${[c.adresseLivraison?.codePostal, c.adresseLivraison?.ville].filter(Boolean).join(' ')}${
              c.adresseLivraison?.ville ? ' · ' : ''
            }${money(c.montants.total)}`,
            href: '/livreur',
          })
        );
        if (fraiches.length && sonActif('livreur')) jouerBip();
      }
      pretesConnues.current = pretes;
      setErreur('');
    } else {
      setErreur(res.message || 'Impossible de charger les livraisons.');
    }
    setChargement(false);
  }, []);

  useEffect(() => {
    titreInitial.current = document.title;
    const maj = () => {
      const n = lireNotifs('livreur').filter((x) => !x.lue).length;
      document.title = n > 0 ? `(${n}) ${titreInitial.current}` : titreInitial.current;
    };
    maj();
    window.addEventListener(NOTIFS_UPDATED_EVENT, maj);
    return () => {
      window.removeEventListener(NOTIFS_UPDATED_EVENT, maj);
      if (titreInitial.current) document.title = titreInitial.current;
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !['livreur', 'admin'].includes(user.role)) {
      router.replace('/login?redirect=/livreur');
      return;
    }
    void charger();
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') void charger();
    }, 8000);
    return () => window.clearInterval(t);
  }, [authLoading, user, router, charger]);

  const changer = async (c: CommandeLivreur, statut: 'en_livraison' | 'livree') => {
    setOccupe(c._id);
    const res = await apiPatch(`/api/commandes/${c._id}/statut`, { statut });
    setOccupe(null);
    if (!res.success) setErreur(res.message || 'Mise à jour impossible.');
    else await charger();
  };

  const aPrendre = commandes.filter((c) => c.statut === 'prete');
  const enCours = commandes.filter((c) => c.statut === 'en_livraison');
  idsEnCours.current = enCours.map((c) => c._id);

  // Partage de la position GPS : envoyée au plus toutes les 8 s pour chaque commande en livraison
  useEffect(() => {
    if (!partage) return;
    if (!('geolocation' in navigator)) {
      setInfoGps("La géolocalisation n'est pas disponible sur cet appareil.");
      setPartage(false);
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - dernierEnvoi.current < 4000) return;
        dernierEnvoi.current = now;
        const { latitude: lat, longitude: lng } = pos.coords;
        idsEnCours.current.forEach((cid) => {
          void apiPatch(`/api/commandes/${cid}/position`, { lat, lng });
        });
        setInfoGps(`Position envoyée à ${new Date().toLocaleTimeString('fr-FR')}`);
      },
      (err) => {
        setInfoGps(
          err.code === err.PERMISSION_DENIED
            ? 'Autorisation refusée : active la localisation pour ce site dans ton navigateur.'
            : 'Position indisponible pour le moment.'
        );
        if (err.code === err.PERMISSION_DENIED) setPartage(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [partage]);

  const carte = (c: CommandeLivreur) => (
    <article key={c._id} className="rounded-[24px] border border-[var(--wood)]/10 bg-white/60 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-mono text-sm font-semibold">{c.numeroCommande}</h3>
        <span className="text-sm font-semibold">{money(c.montants.total)}</span>
      </div>
      <p className="mt-2 text-sm">
        {c.informationsClient.prenom} {c.informationsClient.nom} ·{' '}
        <a href={`tel:${c.informationsClient.telephone}`} className="underline">
          {c.informationsClient.telephone}
        </a>
      </p>
      {c.adresseLivraison?.adresse && (
        <p className="mt-1 text-sm text-[var(--wood)]/80">
          {c.adresseLivraison.adresse}
          {c.adresseLivraison.complementAdresse ? `, ${c.adresseLivraison.complementAdresse}` : ''},{' '}
          {c.adresseLivraison.codePostal} {c.adresseLivraison.ville}
        </p>
      )}
      {c.adresseLivraison?.instructions && (
        <p className="mt-1 text-xs italic text-[var(--wood)]/70">« {c.adresseLivraison.instructions} »</p>
      )}
      <p className="mt-2 text-xs text-[var(--wood)]/70">
        {c.articles.map((a) => `${a.quantite}× ${a.informationsPlat?.nom ?? 'Plat'}`).join(', ')}
      </p>
      {c.methodePaiement === 'especes' && c.statutPaiement !== 'valide' && (
        <p className="mt-2 text-xs font-semibold text-[var(--brick)]">À encaisser en espèces : {money(c.montants.total)}</p>
      )}
      <div className="mt-4">
        {c.statut === 'prete' ? (
          <button
            type="button"
            disabled={occupe === c._id}
            onClick={() => void changer(c, 'en_livraison')}
            className="rounded-full bg-[var(--ochre)] px-5 py-2 text-sm font-semibold text-white hover:bg-[#a6500c] disabled:opacity-50"
          >
            Prendre en charge
          </button>
        ) : (
          <button
            type="button"
            disabled={occupe === c._id}
            onClick={() => void changer(c, 'livree')}
            className="rounded-full bg-green-700 px-5 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
          >
            Marquer comme livrée
          </button>
        )}
      </div>
    </article>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[var(--ivory)] text-[var(--wood)]">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-grow px-4 py-10">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-title text-4xl">Espace livreur</h1>
          <NotificationBell role="livreur" />
        </div>
        <p className="mt-1 text-sm text-[var(--wood)]/70">Actualisation automatique toutes les 8 secondes. La cloche t’avertit quand une commande est prête.</p>
        {erreur && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{erreur}</p>}
        {chargement ? (
          <p className="mt-8">Chargement…</p>
        ) : (
          <>
            {enCours.length > 0 && (
              <div className="mt-6 rounded-2xl border border-[var(--wood)]/10 bg-white/60 p-4">
                <button
                  type="button"
                  onClick={() => {
                    setInfoGps('');
                    dernierEnvoi.current = 0;
                    setPartage((v) => !v);
                  }}
                  className={`rounded-full px-5 py-2 text-sm font-semibold text-white ${
                    partage ? 'bg-[var(--brick)]' : 'bg-[var(--ochre)] hover:bg-[#a6500c]'
                  }`}
                >
                  {partage ? 'Arrêter le partage de position' : 'Partager ma position avec les clients'}
                </button>
                <p className="mt-2 text-xs text-[var(--wood)]/70">
                  {infoGps || (partage ? 'Recherche de ta position…' : 'Garde cette page ouverte pendant la livraison.')}
                </p>
              </div>
            )}
            <h2 className="mt-8 font-title text-2xl">En cours ({enCours.length})</h2>
            <div className="mt-3 space-y-4">
              {enCours.length ? enCours.map(carte) : <p className="text-sm text-[var(--wood)]/60">Aucune livraison en cours.</p>}
            </div>
            <h2 className="mt-8 font-title text-2xl">À prendre ({aPrendre.length})</h2>
            <div className="mt-3 space-y-4">
              {aPrendre.length ? aPrendre.map(carte) : <p className="text-sm text-[var(--wood)]/60">Aucune commande prête.</p>}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
