import { apiGet, apiPatch, apiPost, type ApiResponse } from '@/lib/api';

export type AvisItem = {
  _id: string;
  note: number;
  titre?: string;
  commentaire: string;
  recommande?: boolean;
  statut: 'en_attente' | 'approuve' | 'rejete' | 'signale';
  createdAt: string;
  utile?: number;
  pasUtile?: number;
  utilisateur?: {
    _id?: string;
    nom?: string;
    prenom?: string;
    avatar?: string;
  };
  plat?: {
    _id?: string;
    nom?: string;
    images?: { principale?: string };
  };
  commande?: {
    _id?: string;
    numeroCommande?: string;
  };
};

export type AvisStatistiques = {
  nombreTotal: number;
  noteMoyenne: number;
  repartitionNotes: Record<number, number>;
  pourcentageRecommandation: number;
};

export type CreerAvisPayload = {
  platId: string;
  commandeId: string;
  note: number;
  titre?: string;
  commentaire: string;
  recommande: boolean;
};

export async function getAvisByPlat(
  platId: string,
  params?: { page?: number; limite?: number; tri?: 'recent' | 'ancien' | 'note_desc' | 'note_asc' | 'utile' }
): Promise<ApiResponse<{ avis: AvisItem[]; statistiques?: AvisStatistiques }>> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limite) query.set('limite', String(params.limite));
  if (params?.tri) query.set('tri', params.tri);
  const qs = query.toString();
  return apiGet<{ avis: AvisItem[]; statistiques?: AvisStatistiques }>(
    `/api/avis/plat/${platId}${qs ? `?${qs}` : ''}`
  );
}

export async function getMesAvis(params?: {
  page?: number;
  limite?: number;
  tri?: 'recent' | 'ancien' | 'note_desc' | 'note_asc';
  statut?: 'en_attente' | 'approuve' | 'rejete' | 'signale';
}): Promise<ApiResponse<{ avis: AvisItem[] }>> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limite) query.set('limite', String(params.limite));
  if (params?.tri) query.set('tri', params.tri);
  if (params?.statut) query.set('statut', params.statut);
  const qs = query.toString();
  return apiGet<{ avis: AvisItem[] }>(`/api/avis/mes-avis${qs ? `?${qs}` : ''}`);
}

export async function createAvis(payload: CreerAvisPayload): Promise<ApiResponse<{ avis: AvisItem }>> {
  return apiPost<{ avis: AvisItem }>('/api/avis', payload);
}

export async function voterAvis(id: string, vote: 'utile' | 'pas_utile'): Promise<ApiResponse> {
  return apiPost(`/api/avis/${id}/voter`, { vote });
}

export async function signalerAvis(
  id: string,
  raison: 'contenu_inapproprie' | 'spam' | 'faux_avis' | 'langage_offensant' | 'hors_sujet' | 'autre',
  description?: string
): Promise<ApiResponse> {
  return apiPost(`/api/avis/${id}/signaler`, { raison, description });
}

export async function modererAvis(
  id: string,
  statut: 'approuve' | 'rejete',
  raisonRejet?: string
): Promise<ApiResponse<{ avis: AvisItem }>> {
  return apiPatch<{ avis: AvisItem }>(`/api/avis/${id}/moderer`, { statut, raisonRejet });
}
