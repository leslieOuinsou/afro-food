/**
 * Service paramètres admin
 */
import { apiGet, apiPut, ApiResponse } from '@/lib/api';

export type AdminSettings = {
  nomRestaurant?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  description?: string;
  fraisLivraison?: number;
  delaiLivraison?: number;
  zoneLivraison?: string;
  montantMinimum?: number;
  notificationsEmail?: boolean;
  notificationsSMS?: boolean;
  notificationsCommandes?: boolean;
  notificationsPromotions?: boolean;
  paiementCarte?: boolean;
  paiementEspeces?: boolean;
  paiementLivraison?: boolean;
  theme?: 'clair' | 'sombre' | 'auto';
  langue?: 'fr' | 'en' | 'es';
  livraison?: {
    fraisStandard?: number;
    seuilGratuit?: number;
    zones?: string[];
    delaiEstimeMinutes?: number;
  };
  restaurant?: {
    nom?: string;
    telephone?: string;
    email?: string;
    adresse?: string;
  };
  commandes?: {
    taxesPourcentage?: number;
    annulationMinutes?: number;
  };
};

export async function fetchSettings(): Promise<ApiResponse<{ settings: AdminSettings }>> {
  return apiGet('/api/settings');
}

export async function updateSettings(
  settings: AdminSettings
): Promise<ApiResponse<{ settings: AdminSettings }>> {
  return apiPut('/api/settings', { settings });
}

export async function fetchLivraisonSettings(): Promise<
  ApiResponse<{ livraison: AdminSettings['livraison'] }>
> {
  return apiGet('/api/settings/livraison');
}
