'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { trackPurchase } from '@/lib/analytics';
import { annulerCommande, getCommande, type CommandeDetail } from '@/services/commandes';

const ETAPES = [
  { statut: 'en_attente', label: 'Commande reçue' },
  { statut: 'confirmee', label: 'Confirmée' },
  { statut: 'en_preparation', label: 'En préparation' },
  { statut: 'prete', label: 'Prête' },
  { statut: 'en_livraison', label: 'En livraison' },
  { statut: 'livree', label: 'Livrée' },
] as const;

const STATUTS_FINAUX = ['livree', 'annulee', 'remboursee'];
const POLL_MS = 15000;
// Pendant la livraison : suivi plus fréquent pour voir le livreur avancer
const POLL_LIVRAISON_MS = 5000;

const money = (n?: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0);

const dateHeure = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '';

const urlCarte = (lat: number, lng: number) => {
  const d = 0.008;
  const bbox = [lng - d, lat - d, lng + d, lat + d].map((n) => n.toFixed(5)).join('%2C');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(5)}%2C${lng.toFixed(5)}`;
};

const heureCourte = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

function SuiviContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [commande, setCommande] = useState<CommandeDetail | null>(null);
  const [erreur, setErreur] = useState('');
  const [annulation, setAnnulation] = useState(false);

  const charger = useCallback(async () => {
    const res = await getCommande(id);
    if (res.success && res.data?.commande) {
      setCommande(res.data.commande);
      setErreur('');
    } else {
      setErreur(res.message || 'Commande introuvable.');
    }
  }, [id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(`/commande/${id}`)}`);
      return;
    }
    void charger();
  }, [authLoading, user, id, router, charger]);

  // Rafraîchissement automatique tant que la commande évolue
  useEffect(() => {
    if (!commande || STATUTS_FINAUX.includes(commande.statut)) return;
    const delai = commande.statut === 'en_livraison' ? POLL_LIVRAISON_MS : POLL_MS;
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') void charger();
    }, delai);
    // Rafraîchit aussitôt quand l'utilisateur revient sur l'onglet
    const auRetour = () => {
      if (document.visibilityState === 'visible') void charger();
    };
    document.addEventListener('visibilitychange', auRetour);
    return () => {
      window.clearInterval(t);
      document.removeEventListener('visibilitychange', auRetour);
    };
  }, [commande, charger]);

  // GA4 « purchase » : une seule fois par commande, uniquement après paiement en ligne confirmé
  const paiementOk = searchParams.get('paiement') === 'ok';
  useEffect(() => {
    if (!commande || !paiementOk || commande.statutPaiement !== 'valide') return;
    const cle = `afro_ga_purchase_${commande._id}`;
    try {
      if (sessionStorage.getItem(cle)) return;
      sessionStorage.setItem(cle, '1');
    } catch {
      /* stockage indisponible : on envoie quand même */
    }
    trackPurchase({
      transactionId: commande.numeroCommande || commande._id,
      value: commande.montants?.total ?? 0,
      shipping: commande.montants?.fraisLivraison ?? 0,
      coupon: commande.codePromo || undefined,
      items: commande.articles.map((a) => ({
        item_id: a.platId ?? a.informationsPlat?.nom ?? 'plat',
        item_name: a.informationsPlat?.nom ?? 'Plat',
        price: a.prixUnitaire ?? 0,
        quantity: a.quantite,
      })),
    });
  }, [commande, paiementOk]);

  const annuler = async () => {
    if (!commande || !window.confirm('Annuler cette commande ?')) return;
    setAnnulation(true);
    const res = await annulerCommande(commande._id);
    setAnnulation(false);
    if (!res.success) setErreur(res.message || "Impossible d'annuler la commande.");
    else await charger();
  };

  const indexActuel = commande ? ETAPES.findIndex((e) => e.statut === commande.statut) : -1;
  const annulee = commande?.statut === 'annulee' || commande?.statut === 'remboursee';
  const historique = [...(commande?.historiqueStatut ?? [])].sort(
    (a, b) => new Date(b.dateChangement).getTime() - new Date(a.dateChangement).getTime()
  );
  const paiementParam = searchParams.get('paiement');

  return (
    <main className="mx-auto w-full max-w-3xl flex-grow px-4 py-10">
      <Link href="/dashboard?tab=commandes" className="text-sm text-[var(--wood)]/70 hover:underline">
        ← Mes commandes
      </Link>

      {paiementParam === 'ok' && (
        <p className="mt-4 rounded-2xl bg-green-100 p-3 text-sm text-green-900">
          Paiement reçu, merci ! La confirmation de votre commande peut prendre quelques secondes.
        </p>
      )}
      {paiementParam === 'annule' && (
        <p className="mt-4 rounded-2xl bg-amber-100 p-3 text-sm text-amber-900">
          Paiement annulé. Votre commande est enregistrée mais pas encore réglée.
        </p>
      )}
      {erreur && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{erreur}</p>}

      {!commande && !erreur && <p className="mt-8 text-[var(--wood)]/70">Chargement…</p>}

      {commande && (
        <>
          <h1 className="mt-4 font-title text-4xl">Commande {commande.numeroCommande}</h1>
          <p className="mt-1 text-sm text-[var(--wood)]/70">
            Passée le {dateHeure(commande.createdAt)} · {commande.statutAffichage ?? commande.statut}
          </p>

          <section className="mt-8 rounded-[24px] border border-[var(--wood)]/10 bg-white/55 p-6">
            {annulee ? (
              <p className="font-semibold text-[var(--brick)]">
                Commande {commande.statut === 'remboursee' ? 'remboursée' : 'annulée'}.
              </p>
            ) : (
              <ol className="space-y-4">
                {ETAPES.map((etape, i) => {
                  const fait = i <= indexActuel;
                  const courant = i === indexActuel;
                  return (
                    <li key={etape.statut} className="flex items-center gap-3">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          fait ? 'bg-[var(--ochre)] text-white' : 'border border-[var(--wood)]/20 text-[var(--wood)]/40'
                        }`}
                      >
                        {fait ? '✓' : i + 1}
                      </span>
                      <span className={courant ? 'font-semibold' : fait ? '' : 'text-[var(--wood)]/50'}>
                        {etape.label}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
            {commande.peutEtreAnnulee && (
              <button
                type="button"
                onClick={() => void annuler()}
                disabled={annulation}
                className="mt-6 rounded-full border border-[var(--brick)]/40 px-5 py-2 text-sm font-semibold text-[var(--brick)] hover:bg-[var(--brick)]/10 disabled:opacity-50"
              >
                {annulation ? 'Annulation…' : 'Annuler la commande'}
              </button>
            )}
          </section>

          {commande.statut === 'en_livraison' && (
            <section className="mt-6 rounded-[24px] border border-[var(--wood)]/10 bg-white/55 p-6">
              <h2 className="font-title text-2xl">Votre livreur est en route</h2>
              {commande.livraison?.positionLivreur ? (
                <>
                  <iframe
                    title="Position du livreur"
                    className="mt-4 h-72 w-full rounded-2xl border border-[var(--wood)]/10"
                    loading="lazy"
                    src={urlCarte(commande.livraison.positionLivreur.lat, commande.livraison.positionLivreur.lng)}
                  />
                  <p className="mt-2 text-xs text-[var(--wood)]/60">
                    Position mise à jour à {heureCourte(commande.livraison.positionLivreur.date)} · la carte se
                    rafraîchit automatiquement.
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-[var(--wood)]/70">
                  Le livreur n&apos;a pas encore partagé sa position. Elle s&apos;affichera ici dès qu&apos;elle sera disponible.
                </p>
              )}
            </section>
          )}

          <section className="mt-6 rounded-[24px] border border-[var(--wood)]/10 bg-white/55 p-6">
            <h2 className="font-title text-2xl">Détail</h2>
            <ul className="mt-4 divide-y divide-[var(--wood)]/10 text-sm">
              {commande.articles.map((a, i) => (
                <li key={i} className="flex justify-between py-2">
                  <span>{a.quantite} × {a.informationsPlat?.nom ?? 'Plat'}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between"><dt>Sous-total</dt><dd>{money(commande.montants.sousTotal)}</dd></div>
              <div className="flex justify-between"><dt>Livraison</dt><dd>{money(commande.montants.fraisLivraison)}</dd></div>
              {!!commande.montants.remise && (
                <div className="flex justify-between text-[var(--brick)]">
                  <dt>Remise {commande.codePromo ? `(${commande.codePromo})` : ''}</dt>
                  <dd>− {money(commande.montants.remise)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-[var(--wood)]/10 pt-2 text-base font-semibold">
                <dt>Total</dt><dd>{money(commande.montants.total)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-[var(--wood)]/60">
              Paiement : {commande.methodePaiement ?? '—'} ·{' '}
              {commande.statutPaiement === 'valide' ? 'réglé' : commande.statutPaiement === 'echec' ? 'échec' : 'en attente'}
            </p>
            {commande.adresseLivraison?.adresse && (
              <p className="mt-1 text-xs text-[var(--wood)]/60">
                Livraison : {commande.adresseLivraison.adresse}, {commande.adresseLivraison.codePostal} {commande.adresseLivraison.ville}
              </p>
            )}
          </section>

          {historique.length > 0 && (
            <section className="mt-6 rounded-[24px] border border-[var(--wood)]/10 bg-white/55 p-6">
              <h2 className="font-title text-2xl">Historique</h2>
              <ul className="mt-4 space-y-2 text-sm">
                {historique.map((h, i) => (
                  <li key={h._id ?? i} className="flex flex-wrap justify-between gap-2">
                    <span>
                      {ETAPES.find((e) => e.statut === h.statut)?.label ?? h.statut}
                      {h.commentaire ? <span className="text-[var(--wood)]/60"> — {h.commentaire}</span> : null}
                    </span>
                    <span className="text-[var(--wood)]/60">{dateHeure(h.dateChangement)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  );
}

export default function SuiviCommandePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--ivory)] text-[var(--wood)]">
      <Header />
      <Suspense fallback={<main className="flex-grow p-10">Chargement…</main>}>
        <SuiviContent />
      </Suspense>
      <Footer />
    </div>
  );
}
