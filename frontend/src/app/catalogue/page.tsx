'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import BoutonFavori from '@/components/BoutonFavori';
import Footer from '@/components/Footer';
import AvisClients from '@/components/AvisClients';
import InstallButton from '@/components/InstallButton';
import { useCart } from '@/context/CartContext';
import {
  fetchCategories,
  fetchPlats,
  prixUnitaireAffiche,
  quantiteMaxPourPanier,
  type Plat,
} from '@/services/plats';
import { platImagesCommons as img } from '@/data/platImagesCommons';

type SortKey = 'pertinence' | 'prix-asc' | 'prix-desc' | 'nouveau';

type PricePresetId = 'all' | 'eco' | 'mid' | 'high' | 'premium' | 'custom';

const PRICE_PRESETS: { id: Exclude<PricePresetId, 'custom'>; label: string; min: number; max: number }[] = [
  { id: 'all', label: 'Tous les prix', min: 0, max: 250 },
  { id: 'eco', label: '≤ 10 €', min: 0, max: 10 },
  { id: 'mid', label: '10 – 20 €', min: 10, max: 20 },
  { id: 'high', label: '20 – 35 €', min: 20, max: 35 },
  { id: 'premium', label: '35 € et +', min: 35, max: 250 },
];

type CatalogueItem = {
  id: string;
  nom: string;
  origine: string;
  prixUnitaire: number;
  prix: string;
  /** Prix catalogue barré si promo active */
  prixBarre?: string;
  note: number;
  image: string;
  categorie: string;
  pays: string;
  rupture: boolean;
  /** null = stock illimité côté API */
  quantiteMax: number | null;
};

