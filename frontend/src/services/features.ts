import { apiGet, apiPatch, apiPost, type ApiResponse } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const getFileCuisine = () =>
  apiGet<{ file: Array<Record<string, unknown>> }>('/api/cuisine/file');

export const avancerCuisine = (id: string, statut: 'en_preparation' | 'prete') =>
  apiPatch(`/api/cuisine/${id}/statut`, { statut });

export const getChat = (commandeId: string) =>
  apiGet<{
    conversationId: string;
    messages: Array<{ id: string; corps: string; createdAt: string; auteur: { prenom: string; role: string } }>;
  }>(`/api/chat/${commandeId}`);

export const postChat = (commandeId: string, corps: string) =>
  apiPost(`/api/chat/${commandeId}`, { corps });

export const creerGroupe = () => apiPost<{ id: string; code: string; expireLe: string }>('/api/groupe', {});

export const getGroupe = (code: string) =>
  apiGet<{
    id: string;
    code: string;
    statut: string;
    hote: { prenom: string; nom: string };
    articles: Array<{ nom: string; nomPlat: string; quantite: number; prixUnitaire: number; platId: string }>;
    expireLe: string;
  }>(`/api/groupe/${code}`);

export const ajouterAuGroupe = (code: string, platId: string, quantite = 1, nom?: string) =>
  apiPost(`/api/groupe/${code}/articles`, { platId, quantite, nom });

export const fermerGroupe = (code: string) =>
  apiPost<{ articlesCheckout: Array<{ platId: string; quantite: number; nomPlat: string }>; code: string }>(
    `/api/groupe/${code}/fermer`,
    {}
  );

export const getParrainage = () =>
  apiGet<{ code: string; filleuls: number; lien: string; recompenseFilleul: string; recompenseParrain: string }>(
    '/api/parrainage'
  );

export const getMonAbonnement = () => apiGet<{ abonnement: Record<string, unknown> | null }>('/api/abonnements/moi');

export const creerAbonnement = (payload: { frequence?: string; tailleBox?: number }) =>
  apiPost('/api/abonnements', payload);

export const majAbonnement = (id: string, payload: Record<string, unknown>) =>
  apiPatch(`/api/abonnements/${id}`, payload);

export const getRecettes = () => apiGet<{ recettes: Array<Record<string, unknown>> }>('/api/recettes');

export const getRecette = (slug: string) =>
  apiGet<{ recette: Record<string, unknown>; plat: Record<string, unknown> | null }>(`/api/recettes/${slug}`);

export const getRecommandations = (platId?: string) =>
  apiGet<{ plats: Array<Record<string, unknown>> }>(
    `/api/recommandations${platId ? `?platId=${encodeURIComponent(platId)}` : ''}`
  );

export const getAlertesStock = () =>
  apiGet<{ alertes: Array<Record<string, unknown>> }>('/api/stock/alertes');

export const traiterAlerteStock = (id: string) => apiPost(`/api/stock/alertes/${id}/traiter`, {});

/** SSE : retourne une fonction de cleanup. EventSource + cookies ; polling reste le fallback. */
export function ouvrirFlux(canal: string, onUpdate: (data: unknown) => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const url = `${API_URL}/api/events/stream?canal=${encodeURIComponent(canal)}`;
  const es = new EventSource(url, { withCredentials: true });
  es.addEventListener('update', (ev) => {
    try {
      onUpdate(JSON.parse((ev as MessageEvent).data));
    } catch {
      /* ignore */
    }
  });
  return () => es.close();
}

export type { ApiResponse };
