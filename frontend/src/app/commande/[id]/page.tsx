'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import SuiviLivreurMap from '@/components/SuiviLivreurMap';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { trackPurchase, trackReviewEmailClick, trackReviewSubmitted } from '@/lib/analytics';
import { annulerCommande, evaluerCommande, getCommande, type CommandeDetail } from '@/services/commandes';

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
const POLL_LIVRAISON_MS = 4000;

const money = (n?: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0);

const dateHeure = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '';

const heureCourte = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

function Etoiles({
  valeur,
  onChoisir,
  lecture = false,
}: {
  valeur: number;
  onChoisir?: (n: number) => void;
  lecture?: boolean;
}) {
  return (
    <div className="flex gap-1" role={lecture ? 'img' : 'radiogroup'} aria-label={`Note : ${valeur} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={lecture}
          onClick={() => onChoisir?.(n)}
          role={lecture ? undefined : 'radio'}
          aria-checked={lecture ? undefined : valeur === n}
          aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
          className={`text-4xl leading-none transition ${lecture ? 'cursor-default' : 'hover:scale-110'} ${
            n <= valeur ? 'text-[#E9A23B]' : 'text-[var(--wood)]/20'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function SuiviContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [commande, setCommande] = useState<CommandeDetail | null>(null);
  const [erreur, setErreur] = useState('');
  const [annulation, setAnnulation] = useState(false);
  const noteUrl = Number(searchParams.get('noter')) || 0;
  const [note, setNote] = useState(noteUrl >= 1 && noteUrl <= 5 ? noteUrl : 0);
  const [avis, setAvis] = useState('');
  const [envoiAvis, setEnvoiAvis] = useState(false);
  const [erreurAvis, setErreurAvis] = useState('');

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
      const qs = searchParams.toString();
      router.replace(`/login?redirect=${encodeURIComponent(`/commande/${id}${qs ? `?${qs}` : ''}`)}`);
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

  // GA4 : arrivée depuis l'e-mail de remerciement (une seule fois par visite)
  const venuDeLEmail = searchParams.get('noter') !== null;
  useEffect(() => {
    if (!venuDeLEmail) return;
    const cle = `afro_ga_review_click_${id}`;
    try {
      if (sessionStorage.getItem(cle)) return;
      sessionStorage.setItem(cle, '1');
    } catch {
      /* ignore */
    }
    trackReviewEmailClick(noteUrl >= 1 && noteUrl <= 5 ? noteUrl : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venuDeLEmail]);

  const envoyerAvis = async () => {
    if (!commande || note < 1) return;
    setEnvoiAvis(true);
    setErreurAvis('');
    const res = await evaluerCommande(commande._id, note, avis);
    setEnvoiAvis(false);
    if (res.success) {
      trackReviewSubmitted(note, avis.trim().length > 0);
      await charger();
    } else {
      setErreurAvis(res.message || "Impossible d'enregistrer votre avis.");
    }
  };

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
                  <div className="mt-4">
                    <SuiviLivreurMap
                      position={commande.livraison.positionLivreur}
                      adresse={[
                        commande.adresseLivraison?.adresse,
                        commande.adresseLivraison?.codePostal,
                        commande.adresseLivraison?.ville,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    />
                  </div>
                  <p className="mt-2 text-xs text-[var(--wood)]/60">
                    Position mise à jour à {heureCourte(commande.livraison.positionLivreur.date)} · le scooter
                    se déplace en direct sur la carte.
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-[var(--wood)]/70">
                  Le livreur n&apos;a pas encore partagé sa position. Elle s&apos;affichera ici dès qu&apos;elle sera disponible.
                </p>
              )}
            </section>
          )}

          {commande.statut === 'livree' && (
            <section
              id="avis"
              className="mt-6 rounded-[24px] border border-[var(--ochre)]/30 bg-[color:rgba(233,162,59,.10)] p-6"
            >
              {commande.evaluation ? (
                <>
                  <h2 className="font-title text-2xl">Merci pour votre avis !</h2>
                  <div className="mt-3">
                    <Etoiles valeur={commande.evaluation.note} lecture />
                  </div>
                  {commande.evaluation.commentaire ? (
                    <p className="mt-3 text-sm italic text-[var(--wood)]/80">« {commande.evaluation.commentaire} »</p>
                  ) : null}
                </>
              ) : (
                <>
                  <h2 className="font-title text-2xl">Comment était votre commande ?</h2>
                  <p className="mt-1 text-sm text-[var(--wood)]/70">Merci de nous noter, cela nous aide beaucoup.</p>
                  <div className="mt-4">
                    <Etoiles valeur={note} onChoisir={setNote} />
                  </div>
                  <textarea
                    value={avis}
                    onChange={(e) => setAvis(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Un commentaire ? (facultatif)"
                    className="mt-4 w-full rounded-2xl border border-[var(--wood)]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--ochre)]"
                  />
                  {erreurAvis && <p className="mt-2 text-sm text-red-700">{erreurAvis}</p>}
                  <button
                    type="button"
                    onClick={() => void envoyerAvis()}
                    disabled={note < 1 || envoiAvis}
                    className="mt-4 rounded-full bg-[var(--ochre)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#a6500c] disabled:opacity-50"
                  >
                    {envoiAvis ? 'Envoi…' : 'Envoyer mon avis'}
                  </button>
                </>
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
