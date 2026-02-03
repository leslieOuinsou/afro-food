/**
 * Service Plats - Appels API vers le backend
 */

import { apiGet, ApiResponse } from '@/lib/api';

export type Plat = {
  _id: string;
  nom: string;
  description: string;
  prix: number;
  prixPromo?: number;
  categorie: string;
  images?: { principale: string; galerie?: string[] };
  origineAfricaine?: { pays: string; region?: string };
  disponible?: boolean;
  notemoyenne?: number;
  nombreCommandes?: number;
  slug?: string;
};

export type PlatsFilters = {
  page?: number;
  limite?: number;
  categorie?: string;
  pays?: string;
  recherche?: string;
  tri?: 'populaire' | 'prix-asc' | 'prix-desc' | 'nom' | 'note' | 'nouveau';
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

  const query = params.toString();
  const endpoint = query ? `/api/plats?${query}` : '/api/plats';
  return apiGet(endpoint);
}

/**
 * Récupère un plat par ID
 */
export async function fetchPlatById(id: string): Promise<ApiResponse<Plat>> {
  return apiGet<Plat>(`/api/plats/${id}`);
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
