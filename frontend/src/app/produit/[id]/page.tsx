'use client';

import { useEffect, useMemo, useState } from 'react';
import { trackViewItem } from '@/lib/analytics';
import Link from 'next/link';
import PartagerPlat from '@/components/PartagerPlat';
import BoutonFavori from '@/components/BoutonFavori';
import { SITE_URL } from '@/lib/seo';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import {
  fetchPlatById,
  fetchPlats,
  prixUnitaireAffiche,
  quantiteMaxPourPanier,
  type Plat,
} from '@/services/plats';
import { createAvis, getAvisByPlat, type AvisItem, type AvisStatistiques } from '@/services/avis';

type ProductView = {
  id: string;
  nom: string;
  description: string;
  descriptionLongue?: string;
  originePays: string;
  origineRegion?: string;
  prixUnitaire: number;
  prixCatalogue: number;
  prixPromoActif: boolean;
  prix: string;
  note: number;
  images: string[];
  /** Libellé cuisine / origine (affichage uniquement, sans page dédiée). */
  signature: string;
  categorie: string;
  /** null = stock illimité ; 0 = indisponible */
  quantiteMax: number | null;
  indisponible: boolean;
  nutrition?: Plat['nutrition'];
};

function formatPrix(prix: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(prix);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function toView(p: Plat): ProductView {
  const prixUnitaire = prixUnitaireAffiche(p);
  const prixPromoActif = prixUnitaire < p.prix;
  const originePays = p.origineAfricaine?.pays || 'Afrique';
  const origineRegion = p.origineAfricaine?.region || undefined;
  const base = p.images?.principale
    ? [p.images.principale]
    : ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1400&q=80'];
  const images = Array.from(
    new Set([...(p.images?.galerie || []), ...base].filter(Boolean))
  );
  const max = quantiteMaxPourPanier(p);
  return {
    id: p._id,
    nom: p.nom,
    description: p.description,
    descriptionLongue: p.descriptionLongue,
    originePays,
    origineRegion,
    prixUnitaire,
    prixCatalogue: p.prix,
    prixPromoActif,
    prix: formatPrix(prixUnitaire),
    note: typeof p.notemoyenne === 'number' ? p.notemoyenne : 4.6,
    images: images.length ? images : base,
    signature: 'Atelier Épices Douala',
    categorie: p.categorie || 'plats-principaux',
    quantiteMax: max === 0 ? 0 : max,
    indisponible: max === 0,
    nutrition: p.nutrition,
  };
}

const fallback: ProductView = {
  id: 'fallback',
  nom: 'Jollof rice au poulet',
  description:
    "Riz jollof parfumé, poulet tendre, épices chaudes. Une assiette iconique, généreuse et réconfortante.",
  originePays: 'Nigeria',
  origineRegion: 'Lagos',
  prixUnitaire: 15.5,
  prixCatalogue: 15.5,
  prixPromoActif: false,
  prix: formatPrix(15.5),
  note: 4.7,
  images: [
    '/images/plats/1769702264382_Jollof_rice_au_poulet.jpg',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1400&q=80',
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=1400&q=80',
  ],
  signature: 'Cuisine du Bénin',
  categorie: 'plats-principaux',
  quantiteMax: null,
  indisponible: false,
};

function Stars({ value }: { value: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const total = 5;
  return (
    <div className="inline-flex items-center gap-1" aria-label={`Note ${value.toFixed(1)} sur 5`}>
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < full;
        const isHalf = i === full && half;
        return (
          <span key={i} className="text-[var(--ochre)]">
            {filled ? '★' : isHalf ? '⯪' : '☆'}
          </span>
        );
      })}
    </div>
  );
}

