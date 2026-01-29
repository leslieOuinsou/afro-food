/**
 * Client API pour communiquer avec le backend Afro-Eats
 * Utilise NEXT_PUBLIC_API_URL (ex: http://localhost:5000)
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export type ApiResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: Record<string, number | boolean>;
};

/**
 * Récupère le token JWT (localStorage ou cookie selon votre implémentation)
 */
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('afro_eats_token');
}

/**
 * Appel API générique avec gestion du token et des erreurs
 */
export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // pour les cookies si vous les utilisez
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        message: data.message || `Erreur ${res.status}`,
        data: data as T,
      };
    }

    return {
      success: true,
      message: data.message,
      data: data.data ?? data,
      pagination: data.pagination,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur réseau';
    return { success: false, message };
  }
}

/** GET */
export function apiGet<T>(endpoint: string) {
  return apiFetch<T>(endpoint, { method: 'GET' });
}

/** POST */
export function apiPost<T>(endpoint: string, body: unknown) {
  return apiFetch<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** PUT */
export function apiPut<T>(endpoint: string, body: unknown) {
  return apiFetch<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/** PATCH */
export function apiPatch<T>(endpoint: string, body?: unknown) {
  return apiFetch<T>(endpoint, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/** DELETE */
export function apiDelete<T>(endpoint: string) {
  return apiFetch<T>(endpoint, { method: 'DELETE' });
}

export { API_URL };
