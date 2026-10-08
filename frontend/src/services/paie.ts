import { apiGet, apiPatch, apiPost, apiPut } from '@/lib/api';

export type JourPaie = {
  livreurId: string;
  jour: string;
  minutesAPayer: number;
  minutesPayees: number;
  enCours: boolean;
  nbLivraisons: number;
  sessions: number;
  montantAPayer: number;
  montantPaye?: number;
  livreur?: { _id: string; nom: string; prenom: string; telephone?: string } | null;
};

export type MonPointage = {
  tauxHoraire: number;
  enService: boolean;
  debutSession: string | null;
  aujourdhui: { minutes: number; nbLivraisons: number; gainEstime: number };
  jours: JourPaie[];
};

export const getMonPointage = () => apiGet<MonPointage>('/api/paie/mon-pointage');
export const debutPointage = () => apiPost('/api/paie/pointage/debut', {});
export const finPointage = () => apiPost('/api/paie/pointage/fin', {});

export type ResumePaie = { tauxHoraire: number; du: string; au: string; journees: JourPaie[]; totalAPayer: number };
export const getResumePaie = (du?: string, au?: string) =>
  apiGet<ResumePaie>(`/api/paie/admin/resume${du && au ? `?du=${du}&au=${au}` : ''}`);

export type SessionPointage = { id: string; debut: string; fin: string | null; paieId: string | null };
export const getSessions = (livreurId: string, jour: string) =>
  apiGet<{ pointages: SessionPointage[] }>(`/api/paie/admin/pointages?livreurId=${livreurId}&jour=${jour}`);
export const corrigerSession = (id: string, fin: string, debut?: string) =>
  apiPatch(`/api/paie/admin/pointages/${id}`, { fin, ...(debut ? { debut } : {}) });

export const payerJournee = (livreurId: string, jour: string, mode: string, note?: string) =>
  apiPost('/api/paie/admin/payer', { livreurId, jour, mode, note });

export type PaieFaite = {
  id: string;
  jour: string;
  minutes: number;
  tauxHoraire: number;
  montant: number;
  nbLivraisons: number;
  mode: string;
  note?: string | null;
  createdAt: string;
  livreur: { nom: string; prenom: string };
  admin: { nom: string; prenom: string };
};
export const getPaies = () => apiGet<{ paies: PaieFaite[] }>('/api/paie/admin/paiements');
export const setTaux = (taux: number) => apiPut('/api/paie/admin/taux', { taux });
