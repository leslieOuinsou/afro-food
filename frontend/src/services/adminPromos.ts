/**
 * Service admin : CRUD des codes promo
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '@/lib/api';

export type TypeRemise = 'pourcentage' | 'fixe' | 'livraison';

export interface PromoCode {
  _id: string;
  code: string;
  description?: string | null;
  typeRemise: TypeRemise;
  valeur: number;
  montantMax?: number | null;
  montantMinimum?: number | null;
  usageParClient?: number | null;
  premiereCommandeSeulement: boolean;
  categories: string[];
  actif: boolean;
  dateDebut: string;
  dateFin?: string | null;
  utilisationsMax?: number | null;
  utilisations: number;
  createdAt: string;
}

export type PromoInput = {
  code: string;
  description?: string;
  typeRemise: TypeRemise;
  valeur: number;
  montantMax?: number | null;
  montantMinimum?: number | null;
  usageParClient?: number | null;
  premiereCommandeSeulement?: boolean;
  categories?: string[];
  actif?: boolean;
  dateDebut?: string | null;
  dateFin?: string | null;
  utilisationsMax?: number | null;
};

type Result<T> = { data?: T; error?: string };

export async function getPromos(params?: { actif?: boolean; recherche?: string }): Promise<Result<PromoCode[]>> {
  const search = new URLSearchParams();
  if (params?.actif != null) search.set('actif', String(params.actif));
  if (params?.recherche) search.set('recherche', params.recherche);
  const query = search.toString();
  const res = await apiGet<{ promos: PromoCode[] }>(`/api/promos${query ? `?${query}` : ''}`);
  if (!res.success) return { error: res.message || 'Erreur lors du chargement des codes promo.' };
  return { data: res.data?.promos ?? [] };
}

export async function createPromo(input: PromoInput): Promise<Result<PromoCode>> {
  const res = await apiPost<{ promo: PromoCode }>('/api/promos', input);
  if (!res.success) return { error: res.message || 'Création impossible.' };
  return { data: res.data?.promo };
}

export async function updatePromo(id: string, input: Partial<PromoInput>): Promise<Result<PromoCode>> {
  const res = await apiPut<{ promo: PromoCode }>(`/api/promos/${id}`, input);
  if (!res.success) return { error: res.message || 'Mise à jour impossible.' };
  return { data: res.data?.promo };
}

export async function togglePromo(id: string): Promise<Result<PromoCode>> {
  const res = await apiPatch<{ promo: PromoCode }>(`/api/promos/${id}/actif`);
  if (!res.success) return { error: res.message || 'Changement impossible.' };
  return { data: res.data?.promo };
}

export async function deletePromo(id: string): Promise<Result<true>> {
  const res = await apiDelete<unknown>(`/api/promos/${id}`);
  if (!res.success) return { error: res.message || 'Suppression impossible.' };
  return { data: true };
}
