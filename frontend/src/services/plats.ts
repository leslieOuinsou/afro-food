/**
 * Service Plats - Appels API vers le backend
 */

import { apiGet, ApiResponse } from '@/lib/api';

export type Plat = {
  _id: string;
  nom: string;
  description: string;
  descriptionLongue?: string;
  prix: number;
  prixPromo?: number;
  categorie: string;
  images?: { principale: string; galerie?: string[] };
  origineAfricaine?: { pays: string; region?: string };
  disponible?: boolean;
  /** true = indisponible à la vente */
  enRupture?: boolean;
  /** null / undefined = stock illimité (comportement Mongo) */
  quantiteDisponible?: number | null;
  notemoyenne?: number;
  nombreCommandes?: number;
  slug?: string;
  nutrition?: {
    calories?: number;
    proteines?: number;
    glucides?: number;
    lipides?: number;
    fibres?: number;
    sodium?: number;
  };
};

/** Prix unitaire affiché (promo si valide et strictement inférieure au prix catalogue). */
export function prixUnitaireAffiche(p: Pick<Plat, 'prix' | 'prixPromo'>): number {
  const promo = p.prixPromo;
  if (promo != null && promo > 0 && promo < p.prix) return promo;
  return p.prix;
}

/**
 * Quantité maximale autorisée au panier : 0 = non vendable, null = illimité.
 */
export function quantiteMaxPourPanier(
  p: Pick<Plat, 'disponible' | 'enRupture' | 'quantiteDisponible'>
): number | null {
  if (p.disponible === false || p.enRupture) return 0;
  if (p.quantiteDisponible == null) return null;
  const n = Math.floor(Number(p.quantiteDisponible));
  if (Number.isNaN(n) || n < 0) return null;
  return n;
}

export type PlatsFilters = {
  page?: number;
  limite?: number;
  categorie?: string;
  pays?: string;
  recherche?: string;
  tri?: 'populaire' | 'prix-asc' | 'prix-desc' | 'nom' | 'note' | 'nouveau';
  /** Filtre sur le champ prix (base) — le front affine avec prix promo côté affichage */
  prixMin?: number;
  prixMax?: number;
  noteMin?: number;
};

/**
 * Récupère la liste des plats depuis l'API
 * Le backend retourne { data: { plats } }
 */
export async function fetchPlats(
  filters: PlatsFilters = {}
): Promise<ApiResponse<{ plats?: Plat[] } & Record<string, unknown>>> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limite) params.set('limite', String(filters.limite));
  if (filters.categorie) params.set('categorie', filters.categorie);
  if (filters.pays) params.set('pays', filters.pays);
  if (filters.recherche) params.set('recherche', filters.recherche);
  if (filters.tri) params.set('tri', filters.tri);
  if (filters.prixMin != null && !Number.isNaN(filters.prixMin)) {
    params.set('prixMin', String(filters.prixMin));
  }
  if (filters.prixMax != null && !Number.isNaN(filters.prixMax)) {
    params.set('prixMax', String(filters.prixMax));
  }
  if (filters.noteMin != null && !Number.isNaN(filters.noteMin) && filters.noteMin > 0) {
    params.set('noteMin', String(filters.noteMin));
  }

  const query = params.toString();
  const endpoint = query ? `/api/plats?${query}` : '/api/plats';
  return apiGet(endpoint);
}

type PlatDetailPayload = { plat: Plat; statistiquesAvis?: unknown; avisRecents?: unknown };

/**
 * Récupère un plat par ID (le backend renvoie `data: { plat, … }`).
 */
export async function fetchPlatById(id: string): Promise<ApiResponse<Plat>> {
  const res = await apiGet<PlatDetailPayload | Plat>(`/api/plats/${id}`);
  if (!res.success || res.data == null) {
    return res as ApiResponse<Plat>;
  }
  const raw = res.data as PlatDetailPayload | Plat;
  if (typeof raw === 'object' && raw !== null && 'plat' in raw && raw.plat) {
    return { ...res, data: raw.plat };
  }
  return res as ApiResponse<Plat>;
}

/**
 * Récupère les plats populaires
 */
export async function fetchPlatsPopulaires(limite = 6): Promise<ApiResponse<Plat[]>> {
  return apiGet<Plat[]>(`/api/plats/populaires/${limite}`);
}

/**
 * Récupère les nouveautés
 */
export async function fetchNouveautes(limite = 6): Promise<ApiResponse<Plat[]>> {
  return apiGet<Plat[]>(`/api/plats/nouveautes/${limite}`);
}

/**
 * Récupère les catégories disponibles
 */
export async function fetchCategories(): Promise<
  ApiResponse<{ categories: { categorie: string; nombre: number }[]; pays: { pays: string; nombre: number }[] }>
> {
  return apiGet('/api/plats/categories');
}
