import { apiGet, apiPost } from '@/lib/api';

export type DocumentClient = {
  id: string;
  nom: string;
  mime: string;
  taille: number;
  statut: 'en_attente' | 'valide' | 'refuse';
  motifRefus?: string | null;
  traiteLe?: string | null;
  createdAt: string;
  commande: {
    _id: string;
    numeroCommande: string;
    total: number;
    statut: string;
    statutPaiement: string;
    client: string;
    email?: string;
  };
  verification: {
    paiementStripe: boolean;
    payeLe: string | null;
    referenceStripe: string | null;
  };
};

export const getDocuments = (statut?: string) =>
  apiGet<{ documents: DocumentClient[] }>(`/api/documents${statut ? `?statut=${statut}` : ''}`);
export const validerDocument = (id: string, body: { code?: string; verification?: string }) =>
  apiPost(`/api/documents/${id}/valider`, body);
export const refuserDocument = (id: string, motif: string) => apiPost(`/api/documents/${id}/refuser`, { motif });
