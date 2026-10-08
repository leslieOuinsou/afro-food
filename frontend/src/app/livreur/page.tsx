'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { apiGet, apiPatch } from '@/lib/api';
import { declarerRemise, getMonSolde, type LigneCaisse, type Synthese } from '@/services/caisse';
import NotificationBell from '@/components/NotificationBell';
import PointageLivreurCard from '@/components/PointageLivreurCard';
import { trackDeliveryAction, trackDeliveryHistoryMore, trackPositionSharing } from '@/lib/analytics';
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
  dates?: { livraison?: string };
  updatedAt?: string;
  evaluation?: { note: number } | null;
};

const money = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

/** Message clair selon l'erreur du GPS (avec le code pour le diagnostic). */
function messageGps(err: GeolocationPositionError): string {
  const enApp = /FBAN|FBAV|Instagram|WhatsApp|Line\/|Snapchat|; wv\)/i.test(navigator.userAgent);
  if (err.code === err.PERMISSION_DENIED) {
    return enApp
      ? 'Localisation refusée (code 1). Tu es dans le navigateur intégré d’une application : ouvre ce lien directement dans Safari ou Chrome.'
      : 'Localisation refusée (code 1). iPhone : Réglages > Confidentialité > Service de localisation > Safari (ou Chrome) > « Lorsque l’app est active ». Puis dans Safari : aA > Réglages du site web > Position > Autoriser, et recharge la page.';
  }
  if (err.code === err.POSITION_UNAVAILABLE) {
    return 'Position introuvable (code 2). Va dehors ou près d’une fenêtre, vérifie que le Service de localisation est activé, puis réessaie.';
  }
  return 'Délai dépassé (code 3). Réessaie, en gardant l’écran allumé.';
}

