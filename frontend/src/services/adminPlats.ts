/**
 * Service Admin Plats - Créer, modifier, supprimer des plats via l'API backend
 * En développement : utilise /api/plats/dev (sans auth)
 * En production : utilise /api/plats (avec token admin)
 */

import { apiGet, apiPost, apiPut, apiDelete, ApiResponse } from '@/lib/api';
import { isAuthenticated } from './auth';
import type { Plat } from './plats';

const getUseDevRoutes = () => {
  if (typeof window === 'undefined') return false;
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  return url.includes('localhost') && !isAuthenticated();
};

function platEndpoint(id?: string): string {
  const base = '/api/plats';
  if (getUseDevRoutes()) {
    return id ? `${base}/dev/${id}` : `${base}/dev`;
  }
  return id ? `${base}/${id}` : base;
}

/** Catégories affichage → slug backend */
export const categorieToSlug: Record<string, string> = {
  'Plats Principaux': 'plats-principaux',
  'Accompagnements': 'accompagnements',
  'Boissons': 'boissons',
  'Desserts': 'desserts',
  'Spécialités Africaines': 'specialites-africaines',
  'Végétarien': 'vegetarien',
  'Entrées': 'entrees',
  'Vegan': 'vegan'
};

/** Slug backend → affichage */
export const slugToCategorie: Record<string, string> = {
  'plats-principaux': 'Plats Principaux',
  'accompagnements': 'Accompagnements',
  'boissons': 'Boissons',
  'desserts': 'Desserts',
  'specialites-africaines': 'Spécialités Africaines',
  'vegetarien': 'Végétarien',
  'entrees': 'Entrées',
  'vegan': 'Vegan'
};

/** Convertir prix "18,50 €" ou "18.50" en number */
export function parsePrix(prix: string): number {
  const cleaned = prix.replace(/[^\d,.]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

export type PlatFormData = {
  nom: string;
  description: string;
  prix: string;
  categorie: string;
  image: string;
  pays?: string;
};

/** Corps envoyé au backend pour créer/mettre à jour un plat */
function formToBody(form: PlatFormData) {
  const slug = categorieToSlug[form.categorie] || 'plats-principaux';
  return {
    nom: form.nom.trim(),
    description: form.description.trim(),
    prix: parsePrix(form.prix),
    categorie: slug,
    images: {
      principale: form.image || undefined
    },
    origineAfricaine: {
      pays: form.pays || 'cameroun',
      traditionnel: true
    },
    disponible: true
  };
}

/** Charger la liste des plats (admin) */
export async function fetchPlatsAdmin(): Promise<ApiResponse<{ plats?: Plat[] }>> {
  return apiGet('/api/plats?limite=100');
}

/** Créer un plat */
export async function createPlat(form: PlatFormData): Promise<ApiResponse<{ plat?: Plat }>> {
  const body = formToBody(form);
  return apiPost(platEndpoint(), body);
}

/** Mettre à jour un plat */
export async function updatePlat(id: string, form: PlatFormData): Promise<ApiResponse<{ plat?: Plat }>> {
  const body = formToBody(form);
  return apiPut(platEndpoint(id), body);
}

/** Supprimer un plat */
export async function deletePlat(id: string): Promise<ApiResponse<unknown>> {
  return apiDelete(platEndpoint(id));
}
