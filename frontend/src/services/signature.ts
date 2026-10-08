import { apiDelete, apiGet, apiPut } from '@/lib/api';

export type SignatureActive = { id: string; nom: string; fonction: string; image: string } | null;

export const getSignature = () => apiGet<SignatureActive>('/api/signature');
export const saveSignature = (image: string, nom: string, fonction: string) =>
  apiPut('/api/signature', { image, nom, fonction });
export const resetSignature = () => apiDelete('/api/signature');
