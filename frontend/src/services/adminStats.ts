/**
 * Service pour les statistiques admin (tableau de bord)
 */

import { apiGet } from '@/lib/api';

export interface PublicStats {
  nombrePlats: number;
  nombreCategories: number;
  nombrePays?: number;
  nombreTotalCommandes: number;
  nombreUtilisateursActifs: number;
  nombreAvis: number;
}

export interface AdminStatsData {
  statistiques: {
    totalCommandes: number;
    totalRevenu: number;
    commandesLivrees: number;
    commandesAnnulees: number;
    panierMoyen: number;
    /** Le backend expose actuellement noteMovenne (orthographe historique). */
    noteMovenne: number;
  };
  topPlats?: Array<{ platId: string; nom: string; quantite: number; chiffreAffaires: number }>;
  statsParStatut?: Array<{ _id: string; nombre: number; montantTotal: number }>;
  evolutionQuotidienne?: Array<{
    _id: { annee: number; mois: number; jour: number };
    nombreCommandes: number;
    revenus: number;
  }>;
}

function isUnauthorizedStatus(status?: number): boolean {
  return status === 401 || status === 403;
}

/** Statistiques publiques (sans auth) */
export async function getPublicStats(): Promise<PublicStats | null> {
  const res = await apiGet<PublicStats>('/api/statistiques');
  if (res.success && res.data) return res.data as PublicStats;
  return null;
}

/** Statistiques admin commandes (nécessite token admin) */
export async function getAdminCommandesStats(
  dateDebut?: string,
  dateFin?: string
): Promise<AdminStatsData | null> {
  const params = new URLSearchParams();
  if (dateDebut) params.set('dateDebut', dateDebut);
  if (dateFin) params.set('dateFin', dateFin);
  const query = params.toString();
  const res = await apiGet<AdminStatsData>(
    `/api/commandes/statistiques/general${query ? `?${query}` : ''}`
  );
  if (!res.success && isUnauthorizedStatus(res.status)) {
    return null;
  }
  if (res.success && res.data) return res.data as AdminStatsData;
  return null;
}

/** Télécharge le CSV des commandes (période optionnelle) ; retourne un message d'erreur ou null */
export async function telechargerExportCommandes(dateDebut?: string, dateFin?: string): Promise<string | null> {
  const params = new URLSearchParams();
  if (dateDebut) params.set('dateDebut', dateDebut);
  if (dateFin) params.set('dateFin', dateFin);
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('afro_eats_token') || sessionStorage.getItem('afro_eats_token');
  try {
    const res = await fetch(`${base}/api/commandes/export/csv?${params}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    });
    if (!res.ok) return `Export impossible (erreur ${res.status}).`;
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement('a');
    a.href = url;
    a.download = 'commandes.csv';
    a.click();
    URL.revokeObjectURL(url);
    return null;
  } catch {
    return "Export impossible : serveur injoignable.";
  }
}
