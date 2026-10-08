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
  client?: string | { _id?: string; id?: string };
  clientId?: string;
  codeRemise?: string;
  stripePaye?: boolean;
  virement?: { titulaire: string; iban: string; bic?: string; banque?: string; reference: string } | null;
  statutAffichage?: string;
  peutEtreAnnulee?: boolean;
  methodePaiement?: string;
  statutPaiement?: 'en_attente' | 'valide' | 'echec' | 'rembourse';
  codePromo?: string | null;
  adresseLivraison?: { nom?: string; adresse?: string; ville?: string; codePostal?: string };
  livraison?: { positionLivreur?: { lat: number; lng: number; date: string } };
  evaluation?: { note: number; commentaire?: string | null; dateEvaluation?: string } | null;
  historiqueStatut?: HistoriqueStatut[];
};

export async function evaluerCommande(
  id: string,
  note: number,
  commentaire?: string
): Promise<ApiResponse<{ commande: CommandeDetail }>> {
  return apiPost<{ commande: CommandeDetail }>(`/api/commandes/${id}/evaluer`, {
    note,
    commentaire: commentaire?.trim() || undefined,
  });
}

export async function getCommande(id: string): Promise<ApiResponse<{ commande: CommandeDetail }>> {
  return apiGet<{ commande: CommandeDetail }>(`/api/commandes/${id}`);
}

export async function annulerCommande(id: string, raison?: string): Promise<ApiResponse<{ commande: CommandeDetail }>> {
  return apiPatch<{ commande: CommandeDetail }>(`/api/commandes/${id}/annuler`, { raison });
}

export async function getMobileTest(): Promise<boolean> {
  const res = await apiGet<{ mobileTest?: boolean }>('/api/paiements/config');
  return Boolean(res.success && res.data?.mobileTest);
}

export function initierPaiementMobile(commandeId: string, operateur: string, telephone: string) {
  return apiPost<{ reference: string; montant: number }>('/api/paiements/mobile/initier', { commandeId, operateur, telephone });
}

export function confirmerPaiementMobile(commandeId: string, code: string) {
  return apiPost('/api/paiements/mobile/confirmer', { commandeId, code });
}

export async function getStripeTest(): Promise<boolean> {
  const res = await apiGet<{ stripeTest?: boolean }>('/api/paiements/config');
  return Boolean(res.success && res.data?.stripeTest);
}

export async function getConfigPaiement(): Promise<boolean> {
  const res = await apiGet<{ stripeActif: boolean }>('/api/paiements/config');
  return Boolean(res.success && res.data?.stripeActif);
}

/** Crée une session Stripe Checkout et retourne l'URL de redirection */
export async function creerSessionPaiement(commandeId: string): Promise<ApiResponse<{ url: string }>> {
  return apiPost<{ url: string }>('/api/paiements/session', { commandeId });
}

/** Télécharge la facture PDF d'une commande payée (téléchargement authentifié puis ouverture). */
export async function ouvrirFacture(commandeId: string): Promise<string | null> {
  const { API_URL } = await import('@/lib/api');
  const token = sessionStorage.getItem('afro_eats_token') || localStorage.getItem('afro_eats_token');
  const res = await fetch(`${API_URL}/api/commandes/${commandeId}/facture`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    return (d as { message?: string }).message || 'Facture indisponible pour le moment.';
  }
  const url = URL.createObjectURL(await res.blob());
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return null;
}
