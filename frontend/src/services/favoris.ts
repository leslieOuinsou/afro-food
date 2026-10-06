import { apiGet, apiPost } from '@/lib/api';

export type FavoriServeur = { id: string; nom: string; image: string };

type PlatApi = {
  _id: string;
  nom: string;
  images?: { principale?: string };
};

export async function getFavorisServeur(): Promise<FavoriServeur[] | null> {
  const res = await apiGet<{ plats: PlatApi[] }>('/api/favoris');
  if (!res.success || !res.data) return null;
  return res.data.plats.map((p) => ({ id: p._id, nom: p.nom, image: p.images?.principale ?? '' }));
}

/** Ajoute ou retire un favori côté serveur. Retourne le nouvel état, ou null en cas d'échec. */
export async function basculerFavoriServeur(platId: string): Promise<boolean | null> {
  const res = await apiPost<{ favori: boolean }>(`/api/favoris/${platId}/basculer`, {});
  return res.success && res.data ? res.data.favori : null;
}
