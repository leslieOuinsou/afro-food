import { API_URL, apiGet } from '@/lib/api';

export type StatsAvancees = {
  du: string;
  au: string;
  commandes: number;
  commandesPayees: number;
  annulees: number;
  tauxAnnulation: number;
  chiffreAffaires: number;
  chiffreAffairesHT: number;
  tva: number;
  panierMoyen: number;
  parJour: { jour: string; commandes: number; chiffreAffaires: number }[];
  topPlats: { nom: string; quantite: number; chiffreAffaires: number }[];
  heuresDePointe: { heure: number; commandes: number }[];
  modesPaiement: Record<string, number>;
};

export const getStatsAvancees = (du: string, au: string) => apiGet<StatsAvancees>(`/api/stats/avancees?du=${du}&au=${au}`);

/** Télécharge un export CSV (ventes, caisse ou paie) via une requête authentifiée. */
export async function telechargerExport(type: 'ventes' | 'caisse' | 'paie', du: string, au: string): Promise<string | null> {
  const token = sessionStorage.getItem('afro_eats_token') || localStorage.getItem('afro_eats_token');
  const res = await fetch(`${API_URL}/api/stats/export/${type}?du=${du}&au=${au}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  if (!res.ok) return 'Export impossible pour le moment.';
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = `${type}-${du}_${au}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return null;
}
