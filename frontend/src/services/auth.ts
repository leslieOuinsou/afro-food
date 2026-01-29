/**
 * Service Auth - Inscription, connexion, token
 */

import { apiPost, apiGet, apiPut, ApiResponse } from '@/lib/api';

const TOKEN_KEY = 'afro_eats_token';

export type User = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: string;
  avatar?: string;
  adresses?: unknown[];
};

export type AuthResponse = {
  user: User;
  token: string;
};

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
    }
  }
  return res;
}

/**
 * Déconnexion (côté front : supprime le token)
 */
export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
}

/**
 * Vérifie si l'utilisateur est connecté (token présent)
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(TOKEN_KEY);
}

/**
 * Récupère le profil utilisateur (nécessite d'être connecté)
 */
export async function fetchProfil(): Promise<ApiResponse<{ user: User }>> {
  return apiGet<{ user: User }>('/api/auth/profil');
}

/**
 * Met à jour le profil
 */
export async function updateProfil(data: Partial<User>): Promise<ApiResponse<{ user: User }>> {
  return apiPut<{ user: User }>('/api/auth/profil', data);
}
