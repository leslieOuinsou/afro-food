import { apiGet, apiPost } from '@/lib/api';

export type LigneCaisse = {
  _id: string;
  numeroCommande: string;
  total: number;
  encaisse: number;
  ecart: number;
  raisonEcart?: string | null;
  encaisseLe: string;
  enAttenteValidation?: boolean;
};

export type Synthese = {
  solde: number;
  nbCommandes: number;
  plusAncien: string | null;
  ageHeures: number;
  alerte: boolean;
  plafondAtteint: boolean;
};

export type SoldeLivreur = Synthese & {
  livreur: { _id: string; nom: string; prenom: string; telephone?: string };
  commandes: LigneCaisse[];
};

export const getSoldes = () =>
  apiGet<{ livreurs: SoldeLivreur[]; plafond: number; delaiAlerteHeures: number; totalARecevoir: number }>(
    '/api/caisse/livreurs'
  );

export const getMonSolde = () =>
  apiGet<Synthese & { plafond: number; commandes: LigneCaisse[] }>('/api/caisse/mon-solde');

export const creerReversement = (livreurId: string, commandeIds: string[], note?: string) =>
  apiPost('/api/caisse/reversements', { livreurId, commandeIds, note });

export const annulerReversement = (id: string, motif: string) =>
  apiPost(`/api/caisse/reversements/${id}/annuler`, { motif });

export type Reversement = {
  id: string;
  montant: number;
  note?: string | null;
  annuleLe?: string | null;
  createdAt: string;
  livreur: { nom: string; prenom: string };
  admin?: { nom: string; prenom: string } | null;
  statut: 'en_attente' | 'valide' | 'refuse';
  motifRefus?: string | null;
  commandes: { numeroCommande: string }[];
};
export const getReversements = () => apiGet<{ reversements: Reversement[] }>('/api/caisse/reversements');

export type LigneJournal = {
  id: string;
  type: 'encaissement' | 'reversement' | 'annulation_reversement' | 'remise_declaree' | 'remise_refusee';
  montant: number;
  note?: string | null;
  createdAt: string;
  livreur: { nom: string; prenom: string };
  auteur: { nom: string; prenom: string };
  commande?: { numeroCommande: string } | null;
};
export const getJournal = () => apiGet<{ lignes: LigneJournal[] }>('/api/caisse/journal?limite=200');

export type Rapprochement = {
  date: string;
  encaisse: number;
  reverse: number;
  annule: number;
  resteARecevoir: number;
  commandesEnAttente: number;
};
export const getRapprochement = (date?: string) =>
  apiGet<Rapprochement>(`/api/caisse/rapprochement${date ? `?date=${date}` : ''}`);

/** Livreur : déclare qu'il remet ces espèces à l'admin (en attente de validation). */
export const declarerRemise = (commandeIds: string[], note?: string) =>
  apiPost('/api/caisse/remises', { commandeIds, note });
/** Admin : confirme avoir reçu l'argent déclaré par le livreur. */
export const validerRemise = (id: string) => apiPost(`/api/caisse/reversements/${id}/valider`, {});
export const refuserRemise = (id: string, motif: string) => apiPost(`/api/caisse/reversements/${id}/refuser`, { motif });