function formatPrix(prix: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(prix);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Numéros de page uniques (fenêtre centrée sur la page courante). */
function visiblePageNumbers(page: number, totalPages: number, windowSize: number): number[] {
  const t = Math.max(1, totalPages);
  const w = Math.min(Math.max(1, windowSize), t);
  if (t <= w) {
    return Array.from({ length: t }, (_, i) => i + 1);
  }
  const half = Math.floor(w / 2);
  let start = page - half;
  if (start < 1) start = 1;
  if (start + w - 1 > t) start = t - w + 1;
  return Array.from({ length: w }, (_, i) => start + i);
}

function platToItem(p: Plat): CatalogueItem {
  const prixUnitaire = prixUnitaireAffiche(p);
  const pays = p.origineAfricaine?.pays || 'Afrique';
  const region = p.origineAfricaine?.region ? ` • ${p.origineAfricaine.region}` : '';
  const note = typeof p.notemoyenne === 'number' ? p.notemoyenne : 4.4;
  const max = quantiteMaxPourPanier(p);
  const rupture = max === 0;
  const promoActive = prixUnitaire < p.prix;
  return {
    id: p._id,
    nom: p.nom,
    origine: `${pays}${region}`,
    prixUnitaire,
    prix: formatPrix(prixUnitaire),
    prixBarre: promoActive ? formatPrix(p.prix) : undefined,
    note,
    image: p.images?.principale || img.jollofRiz,
    categorie: p.categorie || 'plats-principaux',
    pays,
    rupture,
    quantiteMax: max === 0 ? 0 : max,
  };
}

const fallback: CatalogueItem[] = ([
  {
    id: 'fallback-jollof',
    nom: 'Jollof rice au poulet',
    origine: 'Nigeria • Lagos',
    prixUnitaire: 15.5,
    prix: formatPrix(15.5),
    note: 4.7,
    image: img.ghanaJollofPoulet,
    categorie: 'plats-principaux',
    pays: 'Nigeria',
  },
  {
    id: 'fallback-bissap',
    nom: 'Bissap glacé',
    origine: 'Sénégal',
    prixUnitaire: 3.5,
    prix: formatPrix(3.5),
    note: 4.5,
    image: img.jusBissap,
    categorie: 'boissons',
    pays: 'Sénégal',
  },
  {
    id: 'fallback-baobab',
    nom: 'Jus de baobab',
    origine: 'Sénégal',
    prixUnitaire: 4.5,
    prix: formatPrix(4.5),
    note: 4.6,
    image: img.baobabFruit,
    categorie: 'boissons',
    pays: 'Sénégal',
  },
  {
    id: 'fallback-pasteque',
    nom: 'Jus de pastèque',
    origine: 'Côte d’Ivoire',
    prixUnitaire: 4,
    prix: formatPrix(4),
    note: 4.5,
    image: img.pasteque,
    categorie: 'boissons',
    pays: 'Côte d’Ivoire',
  },
  {
    id: 'fallback-ananas',
    nom: 'Jus d’ananas',
    origine: 'Bénin',
    prixUnitaire: 4.5,
    prix: formatPrix(4.5),
    note: 4.7,
    image: img.ananas,
    categorie: 'boissons',
    pays: 'Bénin',
  },
  {
    id: 'fallback-amiwo',
    nom: 'Amiwo sauce poisson',
    origine: 'Bénin',
    prixUnitaire: 16.5,
    prix: formatPrix(16.5),
    note: 4.8,
    image: img.ghanaJollofPoulet,
    categorie: 'plats-principaux',
    pays: 'Bénin',
  },
  {
    id: 'fallback-placali',
    nom: 'Placali sauce gombo',
    origine: 'Bénin • Cotonou',
    prixUnitaire: 15.9,
    prix: formatPrix(15.9),
    note: 4.75,
    image: img.bankuOkra,
    categorie: 'plats-principaux',
    pays: 'Bénin',
  },
  {
    id: 'fallback-poulet-bicyclette',
    nom: 'Poulet bicyclette',
    origine: 'Bénin',
    prixUnitaire: 14.5,
    prix: formatPrix(14.5),
    note: 4.7,
    image: img.pouletGrilleBurkina,
    categorie: 'plats-principaux',
    pays: 'Bénin',
  },
  {
    id: 'fallback-crincrin',
    nom: 'Sauce crincrin au poisson fumé',
    origine: 'Bénin',
    prixUnitaire: 16,
    prix: formatPrix(16),
    note: 4.65,
    image: img.okroBushmeat,
    categorie: 'specialites-africaines',
    pays: 'Bénin',
  },
  {
    id: 'fallback-wagassi',
    nom: 'Wagassi grillé',
    origine: 'Bénin',
    prixUnitaire: 9.5,
    prix: formatPrix(9.5),
    note: 4.5,
    image: img.cheese,
    categorie: 'accompagnements',
    pays: 'Bénin',
  },
  {
    id: 'fallback-tchapalo',
    nom: 'Tchapalo',
    origine: 'Bénin',
    prixUnitaire: 3.5,
    prix: formatPrix(3.5),
    note: 4.4,
    image: img.beerGlass,
    categorie: 'boissons',
    pays: 'Bénin',
  },
  {
    id: 'fallback-dibi',
    nom: 'Dibi agneau',
    origine: 'Sénégal • Dakar',
    prixUnitaire: 19,
    prix: formatPrix(19),
    note: 4.6,
    image: '/images/plats/Dibi_agneau.png',
    categorie: 'plats-principaux',
    pays: 'Sénégal',
  },
  {
    id: 'fallback-epices',
    nom: 'Mélange Suya',
    origine: 'Cameroun',
    prixUnitaire: 6.9,
    prix: formatPrix(6.9),
    note: 4.4,
    image: img.peanuts,
    categorie: 'epices',
    pays: 'Cameroun',
  },
  {
    id: 'fallback-snack',
    nom: 'Chips de plantain',
    origine: 'Côte d’Ivoire',
    prixUnitaire: 4.2,
    prix: formatPrix(4.2),
    note: 4.3,
    image: img.alloco,
    categorie: 'snacks',
    pays: 'Côte d’Ivoire',
  },
  {
    id: 'fallback-mafe',
    nom: 'Mafé de bœuf',
    origine: 'Mali',
    prixUnitaire: 17,
    prix: formatPrix(17),
    note: 4.6,
    image: img.domoda,
    categorie: 'plats-principaux',
    pays: 'Mali',
  },
] as Omit<CatalogueItem, 'rupture' | 'quantiteMax'>[]).map((x) => ({
  ...x,
  rupture: false,
  quantiteMax: null,
}));

function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm transition',
        active
          ? 'border-[var(--ochre)]/35 bg-[color:rgba(194,97,15,.12)] text-[var(--wood)]'
          : 'border-[var(--wood)]/10 bg-white/40 text-[var(--wood)]/80 hover:bg-white/55',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function SkeletonCard() {
  return (
    <article className="overflow-hidden rounded-[28px] border border-[var(--wood)]/10 bg-white/55 shadow-sm backdrop-blur">
      <div className="h-44 w-full animate-pulse bg-[var(--wood)]/10" />
      <div className="p-5">
        <div className="h-5 w-3/4 animate-pulse rounded bg-[var(--wood)]/10" />
        <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-[var(--wood)]/10" />
        <div className="mt-6 flex items-center justify-between">
          <div className="h-7 w-20 animate-pulse rounded bg-[var(--wood)]/10" />
          <div className="h-10 w-28 animate-pulse rounded-full bg-[var(--wood)]/10" />
        </div>
      </div>
    </article>
  );
}

function ProductCard({
  item,
  onAdd,
  disableAdd = false,
}: {
  item: CatalogueItem;
  onAdd: () => void;
  disableAdd?: boolean;
}) {
  const disabled = item.rupture || disableAdd;
  return (
    <article className="group overflow-hidden rounded-[28px] border border-[var(--wood)]/10 bg-white/55 shadow-sm backdrop-blur transition hover:bg-white/65">
      <div className="relative">
        <Link href={`/produit/${item.id}`} aria-label={`Voir ${item.nom}`}>
          <img src={item.image} alt={item.nom} className="h-44 w-full object-cover" />
        </Link>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-transparent opacity-85" />
        <div className="absolute right-3 top-3">
          <BoutonFavori id={item.id} nom={item.nom} image={item.image} />
        </div>
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-black/35 px-3 py-1 text-xs font-semibold text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--ochre)]" />
            {item.note.toFixed(1)}
          </span>
          {item.rupture ? (
            <span className="rounded-full bg-[var(--brick)]/90 px-3 py-1 text-xs font-semibold text-white">
              Rupture
            </span>
          ) : item.quantiteMax != null && item.quantiteMax > 0 ? (
            <span className="rounded-full bg-black/35 px-3 py-1 text-xs font-semibold text-white">
              Stock {item.quantiteMax}
            </span>
          ) : null}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-title text-2xl leading-tight">
          <Link href={`/produit/${item.id}`} className="hover:underline">
            {item.nom}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-[var(--wood)]/70">{item.origine}</p>
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="font-title text-2xl text-[var(--wood)]">
            {item.prixBarre ? (
              <span className="mr-2 text-base font-normal text-[var(--wood)]/45 line-through decoration-[var(--wood)]/30">
                {item.prixBarre}
              </span>
            ) : null}
            <span>{item.prix}</span>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={onAdd}
            className="rounded-full bg-[var(--ochre)] px-5 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(194,97,15,.20)] hover:bg-[#a6500c] disabled:cursor-not-allowed disabled:bg-[var(--wood)]/25 disabled:text-[var(--wood)]/60 disabled:shadow-none"
          >
            {item.rupture ? 'Indisponible' : disableAdd ? 'Hors ligne' : 'Panier'}
          </button>
        </div>
      </div>
    </article>
  );
}

