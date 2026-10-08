import { apiGet, apiPost, apiPut } from '@/lib/api';

export type EstimationLivraison = {
  livrable: boolean;
  zone: { id: string; nom: string } | null;
  frais: number;
  minimum: number;
  message: string | null;
};
export const estimerLivraison = (codePostal: string, ville: string, sousTotal: number) =>
  apiPost<EstimationLivraison>('/api/livraison/estimer', { codePostal, ville, sousTotal });

export type Creneau = { jour: string; heure: string; debut: string };
export const getCreneaux = () => apiGet<{ actif: boolean; creneaux: Creneau[] }>('/api/livraison/creneaux');

export type Zone = {
  id: string;
  nom: string;
  codesPostaux: string[];
  villes: string[];
  frais: number;
  minimumCommande: number;
  gratuitDepuis: number | null;
};
export type ConfigZones = { actif: boolean; zones: Zone[] };
export type ConfigCreneaux = {
  actif: boolean;
  ouverture: string;
  fermeture: string;
  pasMinutes: number;
  delaiMinimumMinutes: number;
  joursMax: number;
  capaciteParCreneau: number;
};
export const getReglagesLivraison = () =>
  apiGet<{ zones: ConfigZones; creneaux: ConfigCreneaux; defauts: { fraisStandard: number; seuilGratuit: number } }>('/api/livraison/reglages');
export const saveZones = (c: ConfigZones) => apiPut('/api/livraison/zones', c);
export const saveCreneaux = (c: ConfigCreneaux) => apiPut('/api/livraison/creneaux', c);
