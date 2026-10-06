import { apiGet, apiPost, apiPatch, type ApiResponse } from '@/lib/api';

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
    platId?: string;
    prixUnitaire?: number;
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

export async function validerCodePromo(
  code: string,
  articles: Array<{ platId: string; quantite: number }>,
  typeLivraison: 'domicile' | 'point_relais' | 'retrait_sur_place' = 'domicile'
): Promise<ApiResponse<{ code: string; remise: number; conditions: string[] }>> {
  return apiPost<{ code: string; remise: number; conditions: string[] }>('/api/commandes/promo/valider', {
    code,
    articles,
    typeLivraison,
  });
}

export type HistoriqueStatut = {
  _id?: string;
  statut: string;
  dateChangement: string;
  commentaire?: string | null;
};

export type CommandeDetail = CommandeClient & {
  statutAffichage?: string;
  peutEtreAnnulee?: boolean;
  methodePaiement?: string;
  statutPaiement?: 'en_attente' | 'valide' | 'echec' | 'rembourse';
  codePromo?: string | null;
  adresseLivraison?: { nom?: string; adresse?: string; ville?: string; codePostal?: string };
  livraison?: { positionLivreur?: { lat: number; lng: number; date: string } };
  historiqueStatut?: HistoriqueStatut[];
};

export async function getCommande(id: string): Promise<ApiResponse<{ commande: CommandeDetail }>> {
  return apiGet<{ commande: CommandeDetail }>(`/api/commandes/${id}`);
}

export async function annulerCommande(id: string, raison?: string): Promise<ApiResponse<{ commande: CommandeDetail }>> {
  return apiPatch<{ commande: CommandeDetail }>(`/api/commandes/${id}/annuler`, { raison });
}

export async function getConfigPaiement(): Promise<boolean> {
  const res = await apiGet<{ stripeActif: boolean }>('/api/paiements/config');
  return Boolean(res.success && res.data?.stripeActif);
}

/** Crée une session Stripe Checkout et retourne l'URL de redirection */
export async function creerSessionPaiement(commandeId: string): Promise<ApiResponse<{ url: string }>> {
  return apiPost<{ url: string }>('/api/paiements/session', { commandeId });
}
