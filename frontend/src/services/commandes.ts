import { apiGet, apiPost, type ApiResponse } from '@/lib/api';

export type CreateCommandePayload = {
  articles: Array<{
    platId: string;
    quantite: number;
  }>;
  adresseLivraison: {
    nom: string;
    adresse: string;
    ville: string;
    codePostal: string;
    pays?: string;
    complementAdresse?: string;
    instructions?: string;
  };
  methodePaiement: 'carte' | 'virement' | 'mobile' | 'especes';
  codePromo?: string;
  typeLivraison?: 'domicile' | 'point_relais' | 'retrait_sur_place';
  instructions?: string;
  preferences?: {
    instructions?: string;
  };
};

export type CommandeClient = {
  _id: string;
  numeroCommande: string;
  statut: string;
  montants: {
    sousTotal?: number;
    fraisLivraison?: number;
    taxes?: number;
    remise?: number;
    total: number;
  };
  createdAt?: string;
  dates?: {
    commande?: string;
  };
  articles: Array<{
    informationsPlat?: {
      nom?: string;
    };
    quantite: number;
  }>;
};

export type CommandesListPayload = {
  commandes: CommandeClient[];
};

export async function createCommande(payload: CreateCommandePayload): Promise<ApiResponse<{ commande: CommandeClient }>> {
  return apiPost<{ commande: CommandeClient }>('/api/commandes', payload);
}

export async function getMesCommandes(params?: {
  page?: number;
  limite?: number;
  statut?: string;
}): Promise<ApiResponse<CommandesListPayload>> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limite) query.set('limite', String(params.limite));
  if (params?.statut) query.set('statut', params.statut);
  const qs = query.toString();
  return apiGet<CommandesListPayload>(`/api/commandes/mes-commandes${qs ? `?${qs}` : ''}`);
}
