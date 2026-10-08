import { apiDelete, apiGet, apiPut } from '@/lib/api';

export type SignatureActive = { id: string; nom: string; fonction: string; image: string } | null;

/**
 * Signature active, ou null si aucune n'est enregistrée.
 * Le client API renvoie l'enveloppe entière quand `data` est null : on ne garde donc que les vraies signatures.
 */
export async function getSignature(): Promise<{ success: boolean; message?: string; data: SignatureActive }> {
  const res = await apiGet<SignatureActive>('/api/signature');
  const d = res.data as unknown;
  const valide = d && typeof d === 'object' && 'image' in d && typeof (d as { image: unknown }).image === 'string';
  return { success: res.success, message: res.message, data: valide ? (d as SignatureActive) : null };
}
export const saveSignature = (image: string, nom: string, fonction: string) =>
  apiPut('/api/signature', { image, nom, fonction });
export const resetSignature = () => apiDelete('/api/signature');