export default function ProduitPage({ params }: { params: { id: string } }) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<ProductView>(fallback);
  const [introuvable, setIntrouvable] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);

  // Suggestions de menu : un plat de chaque catégorie complémentaire (boisson, accompagnement, dessert, entrée)
  const [menuSuggere, setMenuSuggere] = useState<ProductView[]>([]);
  const [menuAjoute, setMenuAjoute] = useState(false);

  const [similarLoading, setSimilarLoading] = useState(true);
  const [similar, setSimilar] = useState<ProductView[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState('');
  const [reviews, setReviews] = useState<AvisItem[]>([]);
  const [reviewStats, setReviewStats] = useState<AvisStatistiques | null>(null);
  const [reviewForm, setReviewForm] = useState({
    commandeId: '',
    note: 5,
    titre: '',
    commentaire: '',
    recommande: true,
  });
  const [reviewSubmitLoading, setReviewSubmitLoading] = useState(false);
  const [reviewSubmitMessage, setReviewSubmitMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setIntrouvable(false);
    setSelectedImage(0);
    fetchPlatById(params.id)
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          const vue = toView(res.data as Plat);
          setProduct(vue);
          trackViewItem({ item_id: vue.id, item_name: vue.nom, price: vue.prixUnitaire, quantity: 1 });
        } else {
          // Plat supprimé, identifiant inconnu (ancien favori de démonstration…) : on l'indique au lieu d'afficher un autre plat
          setIntrouvable(true);
        }
      })
      .catch(() => setIntrouvable(true))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSimilarLoading(true);
    fetchPlats({ limite: 12, tri: 'populaire' })
      .then((res) => {
        if (cancelled) return;
        const plats = res.success && res.data && Array.isArray(res.data.plats) ? res.data.plats : [];
        const mapped = plats.map(toView).filter((p) => p.id !== product.id);
        setSimilar(mapped.slice(0, 6));
      })
      .catch(() => setSimilar([]))
      .finally(() => {
        if (!cancelled) setSimilarLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [product.id]);

  useEffect(() => {
    let cancelled = false;
    const categories = ['boissons', 'accompagnements', 'desserts', 'entrees'].filter((c) => c !== product.categorie);
    Promise.all(categories.map((categorie) => fetchPlats({ categorie, limite: 4, tri: 'populaire' }).catch(() => null)))
      .then((reponses) => {
        if (cancelled) return;
        const choix: ProductView[] = [];
        for (const r of reponses) {
          const plats = r && r.success && r.data && Array.isArray(r.data.plats) ? r.data.plats : [];
          const dispo = plats.map(toView).find((p) => p.id !== product.id && !p.indisponible);
          if (dispo) choix.push(dispo);
        }
        setMenuSuggere(choix);
        setMenuAjoute(false);
      })
      .catch(() => setMenuSuggere([]));
    return () => {
      cancelled = true;
    };
  }, [product.id, product.categorie]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReviewsLoading(true);
    setReviewsError('');
    getAvisByPlat(params.id, { limite: 10, tri: 'recent' })
      .then((res) => {
        if (cancelled) return;
        if (!res.success) {
          setReviewsError(res.message || 'Impossible de charger les avis.');
          setReviews([]);
          setReviewStats(null);
          return;
        }
        setReviews(res.data?.avis || []);
        setReviewStats(res.data?.statistiques || null);
      })
      .catch((err) => {
        if (cancelled) return;
        setReviewsError(err instanceof Error ? err.message : 'Impossible de charger les avis.');
        setReviews([]);
        setReviewStats(null);
      })
      .finally(() => {
        if (!cancelled) setReviewsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const originLabel = useMemo(() => {
    const reg = product.origineRegion ? ` • ${product.origineRegion}` : '';
    return `${product.originePays}${reg}`;
  }, [product.originePays, product.origineRegion]);

  const maxQtySelect = useMemo(() => {
    if (product.indisponible) return 1;
    if (product.quantiteMax == null) return 99;
    return Math.max(1, Math.min(99, product.quantiteMax));
  }, [product.indisponible, product.quantiteMax]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQty((q) => clamp(q, 1, maxQtySelect));
  }, [maxQtySelect, product.id]);

  const longDescription = useMemo(() => {
    const parts = [product.description];
    const long = product.descriptionLongue?.trim();
    if (long) {
      parts.push(
        ...long
          .split(/\n+/)
          .map((l) => l.trim())
          .filter(Boolean)
      );
    } else {
      parts.push(
        'Profil aromatique: oignons confits, tomate, notes fumées et épices chaudes.',
        'Texture: grains séparés, sauce nappante, finition légèrement pimentée.',
        'Conseil dégustation: accompagner d’une boisson au gingembre ou d’un bissap frais.'
      );
    }
    return parts;
  }, [product.description, product.descriptionLongue]);

  const displayedRating = reviewStats?.noteMoyenne ?? product.note;
  const displayedReviewCount = reviewStats?.nombreTotal ?? reviews.length;

  if (introuvable && !loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--ivory)] text-[var(--wood)]">
        <Header />
        <main className="flex flex-grow items-center justify-center px-6 py-20 text-center">
          <div className="max-w-md">
            <h1 className="font-title text-4xl">Plat introuvable</h1>
            <p className="mt-3 text-sm text-[var(--wood)]/70">
              Ce plat n’existe plus ou n’est plus proposé. S’il figurait dans vos favoris, vous pouvez le retirer et en choisir un autre.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/catalogue" className="rounded-full bg-[var(--ochre)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#a6500c]">
                Voir le catalogue
              </Link>
              <Link href="/dashboard?tab=favoris" className="rounded-full border border-[var(--wood)]/20 px-6 py-2.5 text-sm font-semibold hover:bg-white">
                Mes favoris
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--ivory)] text-[var(--wood)]">
      <Header />
      <main className="flex-grow">
        <div className="mx-auto w-full max-w-[1400px] px-6 py-10 lg:px-12">
          {/* Breadcrumb */}
          <nav className="text-xs text-[var(--wood)]/65">
            <Link className="hover:text-[var(--wood)]" href="/catalogue">
              Catalogue
            </Link>
            <span className="px-2">/</span>
            <span className="text-[var(--wood)]/85">{product.nom}</span>
          </nav>

          {/* Layout asymétrique */}
          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
            {/* Galerie gauche */}
            <section className="lg:col-span-7">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[92px_1fr]">
                <div className="hidden lg:grid gap-3">
                  {product.images.slice(0, 6).map((src, idx) => (
                    <button
                      key={`${src}-${idx}`}
                      type="button"
                      onClick={() => setSelectedImage(idx)}
                      className={[
                        'relative overflow-hidden rounded-2xl border bg-white/55 shadow-sm backdrop-blur transition',
                        selectedImage === idx
                          ? 'border-[var(--ochre)]/45 ring-2 ring-[color:rgba(194,97,15,.18)]'
                          : 'border-[var(--wood)]/10 hover:bg-white/65',
                      ].join(' ')}
                      aria-label={`Voir image ${idx + 1}`}
                    >
                      <img src={src} alt="" className="h-[78px] w-[92px] object-cover" />
                    </button>
                  ))}
                </div>

                <figure className="relative overflow-hidden rounded-[34px] border border-[var(--wood)]/10 bg-white/55 shadow-sm backdrop-blur">
                  <img
                    src={product.images[selectedImage] || product.images[0]}
                    alt={product.nom}
                    className="h-[520px] w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-transparent opacity-90" />
                  <figcaption className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="inline-flex items-center gap-2 rounded-full bg-black/35 px-3 py-1 text-xs font-semibold text-white">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--brick)]" />
                      {loading ? 'Chargement…' : 'Photo produit'}
                    </div>
                  </figcaption>
                </figure>
              </div>

              {/* Miniatures mobile */}
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden lg:hidden">
                {product.images.slice(0, 8).map((src, idx) => (
                  <button
                    key={`${src}-m-${idx}`}
                    type="button"
                    onClick={() => setSelectedImage(idx)}
                    className={[
                      'shrink-0 overflow-hidden rounded-2xl border bg-white/55 shadow-sm backdrop-blur',
                      selectedImage === idx ? 'border-[var(--ochre)]/45' : 'border-[var(--wood)]/10',
                    ].join(' ')}
                  >
                    <img src={src} alt="" className="h-[72px] w-[96px] object-cover" />
                  </button>
                ))}
              </div>
            </section>

            {/* Droite: infos + actions */}
            <section className="lg:col-span-5">
              <div className="rounded-[34px] border border-[var(--wood)]/10 bg-white/55 p-6 shadow-sm backdrop-blur lg:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--wood)]/10 bg-white/45 px-3 py-1 text-xs text-[var(--wood)]/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--ochre)]" />
                    {product.categorie}
                  </div>

                  <span
                    className="inline-flex items-center gap-2 rounded-full bg-[color:rgba(139,58,42,.10)] px-3 py-1 text-xs font-semibold text-[var(--wood)]"
                    title="Signature culinaire"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--brick)]" />
                    {product.signature}
                  </span>
                </div>

                <h1 className="font-title mt-5 text-5xl leading-[0.95] tracking-tight">
                  {product.nom}
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <BoutonFavori id={product.id} nom={product.nom} image={product.images[0] || ''} variante="texte" />
                </div>
                <PartagerPlat titre={product.nom} url={`${SITE_URL}/produit/${product.id}`} />

                {product.indisponible ? (
                  <p className="mt-3 inline-flex rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-800">
                    Rupture de stock — indisponible à la commande
                  </p>
                ) : product.quantiteMax != null ? (
                  <p className="mt-3 text-sm font-medium text-[var(--wood)]/75">
                    Stock limité : <span className="text-[var(--ochre)]">{product.quantiteMax}</span> unité(s)
                    disponible(s).
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[var(--wood)]/75">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[var(--wood)]/10 bg-white/40 px-3 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--wood)]" />
                    {originLabel}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[var(--wood)]/10 bg-white/40 px-3 py-1">
                    <Stars value={product.note} />
                    <span className="text-xs text-[var(--wood)]/70">{product.note.toFixed(1)}</span>
                  </span>
                </div>

                <p className="mt-6 text-base leading-relaxed text-[var(--wood)]/80">
                  {product.description}
                </p>

                <div className="mt-8 flex items-center justify-between gap-4">
                  <div>
                    {product.prixPromoActif ? (
                      <p className="font-ui text-sm text-[var(--wood)]/50 line-through">
                        {formatPrix(product.prixCatalogue)}
                      </p>
                    ) : null}
                    <p className="font-title text-4xl text-[var(--wood)]">{product.prix}</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--wood)]/10 bg-white/45 p-1">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={product.indisponible}
                      className="h-10 w-10 rounded-full bg-white/50 text-[var(--wood)] hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Diminuer la quantité"
                    >
                      −
                    </button>
                    <input
                      value={qty}
                      disabled={product.indisponible}
                      onChange={(e) =>
                        setQty(clamp(Number(e.target.value || 1), 1, maxQtySelect))
                      }
                      inputMode="numeric"
                      className="w-12 bg-transparent text-center text-sm font-semibold text-[var(--wood)] outline-none disabled:opacity-40"
                      aria-label="Quantité"
                    />
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.min(maxQtySelect, q + 1))}
                      disabled={product.indisponible || qty >= maxQtySelect}
                      className="h-10 w-10 rounded-full bg-white/50 text-[var(--wood)] hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Augmenter la quantité"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    disabled={product.indisponible}
                    onClick={() =>
                      addItem({
                        id: product.id,
                        nom: product.nom,
                        prixUnitaire: product.prixUnitaire,
                        image: product.images[0] || '',
                        quantite: qty,
                        quantiteMax: product.quantiteMax,
                      })
                    }
                    className="inline-flex items-center justify-center rounded-full bg-[var(--ochre)] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(194,97,15,.22)] hover:bg-[#a6500c] disabled:cursor-not-allowed disabled:bg-[var(--wood)]/30 disabled:text-[var(--wood)]/70 disabled:shadow-none"
                  >
                    {product.indisponible ? 'Indisponible' : 'Ajouter au panier'}
                  </button>
                  <Link
                    href="/panier"
                    className="inline-flex items-center justify-center rounded-full border border-[var(--wood)]/15 bg-white/45 px-6 py-3 text-sm font-semibold text-[var(--wood)] hover:bg-white/60"
                  >
                    Voir le panier
                  </Link>
                </div>

                <div className="mt-8 rounded-[24px] border border-[var(--wood)]/10 bg-[color:rgba(194,97,15,.08)] p-5">
                  <p className="text-xs font-semibold text-[var(--wood)]">Description riche</p>
                  <ul className="mt-2 space-y-2 text-sm text-[var(--wood)]/75">
                    <li className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ochre)]" />
                      Ingrédients sélectionnés, assaisonnement équilibré.
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brick)]" />
                      Niveau de piment: ajustable selon disponibilité.
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--wood)]" />
                      Emballage soigné, idéal pour partager.
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          </div>

          {/* Sections dessous */}
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <section className="lg:col-span-8 space-y-6">
              {/* Description longue */}
              <div className="rounded-[28px] border border-[var(--wood)]/10 bg-white/55 p-6 shadow-sm backdrop-blur lg:p-8">
                <h2 className="font-title text-3xl">Description longue</h2>
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--wood)]/75">
                  {longDescription.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>
              </div>

              {/* Suggestions de menu : accompagnements réels du catalogue, ajoutables au panier */}
              {menuSuggere.length > 0 && (
                <div className="rounded-[28px] border border-[var(--ochre)]/30 bg-[color:rgba(233,162,59,.08)] p-6 shadow-sm backdrop-blur lg:p-8">
                  <h2 className="font-title text-3xl">Complétez votre repas</h2>
                  <p className="mt-1 text-sm text-[var(--wood)]/70">
                    Nos accompagnements, boissons et desserts les plus appréciés avec ce plat.
                  </p>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {menuSuggere.map((m) => (
                      <div key={m.id} className="flex gap-3 rounded-[22px] border border-[var(--wood)]/10 bg-white/70 p-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.images[0]} alt={m.nom} className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                        <div className="flex min-w-0 flex-1 flex-col">
                          <Link href={`/produit/${m.id}`} className="truncate font-semibold hover:underline">
                            {m.nom}
                          </Link>
                          <p className="text-sm text-[var(--ochre)]">{m.prix}</p>
                          <button
                            type="button"
                            onClick={() =>
                              addItem({
                                id: m.id,
                                nom: m.nom,
                                prixUnitaire: m.prixUnitaire,
                                image: m.images[0] || '',
                                quantite: 1,
                                quantiteMax: m.quantiteMax,
                              })
                            }
                            className="mt-auto self-start rounded-full border border-[var(--ochre)] px-4 py-1.5 text-xs font-semibold text-[var(--ochre)] hover:bg-[var(--ochre)]/10"
                          >
                            Ajouter au panier
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={product.indisponible || menuAjoute}
                    onClick={() => {
                      addItem({
                        id: product.id,
                        nom: product.nom,
                        prixUnitaire: product.prixUnitaire,
                        image: product.images[0] || '',
                        quantite: qty,
                        quantiteMax: product.quantiteMax,
                      });
                      menuSuggere.forEach((m) =>
                        addItem({ id: m.id, nom: m.nom, prixUnitaire: m.prixUnitaire, image: m.images[0] || '', quantite: 1, quantiteMax: m.quantiteMax })
                      );
                      setMenuAjoute(true);
                    }}
                    className="mt-5 rounded-full bg-[var(--ochre)] px-6 py-3 text-sm font-semibold text-white hover:bg-[#a6500c] disabled:opacity-50"
                  >
                    {menuAjoute ? 'Menu ajouté au panier ✓' : 'Ajouter le plat + ce menu complet'}
                  </button>
                </div>
              )}

              {/* Astuces de préparation et de service */}
              <div className="rounded-[28px] border border-[var(--wood)]/10 bg-white/55 p-6 shadow-sm backdrop-blur lg:p-8">
                <h2 className="font-title text-3xl">Astuces de service</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {[
                    {
                      title: 'Bowl express',
                      desc: 'Ajoute une salade croquante + une sauce gingembre-citron.',
                    },
                    {
                      title: 'Version pimentée',
                      desc: 'Rehausse avec un condiment piment doux (brique) et citron vert.',
                    },
                    {
                      title: 'Menu complet',
                      desc: 'Associe un bissap glacé + un snack plantain chips.',
                    },
                    {
                      title: 'Batch cooking',
                      desc: 'Réchauffe à feu doux, ajoute un filet d’huile parfumée.',
                    },
                  ].map((r) => (
                    <div
                      key={r.title}
                      className="rounded-[22px] border border-[var(--wood)]/10 bg-white/40 p-5"
                    >
                      <p className="font-title text-2xl">{r.title}</p>
                      <p className="mt-2 text-sm text-[var(--wood)]/75">{r.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Avis clients */}
              <div className="rounded-[28px] border border-[var(--wood)]/10 bg-white/55 p-6 shadow-sm backdrop-blur lg:p-8">
                <div className="flex items-end justify-between gap-6">
                  <div>
                    <h2 className="font-title text-3xl">Avis clients</h2>
                    <p className="mt-1 text-sm text-[var(--wood)]/70">
                      {displayedReviewCount} avis publiés
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 rounded-full border border-[var(--wood)]/10 bg-white/40 px-4 py-2 text-sm text-[var(--wood)]/80">
                    <Stars value={displayedRating} />
                    <span className="font-semibold">{displayedRating.toFixed(1)}</span>
                  </div>
                </div>

                {user ? (
                  <form
                    className="mt-6 space-y-3 rounded-[22px] border border-[var(--wood)]/10 bg-white/35 p-4"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setReviewSubmitMessage(null);
                      if (!reviewForm.commandeId.trim()) {
                        setReviewSubmitMessage("Le numéro/ID de commande est requis pour publier un avis.");
                        return;
                      }
                      if (!reviewForm.commentaire.trim() || reviewForm.commentaire.trim().length < 10) {
                        setReviewSubmitMessage('Le commentaire doit contenir au moins 10 caractères.');
                        return;
                      }
                      setReviewSubmitLoading(true);
                      const res = await createAvis({
                        platId: params.id,
                        commandeId: reviewForm.commandeId.trim(),
                        note: reviewForm.note,
                        titre: reviewForm.titre.trim() || undefined,
                        commentaire: reviewForm.commentaire.trim(),
                        recommande: reviewForm.recommande,
                      });
                      setReviewSubmitLoading(false);
                      if (!res.success) {
                        setReviewSubmitMessage(res.message || "Impossible d'envoyer l'avis.");
                        return;
                      }
                      setReviewForm({
                        commandeId: '',
                        note: 5,
                        titre: '',
                        commentaire: '',
                        recommande: true,
                      });
                      setReviewSubmitMessage('Avis envoyé. Il sera visible après modération.');
                      const refreshed = await getAvisByPlat(params.id, { limite: 10, tri: 'recent' });
                      if (refreshed.success) {
                        setReviews(refreshed.data?.avis || []);
                        setReviewStats(refreshed.data?.statistiques || null);
                      }
                    }}
                  >
                    <p className="text-sm font-semibold text-[var(--wood)]">Laisser un avis</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-xs font-semibold text-[var(--wood)]/80">
                        ID / numéro de commande
                        <input
                          value={reviewForm.commandeId}
                          onChange={(e) => setReviewForm((f) => ({ ...f, commandeId: e.target.value }))}
                          placeholder="Ex: 665ab... ou AF-2026-..."
                          className="mt-1.5 w-full rounded-xl border border-[var(--wood)]/12 bg-white/60 px-3 py-2 text-sm outline-none focus:border-[var(--ochre)]/45"
                        />
                      </label>
                      <label className="text-xs font-semibold text-[var(--wood)]/80">
                        Note
                        <select
                          value={reviewForm.note}
                          onChange={(e) => setReviewForm((f) => ({ ...f, note: Number(e.target.value) }))}
                          className="mt-1.5 w-full rounded-xl border border-[var(--wood)]/12 bg-white/60 px-3 py-2 text-sm outline-none focus:border-[var(--ochre)]/45"
                        >
                          {[5, 4, 3, 2, 1].map((n) => (
                            <option key={n} value={n}>
                              {n} / 5
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label className="block text-xs font-semibold text-[var(--wood)]/80">
                      Titre (optionnel)
                      <input
                        value={reviewForm.titre}
                        onChange={(e) => setReviewForm((f) => ({ ...f, titre: e.target.value }))}
                        className="mt-1.5 w-full rounded-xl border border-[var(--wood)]/12 bg-white/60 px-3 py-2 text-sm outline-none focus:border-[var(--ochre)]/45"
                      />
                    </label>
                    <label className="block text-xs font-semibold text-[var(--wood)]/80">
                      Commentaire
                      <textarea
                        rows={3}
                        value={reviewForm.commentaire}
                        onChange={(e) => setReviewForm((f) => ({ ...f, commentaire: e.target.value }))}
                        className="mt-1.5 w-full rounded-xl border border-[var(--wood)]/12 bg-white/60 px-3 py-2 text-sm outline-none focus:border-[var(--ochre)]/45"
                      />
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--wood)]/80">
                      <input
                        type="checkbox"
                        checked={reviewForm.recommande}
                        onChange={(e) => setReviewForm((f) => ({ ...f, recommande: e.target.checked }))}
                      />
                      Je recommande ce plat
                    </label>
                    {reviewSubmitMessage ? (
                      <p className="text-xs text-[var(--wood)]/70">{reviewSubmitMessage}</p>
                    ) : null}
                    <button
                      type="submit"
                      disabled={reviewSubmitLoading}
                      className="rounded-full bg-[var(--ochre)] px-5 py-2 text-sm font-semibold text-white hover:bg-[#a6500c] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {reviewSubmitLoading ? 'Envoi…' : "Publier l'avis"}
                    </button>
                  </form>
                ) : (
                  <p className="mt-6 text-sm text-[var(--wood)]/65">
                    <Link href="/login" className="underline decoration-[var(--ochre)]/40 underline-offset-2">
                      Connectez-vous
                    </Link>{' '}
                    pour laisser un avis après votre commande.
                  </p>
                )}

                <div className="mt-6 space-y-4">
                  {reviewsLoading ? <p className="text-sm text-[var(--wood)]/70">Chargement des avis…</p> : null}
                  {reviewsError ? <p className="text-sm text-red-700">{reviewsError}</p> : null}
                  {!reviewsLoading && !reviews.length ? (
                    <p className="text-sm text-[var(--wood)]/70">Aucun avis pour ce plat pour le moment.</p>
                  ) : null}
                  {reviews.map((a) => {
                    const fullname = [a.utilisateur?.prenom, a.utilisateur?.nom].filter(Boolean).join(' ');
                    return (
                      <div
                        key={a._id}
                        className="rounded-[22px] border border-[var(--wood)]/10 bg-white/40 p-5"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-semibold text-[var(--wood)]">{fullname || 'Client vérifié'}</p>
                          <Stars value={a.note || 0} />
                        </div>
                        {a.titre ? <p className="mt-2 text-sm font-semibold text-[var(--wood)]">{a.titre}</p> : null}
                        <p className="mt-2 text-sm text-[var(--wood)]/75">{a.commentaire}</p>
                        <p className="mt-2 text-xs text-[var(--wood)]/50">
                          {new Date(a.createdAt).toLocaleDateString('fr-FR')} · {a.recommande ? 'Recommande' : 'Ne recommande pas'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <aside className="lg:col-span-4 space-y-6">
              {/* Valeurs nutritionnelles */}
              <div className="rounded-[28px] border border-[var(--wood)]/10 bg-white/55 p-6 shadow-sm backdrop-blur lg:p-8">
                <h2 className="font-title text-3xl">Valeurs nutritionnelles</h2>
                <p className="mt-2 text-xs text-[var(--wood)]/60">
                  {product.nutrition?.calories != null
                    ? 'Données fournies par le producteur (indicatif).'
                    : 'Indicatif pour 100g (démo si non renseigné côté catalogue).'}
                </p>
                <dl className="mt-5 divide-y divide-[var(--wood)]/10 text-sm">
                  {(product.nutrition?.calories != null
                    ? [
                        ['Énergie', `${product.nutrition.calories} kcal`],
                        ['Protéines', product.nutrition.proteines != null ? `${product.nutrition.proteines} g` : '—'],
                        ['Glucides', product.nutrition.glucides != null ? `${product.nutrition.glucides} g` : '—'],
                        ['Lipides', product.nutrition.lipides != null ? `${product.nutrition.lipides} g` : '—'],
                        ['Fibres', product.nutrition.fibres != null ? `${product.nutrition.fibres} g` : '—'],
                        ['Sodium', product.nutrition.sodium != null ? `${product.nutrition.sodium} mg` : '—'],
                      ]
                    : [
                        ['Énergie', '182 kcal'],
                        ['Protéines', '10 g'],
                        ['Glucides', '22 g'],
                        ['Lipides', '6 g'],
                        ['Sel', '0,8 g'],
                      ]
                  ).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between py-3">
                      <dt className="text-[var(--wood)]/75">{k}</dt>
                      <dd className="font-semibold text-[var(--wood)]">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Produits similaires */}
              <div className="rounded-[28px] border border-[var(--wood)]/10 bg-white/55 p-6 shadow-sm backdrop-blur lg:p-8">
                <div className="flex items-end justify-between gap-4">
                  <h2 className="font-title text-3xl">Produits similaires</h2>
                  <Link href="/catalogue" className="text-xs font-semibold text-[var(--wood)]/70 hover:text-[var(--wood)]">
                    Voir tout
                  </Link>
                </div>

                <div className="mt-5 space-y-3">
                  {similarLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-20 animate-pulse rounded-2xl bg-[var(--wood)]/10"
                      />
                    ))
                  ) : similar.length ? (
                    similar.slice(0, 4).map((s) => (
                      <Link
                        key={s.id}
                        href={`/produit/${s.id}`}
                        className="group flex items-center gap-4 rounded-2xl border border-[var(--wood)]/10 bg-white/40 p-3 hover:bg-white/55"
                      >
                        <img
                          src={s.images[0]}
                          alt={s.nom}
                          className="h-14 w-14 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-[var(--wood)] group-hover:text-[var(--wood)]">
                            {s.nom}
                          </p>
                          <p className="truncate text-xs text-[var(--wood)]/70">{s.originePays}</p>
                        </div>
                        <span className="font-title text-lg text-[var(--wood)]">{s.prix}</span>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-[var(--wood)]/70">
                      Aucune suggestion pour le moment.
                    </p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

