/**
 * Service pour la gestion des commandes (admin)
 */

import { apiGet, apiPatch } from '@/lib/api';

export interface CommandeApiArticle {
  _id?: string;
  plat?: { _id: string; nom?: string };
  informationsPlat: { nom: string; prix: number };
  quantite: number;
  prixUnitaire: number;
  sousTotal: number;
}

export interface CommandeApi {
  _id: string;
  numeroCommande: string;
  client?: { _id: string; nom?: string; prenom?: string; email?: string; telephone?: string };
  informationsClient: { nom: string; prenom: string; email: string; telephone: string };
  adresseLivraison?: {
    nom: string;
    adresse: string;
    ville: string;
    codePostal: string;
    pays?: string;
    complementAdresse?: string;
    instructions?: string;
  };
  articles: CommandeApiArticle[];
  montants: { total: number; sousTotal?: number; fraisLivraison?: number };
  statut: string;
  paiement?: { methode: string };
  dates?: { commande?: string; livraison?: string };
  livraison?: { heureEstimee?: string };
  createdAt?: string;
  preferences?: { instructions?: string };
}

/** Format pour l'affichage admin */
export interface CommandeAdmin {
  id: string;
  numeroCommande: string;
  client: {
    nom: string;
    email: string;
    telephone: string;
    adresse: string;
  };
  plats: Array<{ id: string; nom: string; quantite: number; prix: number }>;
  statut: string;
  montantTotal: number;
  dateCommande: string;
  dateEstimeeLivraison: string;
  modePaiement: string;
  notes?: string;
}

function mapApiToAdmin(c: CommandeApi): CommandeAdmin {
  const nomComplet =
    c.informationsClient?.nom && c.informationsClient?.prenom
      ? `${c.informationsClient.nom} ${c.informationsClient.prenom}`
      : c.informationsClient?.nom || c.client?.nom || '—';
  const adresse = c.adresseLivraison
    ? [
        c.adresseLivraison.adresse,
        c.adresseLivraison.codePostal,
        c.adresseLivraison.ville,
        c.adresseLivraison.pays || 'France'
      ]
        .filter(Boolean)
        .join(', ')
    : '—';
  const dateCommande =
    c.dates?.commande || (c as unknown as { createdAt?: string }).createdAt || new Date().toISOString();
  const dateEstimee = c.livraison?.heureEstimee || dateCommande;

  return {
    id: c._id,
    numeroCommande: c.numeroCommande || `CMD-${c._id.slice(-6)}`,
    client: {
      nom: nomComplet,
      email: c.informationsClient?.email || c.client?.email || '',
      telephone: c.informationsClient?.telephone || c.client?.telephone || '',
      adresse
    },
    plats: (c.articles || []).map((a, i) => ({
      id: (a.plat as { _id?: string })?._id || `art-${i}`,
      nom: a.informationsPlat?.nom || 'Plat',
      quantite: a.quantite || 1,
      prix: a.prixUnitaire ?? a.informationsPlat?.prix ?? 0
    })),
    statut: c.statut || 'en_attente',
    montantTotal: c.montants?.total ?? 0,
    dateCommande,
    dateEstimeeLivraison: dateEstimee,
    modePaiement: c.paiement?.methode || 'especes',
    notes: c.preferences?.instructions
  };
}

export async function getCommandes(params: {
  page?: number;
  limite?: number;
  statut?: string;
  dateDebut?: string;
  dateFin?: string;
  numeroCommande?: string;
}): Promise<{ commandes: CommandeAdmin[]; pagination?: { totalCommandes: number; totalPages: number }; error?: string }> {
  const search = new URLSearchParams();
  if (params.page != null) search.set('page', String(params.page));
  if (params.limite != null) search.set('limite', String(params.limite));
  if (params.statut) search.set('statut', params.statut);
  if (params.dateDebut) search.set('dateDebut', params.dateDebut);
  if (params.dateFin) search.set('dateFin', params.dateFin);
  if (params.numeroCommande) search.set('numeroCommande', params.numeroCommande);
  const query = search.toString();
  const res = await apiGet<{ commandes: CommandeApi[] }>(`/api/commandes${query ? `?${query}` : ''}`);
  if (!res.success || !res.data) {
    return {
      commandes: [],
      error: res.message || 'Impossible de charger les commandes (accès admin requis).',
    };
  }
  const data = res.data as { commandes?: CommandeApi[] };
  const list = Array.isArray(data.commandes) ? data.commandes : [];
  const commandes = list.map(mapApiToAdmin);
  const pagination = (res as { pagination?: { totalCommandes: number; totalPages: number } }).pagination;
  return { commandes, pagination };
}

export async function updateStatut(
  commandeId: string,
  statut: string
): Promise<{ success: boolean; error?: string }> {
  const res = await apiPatch<{ commande: CommandeApi }>(
    `/api/commandes/${commandeId}/statut`,
    { statut }
  );
  return { success: res.success === true, error: res.success ? undefined : res.message };
}
