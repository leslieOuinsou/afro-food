/**
 * Service Auth - Inscription, connexion, token
 */

import { apiPost, apiGet, apiPut, ApiResponse } from '@/lib/api';

export const TOKEN_KEY = 'afro_eats_token';

export type User = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: string;
  avatar?: string;
  adresses?: unknown[];
  emailVerifie?: boolean;
  telephoneVerifie?: boolean;
  preferences?: unknown;
};

export type AuthResponse = {
  user: User;
  token: string;
};

type BackendUserPayload = {
  user?: Record<string, unknown>;
  utilisateur?: Record<string, unknown>;
};

/** Supprime uniquement le stockage client du JWT (sans appeler le serveur). */
export function clearClientSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

function mapBackendUser(raw: Record<string, unknown> | undefined | null): User | null {
  if (!raw || typeof raw !== 'object') return null;
  const idRaw = raw.id ?? raw._id;
  if (idRaw == null) return null;
  return {
    id: String(idRaw),
    nom: String(raw.nom ?? ''),
    prenom: String(raw.prenom ?? ''),
    email: String(raw.email ?? ''),
    telephone: String(raw.telephone ?? ''),
    role: String(raw.role ?? 'client'),
    avatar: raw.avatar != null ? String(raw.avatar) : undefined,
    adresses: raw.adresses as unknown[] | undefined,
    emailVerifie: typeof raw.emailVerifie === 'boolean' ? raw.emailVerifie : undefined,
    telephoneVerifie: typeof raw.telephoneVerifie === 'boolean' ? raw.telephoneVerifie : undefined,
    preferences: raw.preferences,
  };
}

function normalizeUserPayload(res: ApiResponse<unknown>): ApiResponse<{ user: User }> {
  if (!res.success) return res as ApiResponse<{ user: User }>;
  const payload = res.data as Record<string, unknown> | undefined;
  if (!payload || typeof payload !== 'object') {
    return {
      ...res,
      success: false,
      message: res.message || 'Profil introuvable',
      data: undefined,
    } as ApiResponse<{ user: User }>;
  }
  const raw = (payload.user ?? payload.utilisateur) as Record<string, unknown> | undefined;
  const user = mapBackendUser(raw);
  if (!user) {
    return {
      ...res,
      success: false,
      message: res.message || 'Profil introuvable',
      data: undefined,
    } as ApiResponse<{ user: User }>;
  }
  return {
    ...res,
    data: { user },
  };
}

/**
 * Inscription
 */
export async function register(data: {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  motDePasse: string;
  confirmationMotDePasse: string;
  accepteCGU: boolean;
  adresse?: { adresse: string; ville: string; codePostal: string; pays?: string };
}): Promise<ApiResponse<AuthResponse>> {
  const res = await apiPost<AuthResponse>('/api/auth/inscription', data);
  if (res.success && res.data?.token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, res.data.token);
      sessionStorage.setItem(TOKEN_KEY, res.data.token);
    }
  }
  return res;
}

/**
 * Connexion
 */
export async function login(email: string, motDePasse: string): Promise<ApiResponse<AuthResponse>> {
  const res = await apiPost<AuthResponse>('/api/auth/connexion', { email, motDePasse });
  if (res.success && res.data?.token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, res.data.token);
      sessionStorage.setItem(TOKEN_KEY, res.data.token);
    }
  }
  return res;
}

/**
 * Déconnexion : appelle l’API avec le JWT encore présent, puis efface le stockage local.
 */
export async function logout(): Promise<void> {
  try {
    await apiPost('/api/auth/deconnexion', {});
  } catch {
    /* réseau : on purge quand même la session client */
  } finally {
    clearClientSession();
  }
}

/**
 * Vérifie si l'utilisateur est connecté (token présent)
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY));
}

/**
 * Récupère le profil utilisateur (nécessite d'être connecté)
 */
export async function fetchProfil(): Promise<ApiResponse<{ user: User }>> {
  const res = await apiGet<BackendUserPayload>('/api/auth/profil');
  return normalizeUserPayload(res);
}

/**
 * Met à jour le profil (nom, prénom, téléphone, préférences, avatar — pas l’email côté back actuel)
 */
export async function updateProfil(data: Partial<User>): Promise<ApiResponse<{ user: User }>> {
  const body: Record<string, unknown> = {};
  if (data.nom != null) body.nom = data.nom;
  if (data.prenom != null) body.prenom = data.prenom;
  if (data.telephone != null) body.telephone = data.telephone;
  if (data.preferences != null) body.preferences = data.preferences;
  if (data.avatar != null) body.avatar = data.avatar;
  const res = await apiPut<BackendUserPayload>('/api/auth/profil', body);
  return normalizeUserPayload(res);
}

export async function changePassword(data: {
  ancienMotDePasse: string;
  nouveauMotDePasse: string;
  confirmationNouveauMotDePasse: string;
}): Promise<ApiResponse> {
  return apiPut('/api/auth/mot-de-passe', data);
}

export async function forgotPassword(email: string): Promise<ApiResponse<{ resetToken?: string }>> {
  return apiPost<{ resetToken?: string }>('/api/auth/mot-de-passe-oublie', {
    email: email.trim().toLowerCase(),
  });
}

export async function resetPassword(
  token: string,
  motDePasse: string,
  confirmationMotDePasse: string
): Promise<ApiResponse> {
  return apiPost('/api/auth/reinitialiser-mot-de-passe', {
    token,
    motDePasse,
    confirmationMotDePasse,
  });
}
