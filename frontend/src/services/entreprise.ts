import { apiGet, apiPut } from '@/lib/api';

export type Entreprise = {
  nom: string;
  formeJuridique: string;
  adresse: string;
  codePostal: string;
  ville: string;
  siret: string;
  tvaIntra: string;
  email: string;
  telephone: string;
};

export const getEntreprise = () => apiGet<Entreprise>('/api/entreprise');
export const saveEntreprise = (e: Entreprise) => apiPut<Entreprise>('/api/entreprise', e);