function CataloguePageInner() {
  const { addItem } = useCart();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const estAdmin = !authLoading && user?.role === 'admin';

  // L'admin n'utilise pas le catalogue client : retour vers la gestion des plats
  useEffect(() => {
    if (estAdmin) router.replace('/admin-plats');
  }, [estAdmin, router]);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CatalogueItem[]>(fallback);
  /** Données réelles API vs jeu local de démonstration */
  const [dataSource, setDataSource] = useState<'api' | 'fallback'>('fallback');
  const [apiTotalPages, setApiTotalPages] = useState(1);
  const [apiTotalCount, setApiTotalCount] = useState(0);

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('pertinence');

  const [region, setRegion] = useState<string>('Toutes');
  const [categorie, setCategorie] = useState<string>('Toutes');

  useEffect(() => {
    const rawCat = searchParams.get('categorie');
    const rawPays = searchParams.get('pays') ?? searchParams.get('region');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (rawCat) setCategorie(decodeURIComponent(rawCat));
    if (rawPays) setRegion(decodeURIComponent(rawPays));
  }, [searchParams]);
  const [noteMin, setNoteMin] = useState<number>(0);
  const [prixMin, setPrixMin] = useState<number>(0);
  const [prixMax, setPrixMax] = useState<number>(250);
  const [pricePreset, setPricePreset] = useState<PricePresetId>('all');

  const [regionsOptions, setRegionsOptions] = useState<string[]>(['Toutes']);
  const [categoriesOptions, setCategoriesOptions] = useState<string[]>(['Toutes']);

  const [page, setPage] = useState(1);
  const pageSize = 9;

  useEffect(() => {
    let cancelled = false;
    fetchCategories()
      .then((res) => {
        if (cancelled) return;
        if (!res.success || !res.data) return;
        const cats = (res.data.categories || []).map((c) => c.categorie).filter(Boolean);
        const pays = (res.data.pays || []).map((p) => p.pays).filter(Boolean);
        setCategoriesOptions(['Toutes', ...Array.from(new Set(cats))]);
        setRegionsOptions(['Toutes', ...Array.from(new Set(pays))]);
      })
      .catch(() => {})
      .finally(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    const triBackend =
      sort === 'pertinence'
        ? 'populaire'
        : sort === 'nouveau'
          ? 'nouveau'
          : sort === 'prix-asc'
            ? 'prix-asc'
            : 'prix-desc';

    fetchPlats({
      page,
      limite: pageSize,
      pays: region !== 'Toutes' ? region : undefined,
      categorie: categorie !== 'Toutes' ? categorie : undefined,
      recherche: query.trim() ? query.trim() : undefined,
      tri: triBackend,
      prixMin: prixMin > 0 ? prixMin : undefined,
      prixMax: prixMax < 250 ? prixMax : undefined,
      noteMin: noteMin > 0 ? noteMin : undefined,
    })
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data && Array.isArray(res.data.plats)) {
          const list = res.data.plats.map(platToItem);
          setItems(list);
          setDataSource('api');
          const pag = res.pagination as
            | { totalPages?: number; totalPlats?: number }
            | undefined;
          setApiTotalPages(Math.max(1, pag?.totalPages ?? 1));
          setApiTotalCount(typeof pag?.totalPlats === 'number' ? pag.totalPlats : list.length);
          return;
        }
        setItems(fallback);
        setDataSource('fallback');
        setApiTotalPages(Math.max(1, Math.ceil(fallback.length / pageSize)));
        setApiTotalCount(fallback.length);
      })
      .catch(() => {
        setItems(fallback);
        setDataSource('fallback');
        setApiTotalPages(Math.max(1, Math.ceil(fallback.length / pageSize)));
        setApiTotalCount(fallback.length);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, sort, region, categorie, query, prixMin, prixMax, noteMin]);

  const filteredClient = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matchText = (it: CatalogueItem) => {
      if (!q) return true;
      return `${it.nom} ${it.origine} ${it.categorie}`.toLowerCase().includes(q);
    };

    if (dataSource === 'fallback') {
      return items
        .filter((it) => (region === 'Toutes' ? true : it.pays === region))
        .filter((it) => (categorie === 'Toutes' ? true : it.categorie === categorie))
        .filter((it) => it.note >= noteMin)
        .filter((it) => it.prixUnitaire >= prixMin && it.prixUnitaire <= prixMax)
        .filter(matchText);
    }

    // API : pays / catégorie / tri / recherche / filtres prix & note déjà appliqués côté serveur.
    // Affinage sur le prix affiché (promo) et la note, recherche textuelle locale.
    return items
      .filter((it) => it.prixUnitaire >= prixMin && it.prixUnitaire <= prixMax)
      .filter((it) => it.note >= noteMin)
      .filter(matchText);
  }, [items, dataSource, region, categorie, noteMin, prixMin, prixMax, query]);

  const totalPages = useMemo(() => {
    if (dataSource === 'fallback') {
      return Math.max(1, Math.ceil(filteredClient.length / pageSize));
    }
    return apiTotalPages;
  }, [dataSource, filteredClient.length, pageSize, apiTotalPages]);

  const visibleClient = useMemo(() => {
    if (dataSource === 'fallback') {
      const start = (page - 1) * pageSize;
      return filteredClient.slice(start, start + pageSize);
    }
    return filteredClient;
  }, [filteredClient, dataSource, page]);

  const resultCountLabel = useMemo(() => {
    if (loading) return '…';
    if (dataSource === 'api') {
      return String(apiTotalCount);
    }
    return String(filteredClient.length);
  }, [loading, dataSource, apiTotalCount, filteredClient.length]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [region, categorie, noteMin, prixMin, prixMax, sort, query]);

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const applyPricePreset = useCallback((id: Exclude<PricePresetId, 'custom'>) => {
    const p = PRICE_PRESETS.find((x) => x.id === id);
    if (!p) return;
    setPricePreset(id);
    setPrixMin(p.min);
    setPrixMax(p.max);
  }, []);

  const setPrixMinManual = useCallback((v: number) => {
    setPricePreset('custom');
    const next = clamp(v, 0, 250);
    setPrixMin(next);
    setPrixMax((max) => (next > max ? next : max));
  }, []);

  const setPrixMaxManual = useCallback((v: number) => {
    setPricePreset('custom');
    const next = clamp(v, 0, 250);
    setPrixMax(next);
    setPrixMin((min) => (next < min ? next : min));
  }, []);

  const resetFilters = () => {
    setRegion('Toutes');
    setCategorie('Toutes');
    setPricePreset('all');
    setPrixMin(0);
    setPrixMax(250);
    setNoteMin(0);
    setQuery('');
    setSort('pertinence');
    setPage(1);
  };

  if (estAdmin) return null;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--ivory)] text-[var(--wood)]">
      <Header />
      <main className="flex-grow">
        <div className="mx-auto w-full max-w-[1400px] px-6 py-10 lg:px-12">
          <div className="mb-8">
            <h1 className="font-title text-5xl tracking-tight lg:text-6xl">
              Catalogue
              <span className="block text-[var(--ochre)]">Afro-food</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-[var(--wood)]/75 lg:text-base">
              Plats camerounais et béninois, boissons et spécialités : filtrez par région, catégorie ou budget.
            </p>
            {user && (
              <div className="mt-4">
                <InstallButton />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
            {/* Sidebar filtres */}
            <aside className="lg:w-[340px]">
              <div className="rounded-[28px] border border-[var(--wood)]/10 bg-white/55 p-6 shadow-sm backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-[var(--wood)]/65">Filtres</p>
                    <h2 className="font-title mt-1 text-3xl">Affiner</h2>
                  </div>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="rounded-full border border-[var(--wood)]/15 bg-white/40 px-4 py-2 text-xs font-semibold text-[var(--wood)]/80 hover:bg-white/55"
                  >
                    Réinitialiser
                  </button>
                </div>

                <div className="mt-6 space-y-6">
                  <fieldset className="space-y-3 rounded-2xl border border-[var(--wood)]/12 bg-[color:rgba(139,58,42,.06)] p-4">
                    <legend className="px-1 font-title text-lg text-[var(--wood)]">Région × Catégorie</legend>
                    <p className="text-xs leading-relaxed text-[var(--wood)]/70">
                      Combine pays d’origine et type de produit pour cibler le catalogue, puis affine le budget
                      ci-dessous.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="grid gap-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--wood)]/70">
                          Région (pays)
                        </span>
                        <select
                          value={region}
                          onChange={(e) => setRegion(e.target.value)}
                          className="w-full cursor-pointer rounded-2xl border border-[var(--wood)]/12 bg-white px-3 py-3 text-sm font-medium text-[var(--wood)] outline-none focus:border-[var(--ochre)]/45 focus:ring-2 focus:ring-[color:rgba(194,97,15,.15)]"
                        >
                          {regionsOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1.5">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--wood)]/70">
                          Catégorie
                        </span>
                        <select
                          value={categorie}
                          onChange={(e) => setCategorie(e.target.value)}
                          className="w-full cursor-pointer rounded-2xl border border-[var(--wood)]/12 bg-white px-3 py-3 text-sm font-medium text-[var(--wood)] outline-none focus:border-[var(--ochre)]/45 focus:ring-2 focus:ring-[color:rgba(194,97,15,.15)]"
                        >
                          {categoriesOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </fieldset>

                  <div>
                    <p className="text-sm font-semibold text-[var(--wood)]">Budget (prix)</p>
                    <p className="mt-1 text-xs text-[var(--wood)]/65">
                      Tranches rapides ou min / max au euro près.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {PRICE_PRESETS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => applyPricePreset(p.id)}
                          className={[
                            'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                            pricePreset === p.id
                              ? 'border-[var(--ochre)]/40 bg-[color:rgba(194,97,15,.14)] text-[var(--wood)]'
                              : 'border-[var(--wood)]/12 bg-white/50 text-[var(--wood)]/85 hover:bg-white/70',
                          ].join(' ')}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <label className="text-xs text-[var(--wood)]/70">
                        Min (€)
                        <input
                          type="number"
                          inputMode="decimal"
                          value={prixMin}
                          min={0}
                          max={250}
                          onChange={(e) =>
                            setPrixMinManual(clamp(Number(e.target.value || 0), 0, 250))
                          }
                          className="mt-2 w-full rounded-2xl border border-[var(--wood)]/10 bg-white/45 px-4 py-3 text-sm text-[var(--wood)] outline-none focus:border-[var(--ochre)]/45"
                        />
                      </label>
                      <label className="text-xs text-[var(--wood)]/70">
                        Max (€)
                        <input
                          type="number"
                          inputMode="decimal"
                          value={prixMax}
                          min={0}
                          max={250}
                          onChange={(e) =>
                            setPrixMaxManual(clamp(Number(e.target.value || 0), 0, 250))
                          }
                          className="mt-2 w-full rounded-2xl border border-[var(--wood)]/10 bg-white/45 px-4 py-3 text-sm text-[var(--wood)] outline-none focus:border-[var(--ochre)]/45"
                        />
                      </label>
                    </div>
                    {pricePreset === 'custom' && (
                      <p className="mt-2 text-[11px] text-[var(--wood)]/55">Fourchette personnalisée</p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[var(--wood)]">Note</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[0, 4, 4.5, 4.7].map((n) => (
                        <Chip key={n} active={noteMin === n} onClick={() => setNoteMin(n)}>
                          <span>{n === 0 ? 'Toutes' : `≥ ${n}`}</span>
                        </Chip>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </aside>

            {/* Zone catalogue */}
            <section className="flex-1">
              {/* Barre recherche + tri */}
              <div className="rounded-[28px] border border-[var(--wood)]/10 bg-white/55 p-6 shadow-sm backdrop-blur">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="relative w-full lg:max-w-[520px]">
                    <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--wood)]/45">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M21 21l-4.35-4.35m1.35-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Rechercher un produit, une origine, une catégorie…"
                      className="w-full rounded-2xl border border-[var(--wood)]/10 bg-white/45 py-3 pl-11 pr-4 text-sm text-[var(--wood)] outline-none focus:border-[var(--ochre)]/45"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-[var(--wood)]/70">Trier</label>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortKey)}
                      className="rounded-2xl border border-[var(--wood)]/10 bg-white/45 px-4 py-3 text-sm text-[var(--wood)] outline-none focus:border-[var(--ochre)]/45"
                    >
                      <option value="pertinence">Pertinence</option>
                      <option value="prix-asc">Prix (croissant)</option>
                      <option value="prix-desc">Prix (décroissant)</option>
                      <option value="nouveau">Nouveauté</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--wood)]/65">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[var(--wood)]/10 bg-white/35 px-3 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--brick)]" />
                    {loading ? 'Chargement…' : `${resultCountLabel} résultat(s)`}
                  </span>
                  {dataSource === 'fallback' && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-900">
                      Mode hors-ligne — panier désactivé (API indisponible)
                    </span>
                  )}
                </div>
              </div>

              {/* Grille produits */}
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                {loading ? (
                  Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)
                ) : visibleClient.length ? (
                  visibleClient.map((it) => (
                    <ProductCard
                      key={it.id}
                      item={it}
                      onAdd={() => {
                        if (dataSource === 'fallback' || it.id.startsWith('fallback-')) {
                          return;
                        }
                        addItem({
                          id: it.id,
                          nom: it.nom,
                          prixUnitaire: it.prixUnitaire,
                          image: it.image,
                          quantiteMax: it.quantiteMax,
                        });
                      }}
                      disableAdd={dataSource === 'fallback' || it.id.startsWith('fallback-')}
                    />
                  ))
                ) : (
                  <div className="col-span-full rounded-[28px] border border-[var(--wood)]/10 bg-white/55 p-10 text-center backdrop-blur">
                    <p className="font-title text-3xl">Aucun résultat</p>
                    <p className="mt-2 text-sm text-[var(--wood)]/70">
                      Essaie de réduire les filtres ou de changer la recherche.
                    </p>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-6 rounded-full bg-[var(--ochre)] px-6 py-3 text-sm font-semibold text-white hover:bg-[#a6500c]"
                    >
                      Réinitialiser les filtres
                    </button>
                  </div>
                )}
              </div>

              {/* Pagination */}
              <div className="mt-10 flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-xs text-[var(--wood)]/65">
                  Page <span className="font-semibold text-[var(--wood)]">{page}</span> /{' '}
                  <span className="font-semibold text-[var(--wood)]">{totalPages}</span>
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={!hasPrev || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-full border border-[var(--wood)]/15 bg-white/40 px-5 py-2 text-sm font-semibold text-[var(--wood)] disabled:opacity-40"
                  >
                    Précédent
                  </button>
                  <div className="hidden items-center gap-2 sm:flex">
                    {visiblePageNumbers(page, totalPages, 5).map((n) => (
                      <button
                        key={`page-${n}`}
                        type="button"
                        onClick={() => setPage(n)}
                        disabled={loading}
                        className={[
                          'h-10 w-10 rounded-full border text-sm font-semibold',
                          n === page
                            ? 'border-[var(--ochre)]/35 bg-[color:rgba(194,97,15,.12)] text-[var(--wood)]'
                            : 'border-[var(--wood)]/15 bg-white/40 text-[var(--wood)] hover:bg-white/55',
                        ].join(' ')}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={!hasNext || loading}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-full bg-[var(--wood)] px-5 py-2 text-sm font-semibold text-[var(--ivory)] disabled:opacity-40"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
      <AvisClients />
      <Footer />
    </div>
  );
}

export default function CataloguePage() {
  return (
    <Suspense fallback={null}>
      <CataloguePageInner />
    </Suspense>
  );
}
