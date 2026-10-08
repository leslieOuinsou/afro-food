import { apiGet, apiPost, apiPut } from '@/lib/api';

export type Palier = { points: number; remise: number; accessible?: boolean };
export type MaFidelite = {
  actif: boolean;
  pointsParEuro: number;
  points: number;
  paliers: Palier[];
  prochainPalier: (Palier & { manque: number }) | null;
  mouvements: { id: string; delta: number; motif: string; createdAt: string }[];
  codes: { code: string; valeur: number; utilisations: number; dateFin: string | null; actif: boolean }[];
};
export const getMaFidelite = () => apiGet<MaFidelite>('/api/fidelite');
export const echangerPoints = (points: number) => apiPost<{ code: string; remise: number; dateFin: string }>('/api/fidelite/echanger', { points });

export type ConfigFidelite = { actif: boolean; pointsParEuro: number; paliers: Palier[]; validiteJours: number };
export const getConfigFidelite = () => apiGet<ConfigFidelite>('/api/fidelite/config');
export const saveConfigFidelite = (c: ConfigFidelite) => apiPut('/api/fidelite/config', c);
