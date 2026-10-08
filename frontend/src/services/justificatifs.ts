import { API_URL, apiFetch, apiGet } from '@/lib/api';

export type Justificatif = {
  id: string;
  nom: string;
  mime: string;
  taille: number;
  createdAt: string;
  statut?: 'en_attente' | 'valide' | 'refuse';
  motifRefus?: string | null;
};

export const getJustificatifs = (commandeId: string) =>
  apiGet<{ justificatifs: Justificatif[] }>(`/api/commandes/${commandeId}/justificatifs`);

export function envoyerJustificatif(commandeId: string, fichier: File) {
  const form = new FormData();
  form.append('fichier', fichier);
  return apiFetch<{ justificatif: Justificatif }>(`/api/commandes/${commandeId}/justificatifs`, {
    method: 'POST',
    body: form,
  });
}

/** Ouvre le fichier dans un nouvel onglet (téléchargement authentifié puis affichage local). */
export async function ouvrirJustificatif(commandeId: string, justificatifId: string): Promise<string | null> {
  const token = sessionStorage.getItem('afro_eats_token') || localStorage.getItem('afro_eats_token');
  const res = await fetch(`${API_URL}/api/commandes/${commandeId}/justificatifs/${justificatifId}/fichier`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  if (!res.ok) return 'Impossible d’ouvrir ce fichier.';
  const url = URL.createObjectURL(await res.blob());
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return null;
}

export const tailleLisible = (octets: number) =>
  octets >= 1024 * 1024 ? `${(octets / 1024 / 1024).toFixed(1)} Mo` : `${Math.max(1, Math.round(octets / 1024))} Ko`;

/** Télécharge le justificatif de paiement PDF généré par le serveur. */
export async function telechargerRecu(commandeId: string, nomFichier: string): Promise<string | null> {
  const token = sessionStorage.getItem('afro_eats_token') || localStorage.getItem('afro_eats_token');
  const res = await fetch(`${API_URL}/api/paiements/${commandeId}/justificatif.pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  if (!res.ok) return 'Justificatif indisponible pour le moment.';
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = nomFichier;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return null;
}

/** Télécharge le fichier d'un justificatif (pour le scanner côté admin). */
export async function telechargerJustificatifBlob(commandeId: string, justificatifId: string): Promise<Blob | null> {
  const token = sessionStorage.getItem('afro_eats_token') || localStorage.getItem('afro_eats_token');
  const res = await fetch(`${API_URL}/api/commandes/${commandeId}/justificatifs/${justificatifId}/fichier`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  return res.ok ? res.blob() : null;
}
