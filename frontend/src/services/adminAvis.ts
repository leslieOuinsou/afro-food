import { apiGet } from '@/lib/api';

export type AvisClient = {
  commandeId: string;
  numeroCommande: string;
  total: number;
  note: number;
  commentaire: string | null;
  date: string;
  client: { nom: string; email: string | null };
};

export type AvisPayload = {
  avis: AvisClient[];
  total: number;
  moyenne: number | null;
  repartition: Record<string, number>;
};

export async function getAvis(params?: { note?: number; limite?: number }) {
  const q = new URLSearchParams();
  if (params?.note) q.set('note', String(params.note));
  if (params?.limite) q.set('limite', String(params.limite));
  const qs = q.toString();
  return apiGet<AvisPayload>(`/api/commandes/avis${qs ? `?${qs}` : ''}`);
}
