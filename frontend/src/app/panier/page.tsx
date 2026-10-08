'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { isAuthenticated } from '@/services/auth';
import { trackBeginCheckout, trackPromo, trackPurchase } from '@/lib/analytics';
import { createCommande, creerSessionPaiement, getConfigPaiement, validerCodePromo } from '@/services/commandes';

const FRAIS_LIVRAISON_ESTIME = 3.9;
type PaymentMode = 'carte' | 'virement' | 'mobile' | 'especes';
type DeliveryType = 'domicile' | 'point_relais' | 'retrait_sur_place';

type CheckoutStep = 'panier' | 'livraison' | 'paiement' | 'confirmation';

function formatMoney(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

function paymentLabel(mode: PaymentMode) {
  switch (mode) {
    case 'carte':
      return 'Carte bancaire';
    case 'virement':
      return 'Virement';
    case 'mobile':
      return 'Paiement mobile';
    case 'especes':
      return 'Espèces à la livraison';
    default:
      return mode;
  }
}

function commandeStatusLabel(statut: string) {
  switch (statut) {
    case 'en_attente':
      return 'En attente';
    case 'confirmee':
      return 'Confirmée';
    case 'en_preparation':
      return 'En préparation';
    case 'prete':
      return 'Prête';
    case 'en_livraison':
      return 'En livraison';
    case 'livree':
      return 'Livrée';
    case 'annulee':
      return 'Annulée';
    case 'remboursee':
      return 'Remboursée';
    default:
      return statut;
  }
}

const STEPS: { id: CheckoutStep; label: string }[] = [
  { id: 'panier', label: 'Panier' },
  { id: 'livraison', label: 'Livraison' },
  { id: 'paiement', label: 'Paiement' },
  { id: 'confirmation', label: 'Confirmation' },
];

function Stepper({ current }: { current: CheckoutStep }) {
  const idx = STEPS.findIndex((s) => s.id === current);
  return (
    <nav aria-label="Étapes de commande" className="mb-10">
      <ol className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
        {STEPS.map((s, i) => {
          const active = i === idx;
          const done = i < idx;
          return (
            <li key={s.id} className="flex items-center gap-2 sm:gap-4">
              {i > 0 && (
                <span
                  className={`hidden h-px w-6 sm:block sm:w-10 ${done || active ? 'bg-[var(--ochre)]/50' : 'bg-[var(--wood)]/15'}`}
                  aria-hidden
                />
              )}
              <span
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold sm:text-sm ${
                  active
                    ? 'border-[var(--ochre)]/45 bg-[color:rgba(194,97,15,.12)] text-[var(--wood)]'
                    : done
                      ? 'border-[var(--wood)]/10 bg-white/50 text-[var(--wood)]/80'
                      : 'border-[var(--wood)]/10 bg-white/35 text-[var(--wood)]/50'
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
                    active ? 'bg-[var(--ochre)] text-white' : done ? 'bg-[var(--wood)] text-[var(--ivory)]' : 'bg-[var(--wood)]/15'
                  }`}
                >
                  {i + 1}
                </span>
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

type OrderSnapshot = {
  id: string;
  orderNumber: string;
  statut: string;
  total: number;
  sousTotal: number;
  frais: number;
  remise: number;
};

export default function PanierPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart } = useCart();

  const [step, setStep] = useState<CheckoutStep>('panier');
  const [promoInput, setPromoInput] = useState('');
  const [promoApplied, setPromoApplied] = useState<string | null>(null);

  const [address, setAddress] = useState({
    prenom: '',
    nom: '',
    ligne1: '',
    ligne2: '',
    codePostal: '',
    ville: '',
    pays: 'France',
    telephone: '',
  });

  const [paymentMode, setPaymentMode] = useState<PaymentMode>('carte');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('domicile');
  const [deliverySlot, setDeliverySlot] = useState('Dès que possible');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  const [orderSnapshot, setOrderSnapshot] = useState<OrderSnapshot | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const sousTotal = useMemo(
    () => items.reduce((t, i) => t + i.prixUnitaire * i.quantite, 0),
    [items]
  );

  const [remise, setRemise] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [promoConditions, setPromoConditions] = useState<string[]>([]);

  const sousTotalApresRemise = Math.max(0, sousTotal - remise);
  const total = sousTotalApresRemise + FRAIS_LIVRAISON_ESTIME;

  const articlesPayload = useMemo(
    () => items.map((item) => ({ platId: item.id, quantite: item.quantite })),
    [items]
  );

  const applyPromo = useCallback(async () => {
    const code = promoInput.trim();
    if (!code) return;
    setPromoError('');
    const res = await validerCodePromo(code, articlesPayload, deliveryType);
    if (res.success && res.data) {
      trackPromo(res.data.code, true);
      setPromoApplied(res.data.code);
      setRemise(res.data.remise);
      setPromoConditions(res.data.conditions ?? []);
    } else {
      trackPromo(code, false);
      setPromoApplied(null);
      setRemise(0);
      setPromoConditions([]);
      setPromoError(res.message || 'Code promo invalide');
    }
  }, [promoInput, articlesPayload, deliveryType]);

  // Revalide le code quand le panier ou le mode de livraison change
  useEffect(() => {
    if (!promoApplied) return;
    let annule = false;
    validerCodePromo(promoApplied, articlesPayload, deliveryType).then((res) => {
      if (annule) return;
      if (res.success && res.data) {
        setRemise(res.data.remise);
      } else {
        setPromoApplied(null);
        setRemise(0);
        setPromoConditions([]);
        setPromoError(res.message || 'Code promo retiré');
      }
    });
    return () => {
      annule = true;
    };
  }, [promoApplied, articlesPayload, deliveryType]);

  const goLivraison = () => {
    if (items.length === 0) return;
    trackBeginCheckout(
      items.map((i) => ({ item_id: i.id, item_name: i.nom, price: i.prixUnitaire, quantity: i.quantite })),
      sousTotal
    );
    setStep('livraison');
  };

  const goPaiement = () => {
    const ok =
      address.prenom.trim() &&
      address.nom.trim() &&
      address.ligne1.trim() &&
      address.codePostal.trim() &&
      address.ville.trim() &&
      address.telephone.trim();
    if (!ok) return;
    setStep('paiement');
  };

  const finalizeOrder = async () => {
    if (items.length === 0) return;
    setSubmitError('');

    if (!isAuthenticated()) {
      router.push('/login?redirect=/panier');
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = {
        articles: items.map((item) => ({
          platId: item.id,
          quantite: item.quantite,
        })),
        adresseLivraison: {
          nom: `${address.prenom} ${address.nom}`.trim(),
          adresse: address.ligne1,
          ville: address.ville,
          codePostal: address.codePostal,
          pays: address.pays,
          complementAdresse: address.ligne2 || undefined,
          instructions: deliveryInstructions || undefined,
        },
        methodePaiement: paymentMode,
        codePromo: promoApplied || undefined,
        typeLivraison: deliveryType,
        instructions: `${deliverySlot}${deliveryInstructions ? ` — ${deliveryInstructions}` : ''}`,
        preferences: {
          instructions: deliveryInstructions || undefined,
        },
      } as const;

      const res = await createCommande(payload);
      if (!res.success || !res.data?.commande) {
        const hint =
          res.status === 400 && !/code/i.test(res.message || '')
            ? ' Vérifiez les quantités (stock) ou retirez un article indisponible.'
            : '';
        setSubmitError((res.message || 'Impossible de finaliser la commande.') + hint);
        return;
      }

      const cmd = res.data.commande;
      setOrderSnapshot({
        id: cmd._id,
        orderNumber: cmd.numeroCommande,
        statut: cmd.statut,
        total: cmd.montants?.total ?? total,
        sousTotal,
        frais: cmd.montants?.fraisLivraison ?? FRAIS_LIVRAISON_ESTIME,
        remise,
      });
      clearCart();

      // Paiement par carte : redirection vers Stripe Checkout si le paiement en ligne est actif
      const paiementEnLigne = paymentMode === 'carte' && (await getConfigPaiement());
      if (!paiementEnLigne) {
        // « purchase » du paiement en ligne est envoyé au retour de Stripe (page /commande/[id])
        trackPurchase({
          transactionId: cmd.numeroCommande || cmd._id,
          value: cmd.montants?.total ?? total,
          shipping: cmd.montants?.fraisLivraison ?? FRAIS_LIVRAISON_ESTIME,
          coupon: promoApplied || undefined,
          items: items.map((i) => ({ item_id: i.id, item_name: i.nom, price: i.prixUnitaire, quantity: i.quantite })),
        });
      }
      if (paiementEnLigne) {
        const session = await creerSessionPaiement(cmd._id);
        if (session.success && session.data?.url) {
          window.location.href = session.data.url;
          return;
        }
      }
      setStep('confirmation');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erreur réseau lors de la commande.');
    } finally {
      setSubmitLoading(false);
    }
  };

  useEffect(() => {
    if (step === 'confirmation') return;
    if (items.length === 0 && (step === 'livraison' || step === 'paiement')) {
      setStep('panier');
    }
  }, [items.length, step]);

  useEffect(() => {
    if (step !== 'confirmation' || !orderSnapshot) return;
    const t = window.setTimeout(() => {
      router.push(`/commande/${orderSnapshot.id}`);
    }, 4500);
    return () => window.clearTimeout(t);
  }, [step, orderSnapshot, router]);

  const summaryBlock = (showCta: boolean, ctaLabel: string, onCta: () => void, ctaDisabled?: boolean) => (
    <div className="rounded-[28px] border border-[var(--wood)]/10 bg-white/55 p-6 shadow-sm backdrop-blur lg:sticky lg:top-28">
      <h2 className="font-title text-2xl text-[var(--wood)]">Récapitulatif</h2>
      <dl className="mt-6 space-y-3 text-sm">
        <div className="flex justify-between text-[var(--wood)]/80">
          <dt>Sous-total</dt>
          <dd className="font-medium text-[var(--wood)]">{formatMoney(sousTotal)}</dd>
        </div>
        {remise > 0 && (
          <div className="flex justify-between text-[var(--brick)]">
            <dt>Remise {promoApplied ? `(${promoApplied})` : ''}</dt>
            <dd>− {formatMoney(remise)}</dd>
          </div>
        )}
        <div className="flex justify-between text-[var(--wood)]/80">
          <dt>Frais de livraison (estimés)</dt>
          <dd className="font-medium text-[var(--wood)]">{formatMoney(FRAIS_LIVRAISON_ESTIME)}</dd>
        </div>
        <div className="border-t border-[var(--wood)]/10 pt-4">
          <div className="flex justify-between items-baseline">
            <dt className="font-title text-xl text-[var(--wood)]">Total</dt>
            <dd className="font-title text-2xl text-[var(--ochre)]">{formatMoney(total)}</dd>
          </div>
        </div>
      </dl>

      <div className="mt-6">
        <label className="text-xs font-semibold text-[var(--wood)]/70">Code promo</label>
        <div className="mt-2 flex gap-2">
          <input
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value)}
            placeholder="BIENVENUE10"
            disabled={step === 'confirmation'}
            className="min-w-0 flex-1 rounded-2xl border border-[var(--wood)]/10 bg-white/50 px-4 py-2.5 text-sm text-[var(--wood)] outline-none focus:border-[var(--ochre)]/45"
          />
          <button
            type="button"
            onClick={applyPromo}
            disabled={step === 'confirmation'}
            className="shrink-0 rounded-2xl border border-[var(--wood)]/15 bg-[var(--wood)] px-4 py-2.5 text-sm font-semibold text-[var(--ivory)] hover:bg-[var(--wood)]/95 disabled:opacity-50"
          >
            Appliquer
          </button>
        </div>
        {promoError && <p className="mt-2 text-[11px] text-red-600">{promoError}</p>}
        {promoApplied && !promoError && (
          <div className="mt-2 text-[11px] text-[var(--wood)]/65">
            <p className="font-semibold">Code {promoApplied} appliqué</p>
            {promoConditions.length > 0 && <p>{promoConditions.join(' · ')}</p>}
          </div>
        )}
      </div>

      {showCta && (
        <button
          type="button"
          onClick={onCta}
          disabled={ctaDisabled}
          className="mt-8 w-full rounded-full bg-[var(--ochre)] py-4 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(194,97,15,.22)] hover:bg-[#a6500c] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[var(--ivory)] text-[var(--wood)]">
      <Header />
      <main className="flex-grow py-10 lg:py-12">
        <div className="mx-auto w-full max-w-[1200px] px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="font-title text-4xl tracking-tight sm:text-5xl">
              {step === 'panier' && 'Panier'}
              {step === 'livraison' && 'Livraison'}
              {step === 'paiement' && 'Paiement'}
              {step === 'confirmation' && 'Commande confirmée'}
            </h1>
            <p className="mt-2 text-sm text-[var(--wood)]/70">
              {step === 'confirmation'
                ? 'Merci pour votre confiance.'
                : 'Finalisez votre commande en quelques étapes.'}
            </p>
          </div>

          <Stepper current={step} />

          {/* Étape Panier */}
          {step === 'panier' && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
              <div className="lg:col-span-7 space-y-4">
                {items.length === 0 ? (
                  <div className="rounded-[28px] border border-[var(--wood)]/10 bg-white/55 p-12 text-center backdrop-blur">
                    <p className="font-title text-2xl text-[var(--wood)]">Votre panier est vide</p>
                    <p className="mt-2 text-sm text-[var(--wood)]/70">Découvrez le catalogue et ajoutez des saveurs.</p>
                    <Link
                      href="/catalogue"
                      className="mt-8 inline-flex rounded-full bg-[var(--ochre)] px-8 py-3 text-sm font-semibold text-white hover:bg-[#a6500c]"
                    >
                      Voir le catalogue
                    </Link>
                  </div>
                ) : (
                  items.map((item) => {
                    const line = item.prixUnitaire * item.quantite;
                    const maxQ = item.quantiteMax != null ? item.quantiteMax : 999;
                    return (
                      <article
                        key={item.id}
                        className="flex flex-col gap-4 rounded-[28px] border border-[var(--wood)]/10 bg-white/55 p-5 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:gap-6"
                      >
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-[var(--wood)]/10">
                          <img src={item.image} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-lg text-[var(--wood)]">{item.nom}</h3>
                          <p className="mt-1 text-sm text-[var(--wood)]/65">{formatMoney(item.prixUnitaire)} / unité</p>
                          {item.quantiteMax != null && item.quantiteMax >= 0 ? (
                            <p className="mt-1 text-xs text-[var(--wood)]/55">
                              {item.quantiteMax === 0
                                ? 'Article signalé indisponible — retirez-le pour continuer.'
                                : `Stock max affiché : ${item.quantiteMax} unité(s).`}
                            </p>
                          ) : null}
                          <div className="mt-4 flex flex-wrap items-center gap-4">
                            <div className="inline-flex items-center rounded-full border border-[var(--wood)]/10 bg-white/50 p-1">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantite - 1)}
                                className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--wood)] hover:bg-white/80"
                                aria-label="Diminuer"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min={1}
                                max={maxQ}
                                value={item.quantite}
                                onChange={(e) => {
                                  const v = parseInt(e.target.value, 10);
                                  if (!Number.isNaN(v))
                                    updateQuantity(item.id, Math.min(maxQ, Math.max(1, v)));
                                }}
                                className="w-12 bg-transparent text-center text-sm font-semibold text-[var(--wood)] outline-none"
                                aria-label="Quantité"
                              />
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantite + 1)}
                                disabled={item.quantite >= maxQ}
                                className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--wood)] hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label="Augmenter"
                              >
                                +
                              </button>
                            </div>
                            <span className="font-title text-xl text-[var(--wood)]">{formatMoney(line)}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="self-start rounded-xl border border-[var(--wood)]/10 p-2.5 text-[var(--wood)]/50 hover:border-[var(--brick)]/40 hover:text-[var(--brick)] sm:self-center"
                          aria-label="Supprimer"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </article>
                    );
                  })
                )}
              </div>
              <div className="lg:col-span-5">
                {summaryBlock(items.length > 0, 'Continuer vers la livraison', goLivraison, items.length === 0)}
              </div>
            </div>
          )}

          {/* Étape Livraison */}
          {step === 'livraison' && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
              <div className="lg:col-span-7">
                <div className="rounded-[28px] border border-[var(--wood)]/10 bg-white/55 p-6 backdrop-blur lg:p-8">
                  <h2 className="font-title text-2xl">Adresse de livraison</h2>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-[var(--wood)]/80">
                      Prénom
                      <input
                        value={address.prenom}
                        onChange={(e) => setAddress((a) => ({ ...a, prenom: e.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-[var(--wood)]/10 bg-white/50 px-4 py-3 text-sm outline-none focus:border-[var(--ochre)]/45"
                      />
                    </label>
                    <label className="text-xs font-semibold text-[var(--wood)]/80">
                      Nom
                      <input
                        value={address.nom}
                        onChange={(e) => setAddress((a) => ({ ...a, nom: e.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-[var(--wood)]/10 bg-white/50 px-4 py-3 text-sm outline-none focus:border-[var(--ochre)]/45"
                      />
                    </label>
                    <label className="sm:col-span-2 text-xs font-semibold text-[var(--wood)]/80">
                      Adresse
                      <input
                        value={address.ligne1}
                        onChange={(e) => setAddress((a) => ({ ...a, ligne1: e.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-[var(--wood)]/10 bg-white/50 px-4 py-3 text-sm outline-none focus:border-[var(--ochre)]/45"
                      />
                    </label>
                    <label className="sm:col-span-2 text-xs font-semibold text-[var(--wood)]/80">
                      Complément (optionnel)
                      <input
                        value={address.ligne2}
                        onChange={(e) => setAddress((a) => ({ ...a, ligne2: e.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-[var(--wood)]/10 bg-white/50 px-4 py-3 text-sm outline-none focus:border-[var(--ochre)]/45"
                      />
                    </label>
                    <label className="text-xs font-semibold text-[var(--wood)]/80">
                      Code postal
                      <input
                        value={address.codePostal}
                        onChange={(e) => setAddress((a) => ({ ...a, codePostal: e.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-[var(--wood)]/10 bg-white/50 px-4 py-3 text-sm outline-none focus:border-[var(--ochre)]/45"
                      />
                    </label>
                    <label className="text-xs font-semibold text-[var(--wood)]/80">
                      Ville
                      <input
                        value={address.ville}
                        onChange={(e) => setAddress((a) => ({ ...a, ville: e.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-[var(--wood)]/10 bg-white/50 px-4 py-3 text-sm outline-none focus:border-[var(--ochre)]/45"
                      />
                    </label>
                    <label className="text-xs font-semibold text-[var(--wood)]/80">
                      Pays
                      <select
                        value={address.pays}
                        onChange={(e) => setAddress((a) => ({ ...a, pays: e.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-[var(--wood)]/10 bg-white/50 px-4 py-3 text-sm outline-none focus:border-[var(--ochre)]/45"
                      >
                        <option>France</option>
                        <option>Belgique</option>
                        <option>Suisse</option>
                      </select>
                    </label>
                    <label className="text-xs font-semibold text-[var(--wood)]/80">
                      Téléphone
                      <input
                        type="tel"
                        value={address.telephone}
                        onChange={(e) => setAddress((a) => ({ ...a, telephone: e.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-[var(--wood)]/10 bg-white/50 px-4 py-3 text-sm outline-none focus:border-[var(--ochre)]/45"
                      />
                    </label>
                    <label className="sm:col-span-2 text-xs font-semibold text-[var(--wood)]/80">
                      Type de livraison
                      <select
                        value={deliveryType}
                        onChange={(e) => setDeliveryType(e.target.value as DeliveryType)}
                        className="mt-2 w-full rounded-2xl border border-[var(--wood)]/10 bg-white/50 px-4 py-3 text-sm outline-none focus:border-[var(--ochre)]/45"
                      >
                        <option value="domicile">À domicile</option>
                        <option value="point_relais">Point relais</option>
                        <option value="retrait_sur_place">Retrait sur place</option>
                      </select>
                    </label>
                    <label className="sm:col-span-2 text-xs font-semibold text-[var(--wood)]/80">
                      Créneau souhaité
                      <select
                        value={deliverySlot}
                        onChange={(e) => setDeliverySlot(e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-[var(--wood)]/10 bg-white/50 px-4 py-3 text-sm outline-none focus:border-[var(--ochre)]/45"
                      >
                        <option>Dès que possible</option>
                        <option>Midi (11h30 - 13h30)</option>
                        <option>Après-midi (14h - 18h)</option>
                        <option>Soir (19h - 22h)</option>
                      </select>
                    </label>
                    <label className="sm:col-span-2 text-xs font-semibold text-[var(--wood)]/80">
                      Instructions de livraison (optionnel)
                      <textarea
                        value={deliveryInstructions}
                        onChange={(e) => setDeliveryInstructions(e.target.value)}
                        rows={3}
                        placeholder="Ex: digicode, étage, repère..."
                        className="mt-2 w-full resize-y rounded-2xl border border-[var(--wood)]/10 bg-white/50 px-4 py-3 text-sm outline-none focus:border-[var(--ochre)]/45"
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('panier')}
                    className="mt-8 text-sm font-semibold text-[var(--wood)]/70 underline decoration-[var(--ochre)]/40 underline-offset-4 hover:text-[var(--wood)]"
                  >
                    ← Retour au panier
                  </button>
                </div>
              </div>
              <div className="lg:col-span-5">
                {summaryBlock(true, 'Continuer vers le paiement', goPaiement, false)}
              </div>
            </div>
          )}

          {/* Étape Paiement */}
          {step === 'paiement' && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
              <div className="lg:col-span-7 space-y-6">
                <div className="rounded-[28px] border border-[var(--wood)]/10 bg-white/55 p-6 backdrop-blur lg:p-8">
                  <h2 className="font-title text-2xl">Mode de paiement</h2>
                  {submitError ? (
                    <div className="mt-4 rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-900">
                      {submitError}
                    </div>
                  ) : null}
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMode('carte')}
                      className={`rounded-[22px] border p-5 text-left transition ${
                        paymentMode === 'carte'
                          ? 'border-[var(--ochre)]/45 bg-[color:rgba(194,97,15,.10)]'
                          : 'border-[var(--wood)]/10 bg-white/40 hover:bg-white/55'
                      }`}
                    >
                      <p className="font-semibold text-[var(--wood)]">Carte bancaire</p>
                      <p className="mt-1 text-xs text-[var(--wood)]/65">Visa, Mastercard (démo)</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMode('virement')}
                      className={`rounded-[22px] border p-5 text-left transition ${
                        paymentMode === 'virement'
                          ? 'border-[var(--ochre)]/45 bg-[color:rgba(194,97,15,.10)]'
                          : 'border-[var(--wood)]/10 bg-white/40 hover:bg-white/55'
                      }`}
                    >
                      <p className="font-semibold text-[var(--wood)]">Virement</p>
                      <p className="mt-1 text-xs text-[var(--wood)]/65">IBAN communiqué après validation</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMode('mobile')}
                      className={`rounded-[22px] border p-5 text-left transition ${
                        paymentMode === 'mobile'
                          ? 'border-[var(--ochre)]/45 bg-[color:rgba(194,97,15,.10)]'
                          : 'border-[var(--wood)]/10 bg-white/40 hover:bg-white/55'
                      }`}
                    >
                      <p className="font-semibold text-[var(--wood)]">Paiement mobile</p>
                      <p className="mt-1 text-xs text-[var(--wood)]/65">Orange Money, MTN Money (simulation)</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMode('especes')}
                      className={`rounded-[22px] border p-5 text-left transition ${
                        paymentMode === 'especes'
                          ? 'border-[var(--ochre)]/45 bg-[color:rgba(194,97,15,.10)]'
                          : 'border-[var(--wood)]/10 bg-white/40 hover:bg-white/55'
                      }`}
                    >
                      <p className="font-semibold text-[var(--wood)]">Espèces à la livraison</p>
                      <p className="mt-1 text-xs text-[var(--wood)]/65">Préparez l&apos;appoint si possible</p>
                    </button>
                  </div>

                  {paymentMode === 'carte' && (
                    <div className="mt-8 space-y-4 border-t border-[var(--wood)]/10 pt-8">
                      <p className="text-xs font-semibold text-[var(--wood)]/70">Coordonnées carte (démo)</p>
                      <label className="block text-xs font-semibold text-[var(--wood)]/80">
                        Numéro de carte
                        <input
                          placeholder="1234 5678 9012 3456"
                          className="mt-2 w-full rounded-2xl border border-[var(--wood)]/10 bg-white/50 px-4 py-3 text-sm outline-none focus:border-[var(--ochre)]/45"
                          autoComplete="cc-number"
                        />
                      </label>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-xs font-semibold text-[var(--wood)]/80">
                          Expiration
                          <input
                            placeholder="MM/AA"
                            className="mt-2 w-full rounded-2xl border border-[var(--wood)]/10 bg-white/50 px-4 py-3 text-sm outline-none focus:border-[var(--ochre)]/45"
                          />
                        </label>
                        <label className="text-xs font-semibold text-[var(--wood)]/80">
                          CVV
                          <input
                            placeholder="123"
                            className="mt-2 w-full rounded-2xl border border-[var(--wood)]/10 bg-white/50 px-4 py-3 text-sm outline-none focus:border-[var(--ochre)]/45"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {paymentMode === 'virement' && (
                    <p className="mt-8 rounded-2xl border border-[var(--wood)]/10 bg-[color:rgba(139,58,42,.07)] p-4 text-sm text-[var(--wood)]/75">
                      Après confirmation, vous recevrez les coordonnées bancaires et la référence à indiquer sur le virement.
                    </p>
                  )}
                  {paymentMode === 'mobile' && (
                    <p className="mt-8 rounded-2xl border border-[var(--wood)]/10 bg-[color:rgba(139,58,42,.07)] p-4 text-sm text-[var(--wood)]/75">
                      Le paiement mobile est simulé pour l&apos;instant, mais la méthode est transmise au backend.
                    </p>
                  )}
                  {paymentMode === 'especes' && (
                    <p className="mt-8 rounded-2xl border border-[var(--wood)]/10 bg-[color:rgba(139,58,42,.07)] p-4 text-sm text-[var(--wood)]/75">
                      Vous réglerez à la livraison. Le livreur pourra confirmer le paiement au moment de la remise.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => setStep('livraison')}
                    className="mt-8 text-sm font-semibold text-[var(--wood)]/70 underline decoration-[var(--ochre)]/40 underline-offset-4 hover:text-[var(--wood)]"
                  >
                    ← Modifier la livraison
                  </button>
                </div>
              </div>
              <div className="lg:col-span-5">
                {summaryBlock(
                  true,
                  submitLoading ? 'Traitement…' : 'Confirmer et payer',
                  () => {
                    void finalizeOrder();
                  },
                  submitLoading
                )}
              </div>
            </div>
          )}

          {/* Confirmation */}
          {step === 'confirmation' && orderSnapshot && (
            <div className="mx-auto max-w-2xl rounded-[34px] border border-[var(--wood)]/10 bg-white/55 p-8 text-center shadow-sm backdrop-blur lg:p-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[color:rgba(194,97,15,.18)] text-3xl text-[var(--ochre)]">
                ✓
              </div>
              <h2 className="font-title mt-6 text-3xl text-[var(--wood)]">Merci !</h2>
              <p className="mt-2 text-sm text-[var(--wood)]/75">
                Votre commande a bien été enregistrée.
              </p>
              <div className="mt-8 rounded-2xl border-2 border-[var(--ochre)] bg-[var(--wood)] px-6 py-6 text-[var(--ivory)] shadow-md">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ivory)]/75">
                  Votre numéro de commande
                </p>
                <p className="mt-3 select-all break-all font-mono text-3xl font-bold tracking-wider sm:text-4xl">
                  {orderSnapshot.orderNumber}
                </p>
                <p className="mt-3 text-xs text-[var(--ivory)]/70">
                  Conservez-le pour suivre votre commande. Un e-mail de confirmation vous est envoyé.
                </p>
              </div>
              <div className="mt-6 text-left text-sm text-[var(--wood)]/75">
                <p>
                  <strong className="text-[var(--wood)]">Livraison :</strong>{' '}
                  {address.prenom} {address.nom}, {address.ligne1}, {address.codePostal} {address.ville}
                </p>
                <p className="mt-2">
                  <strong className="text-[var(--wood)]">Total payé :</strong>{' '}
                  {formatMoney(orderSnapshot.total)}
                </p>
                {orderSnapshot.remise > 0 && (
                  <p className="mt-1 text-xs">
                    Sous-total {formatMoney(orderSnapshot.sousTotal)} · Remise −{formatMoney(orderSnapshot.remise)} ·
                    Livraison {formatMoney(orderSnapshot.frais)}
                  </p>
                )}
                <p className="mt-2">
                  <strong className="text-[var(--wood)]">Paiement :</strong>{' '}
                  {paymentLabel(paymentMode)}
                </p>
                <p className="mt-2">
                  <strong className="text-[var(--wood)]">Livraison :</strong> {deliveryType.replaceAll('_', ' ')} ·{' '}
                  {deliverySlot}
                </p>
                {deliveryInstructions ? (
                  <p className="mt-1 text-xs">
                    <strong className="text-[var(--wood)]">Instructions :</strong> {deliveryInstructions}
                  </p>
                ) : null}
                <p className="mt-2">
                  <strong className="text-[var(--wood)]">Statut :</strong> {commandeStatusLabel(orderSnapshot.statut)}
                </p>
              </div>
              <p className="mt-4 text-xs text-[var(--wood)]/55">
                Redirection automatique vers le suivi de vos commandes…
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/dashboard?tab=commandes"
                  className="inline-flex justify-center rounded-full border border-[var(--wood)]/15 bg-white/50 px-8 py-3 text-sm font-semibold text-[var(--wood)] hover:bg-white/70"
                >
                  Suivre mes commandes
                </Link>
                <Link
                  href="/catalogue"
                  className="inline-flex justify-center rounded-full bg-[var(--ochre)] px-8 py-3 text-sm font-semibold text-white hover:bg-[#a6500c]"
                >
                  Continuer mes achats
                </Link>
                <Link
                  href="/"
                  className="inline-flex justify-center rounded-full border border-[var(--wood)]/15 bg-white/50 px-8 py-3 text-sm font-semibold text-[var(--wood)] hover:bg-white/70"
                >
                  Accueil
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