export default function LivreurPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [commandes, setCommandes] = useState<CommandeLivreur[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [occupe, setOccupe] = useState<string | null>(null);
  const [historique, setHistorique] = useState<CommandeLivreur[]>([]);
  const [nbVisibles, setNbVisibles] = useState(10);
  const [partage, setPartage] = useState(false);
  const [infoGps, setInfoGps] = useState('');
  const [solde, setSolde] = useState<(Synthese & { plafond: number; commandes?: LigneCaisse[] }) | null>(null);
  const [aRemettre, setARemettre] = useState<Set<string>>(new Set());
  const [remiseEnCours, setRemiseEnCours] = useState(false);
  const [messageRemise, setMessageRemise] = useState('');
  const [encaissement, setEncaissement] = useState<CommandeLivreur | null>(null);
  const [codeSaisi, setCodeSaisi] = useState('');
  const [montantSaisi, setMontantSaisi] = useState('');
  const [raisonEcart, setRaisonEcart] = useState('');
  const [erreurEncaissement, setErreurEncaissement] = useState('');
  const dernierEnvoi = useRef(0);
  const idsEnCours = useRef<string[]>([]);
  const pretesConnues = useRef<Set<string> | null>(null);
  const titreInitial = useRef('');

  const chargerHistorique = useCallback(async () => {
    const res = await apiGet<{ commandes: CommandeLivreur[] }>('/api/commandes?statut=livree&limite=100');
    if (res.success) setHistorique(res.data?.commandes ?? []);
  }, []);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void charger();
    void chargerHistorique();
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') void charger();
    }, 8000);
    const th = window.setInterval(() => {
      if (document.visibilityState === 'visible') void chargerHistorique();
    }, 60000);
    return () => {
      window.clearInterval(t);
      window.clearInterval(th);
    };
  }, [authLoading, user, router, charger, chargerHistorique]);

  const chargerSolde = useCallback(async () => {
    const res = await getMonSolde();
    if (res.success && res.data) setSolde(res.data);
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void chargerSolde();
  }, [authLoading, user, chargerSolde]);

  const remettreEspeces = async () => {
    if (aRemettre.size === 0) return;
    setRemiseEnCours(true);
    setMessageRemise('');
    const res = await declarerRemise([...aRemettre]);
    setRemiseEnCours(false);
    if (!res.success) {
      setMessageRemise(res.message || 'Déclaration impossible.');
      return;
    }
    setARemettre(new Set());
    setMessageRemise('Remise déclarée. L’administrateur doit confirmer qu’il a bien reçu l’argent.');
    await chargerSolde();
  };

  const ouvrirEncaissement = (c: CommandeLivreur) => {
    setEncaissement(c);
    setCodeSaisi('');
    setMontantSaisi(String(c.montants.total));
    setRaisonEcart('');
    setErreurEncaissement('');
  };

  const confirmerEncaissement = async () => {
    if (!encaissement) return;
    setOccupe(encaissement._id);
    setErreurEncaissement('');
    const res = await apiPatch(`/api/commandes/${encaissement._id}/statut`, {
      statut: 'livree',
      codeRemise: codeSaisi.trim(),
      montantEncaisse: Number(montantSaisi.replace(',', '.')),
      raisonEcart: raisonEcart.trim() || undefined,
    });
    setOccupe(null);
    if (!res.success) {
      setErreurEncaissement(res.message || 'Confirmation impossible.');
      return;
    }
    trackDeliveryAction('livree');
    setEncaissement(null);
    await charger();
    await chargerHistorique();
    await chargerSolde();
  };

  const changer = async (c: CommandeLivreur, statut: 'en_livraison' | 'livree') => {
    if (statut === 'livree' && c.methodePaiement === 'especes') {
      ouvrirEncaissement(c);
      return;
    }
    setOccupe(c._id);
    const res = await apiPatch(`/api/commandes/${c._id}/statut`, { statut });
    setOccupe(null);
    if (!res.success) setErreur(res.message || 'Mise à jour impossible.');
    else {
      void chargerSolde();
      trackDeliveryAction(statut === 'livree' ? 'livree' : 'prise_en_charge');
      await charger();
      if (statut === 'livree') await chargerHistorique();
    }
  };

  const aPrendre = commandes.filter((c) => c.statut === 'prete');
  const enCours = commandes.filter((c) => c.statut === 'en_livraison');
  useEffect(() => {
    idsEnCours.current = enCours.map((c) => c._id);
  });

  const dateLivraison = (c: CommandeLivreur) => {
    const iso = c.dates?.livraison ?? c.updatedAt;
    return iso
      ? new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '';
  };
  const maintenant = new Date();
  const statsHistorique = historique.reduce(
    (acc, c) => {
      const iso = c.dates?.livraison ?? c.updatedAt;
      const d = iso ? new Date(iso) : null;
      if (d && d.toDateString() === maintenant.toDateString()) acc.aujourdhui += 1;
      if (d && d.getMonth() === maintenant.getMonth() && d.getFullYear() === maintenant.getFullYear()) acc.ceMois += 1;
      acc.montant += c.montants.total;
      return acc;
    },
    { aujourdhui: 0, ceMois: 0, montant: 0 }
  );

  // Partage de la position GPS : envoyée au plus toutes les 8 s pour chaque commande en livraison
  useEffect(() => {
    if (!partage) return;
    if (!('geolocation' in navigator)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
        setInfoGps(messageGps(err));
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
            {c.methodePaiement === 'especes' && c.statutPaiement !== 'valide' ? 'Encaisser le client' : 'Marquer comme livrée'}
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
        <PointageLivreurCard />
        {erreur && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{erreur}</p>}
        {solde && (solde.solde > 0 || solde.nbCommandes > 0) && (
          <div
            className={`mt-4 rounded-2xl border p-4 text-sm ${
              solde.plafondAtteint || solde.alerte
                ? 'border-red-300 bg-red-50 text-red-800'
                : 'border-[var(--ochre)]/30 bg-[color:rgba(233,162,59,.10)]'
            }`}
          >
            <p className="font-semibold">Espèces encaissées à remettre à l’admin : {money(solde.solde)}</p>
            <p className="mt-1 text-xs opacity-80">
              {solde.nbCommandes} commande(s) · plafond {money(solde.plafond)}
              {solde.alerte ? ' · remise en retard, remets l’argent à l’administrateur' : ''}
              {solde.plafondAtteint ? ' · plafond atteint : tu ne peux plus prendre de commande en espèces' : ''}
            </p>
            {(solde.commandes?.length ?? 0) > 0 && (
              <>
                <ul className="mt-3 space-y-2">
                  {solde.commandes!.map((c) => (
                    <li key={c._id} className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          disabled={c.enAttenteValidation}
                          checked={aRemettre.has(c._id)}
                          onChange={() =>
                            setARemettre((prev) => {
                              const n = new Set(prev);
                              if (n.has(c._id)) n.delete(c._id);
                              else n.add(c._id);
                              return n;
                            })
                          }
                        />
                        <span className="font-mono text-xs">{c.numeroCommande}</span>
                      </label>
                      <span className="text-right text-xs">
                        <strong>{money(c.encaisse)}</strong>
                        {c.enAttenteValidation && (
                          <span className="block text-[var(--wood)]/60">En attente de validation par l’admin</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={aRemettre.size === 0 || remiseEnCours}
                  onClick={() => void remettreEspeces()}
                  className="mt-3 rounded-full bg-[var(--ochre)] px-5 py-2 text-sm font-semibold text-white hover:bg-[#a6500c] disabled:opacity-50"
                >
                  {remiseEnCours ? 'Envoi…' : 'Je remets cet argent à l’admin'}
                </button>
              </>
            )}
            {messageRemise && <p className="mt-2 text-xs">{messageRemise}</p>}
          </div>
        )}
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
                    if (partage) {
                      setPartage(false);
                      trackPositionSharing(false);
                      return;
                    }
                    if (!('geolocation' in navigator)) {
                      setInfoGps("La géolocalisation n'est pas disponible sur cet appareil.");
                      return;
                    }
                    // La demande d'autorisation doit partir directement du clic (obligatoire sur iPhone/Safari)
                    setInfoGps('Autorise la localisation quand le téléphone te le demande…');
                    navigator.geolocation.getCurrentPosition(
                      () => {
                        setPartage(true);
                        trackPositionSharing(true);
                      },
                      (err) => setInfoGps(messageGps(err)),
                      { enableHighAccuracy: false, maximumAge: 60000, timeout: 20000 }
                    );
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

            <h2 className="mt-10 font-title text-2xl">Mon historique ({historique.length})</h2>
            {historique.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--wood)]/60">Tu n’as pas encore livré de commande.</p>
            ) : (
              <>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ['Livraisons', String(historique.length)],
                    ["Aujourd'hui", String(statsHistorique.aujourdhui)],
                    ['Ce mois-ci', String(statsHistorique.ceMois)],
                    ['Montant livré', money(statsHistorique.montant)],
                  ].map(([libelle, valeur]) => (
                    <div key={libelle} className="rounded-2xl border border-[var(--wood)]/10 bg-white/60 p-4">
                      <p className="text-xs uppercase tracking-wide text-[var(--wood)]/60">{libelle}</p>
                      <p className="mt-1 text-xl font-semibold">{valeur}</p>
                    </div>
                  ))}
                </div>
                <ul className="mt-4 space-y-3">
                  {historique.slice(0, nbVisibles).map((c) => (
                    <li key={c._id} className="rounded-2xl border border-[var(--wood)]/10 bg-white/60 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-mono text-sm font-semibold">{c.numeroCommande}</p>
                          <p className="text-xs text-[var(--wood)]/60">{dateLivraison(c)}</p>
                        </div>
                        <p className="text-sm font-semibold">{money(c.montants.total)}</p>
                      </div>
                      <p className="mt-2 text-sm">
                        {c.informationsClient.prenom} {c.informationsClient.nom}
                      </p>
                      {c.adresseLivraison?.adresse && (
                        <p className="text-sm text-[var(--wood)]/75">
                          {c.adresseLivraison.adresse}, {c.adresseLivraison.codePostal} {c.adresseLivraison.ville}
                        </p>
                      )}
                      {c.evaluation && (
                        <p className="mt-1 text-sm text-amber-600" aria-label={`Note du client : ${c.evaluation.note} sur 5`}>
                          {'★'.repeat(c.evaluation.note)}
                          <span className="text-[var(--wood)]/25">{'★'.repeat(5 - c.evaluation.note)}</span>
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
                {historique.length > nbVisibles && (
                  <button
                    type="button"
                    onClick={() => {
                      trackDeliveryHistoryMore();
                      setNbVisibles((n) => n + 10);
                    }}
                    className="mt-4 rounded-full border border-[var(--wood)]/20 px-5 py-2 text-sm font-semibold hover:bg-white"
                  >
                    Voir plus
                  </button>
                )}
              </>
            )}
          </>
        )}
      </main>
            {encaissement && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-3xl bg-[var(--ivory)] p-6 shadow-2xl">
            <h2 className="font-title text-2xl">Encaissement en espèces</h2>
            <p className="mt-1 text-sm text-[var(--wood)]/75">
              Commande {encaissement.numeroCommande} · à encaisser {money(encaissement.montants.total)}
            </p>
            <label className="mt-4 block text-sm font-semibold">
              Code de remise du client (4 chiffres)
              <input
                inputMode="numeric"
                maxLength={4}
                value={codeSaisi}
                onChange={(e) => setCodeSaisi(e.target.value.replace(/\D/g, ''))}
                className="mt-1 w-full rounded-2xl border border-[var(--wood)]/20 bg-white px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-[var(--ochre)]"
              />
            </label>
            <label className="mt-4 block text-sm font-semibold">
              Montant réellement encaissé (€)
              <input
                inputMode="decimal"
                value={montantSaisi}
                onChange={(e) => setMontantSaisi(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-[var(--wood)]/20 bg-white px-4 py-3 outline-none focus:border-[var(--ochre)]"
              />
            </label>
            {Number(montantSaisi.replace(',', '.')) !== encaissement.montants.total && (
              <label className="mt-4 block text-sm font-semibold">
                Raison de l’écart
                <textarea
                  rows={2}
                  value={raisonEcart}
                  onChange={(e) => setRaisonEcart(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-[var(--wood)]/20 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--ochre)]"
                />
              </label>
            )}
            {erreurEncaissement && <p className="mt-3 text-sm text-red-700">{erreurEncaissement}</p>}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setEncaissement(null)}
                className="flex-1 rounded-full border border-[var(--wood)]/20 px-4 py-2.5 text-sm font-semibold"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={codeSaisi.length !== 4 || occupe === encaissement._id}
                onClick={() => void confirmerEncaissement()}
                className="flex-1 rounded-full bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
              >
                {occupe === encaissement._id ? 'Envoi…' : 'Confirmer la livraison'}
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
