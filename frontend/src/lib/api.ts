/**
 * Client API pour communiquer avec le backend Afro-food
 * Utilise NEXT_PUBLIC_API_URL (ex: http://localhost:5000)
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS || 15000);

export type ApiResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: Record<string, number | boolean>;
  /** Code HTTP de la dernière réponse (présent pour gérer 401, etc.) */
  status?: number;
};

type BackendEnvelope<T = unknown> = {
  success?: boolean;
  message?: string;
  data?: T;
  pagination?: Record<string, number | boolean>;
  status?: number;
};

/**
 * Récupère le token JWT (localStorage ou cookie selon votre implémentation)
 */
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('afro_eats_token') || sessionStorage.getItem('afro_eats_token')
  );
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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  const headers: HeadersInit = { ...(options.headers as Record<string, string>) };
  const isFormData = options.body instanceof FormData;
  if (!isFormData && !(headers as Record<string, string>)['Content-Type']) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // pour les cookies si vous les utilisez
      signal: controller.signal,
    });

    const data = (await res.json().catch(() => ({}))) as BackendEnvelope<T>;

    if (!res.ok) {
      return {
        success: false,
        message: data.message || `Erreur ${res.status}`,
        data: data.data as T,
        status: res.status,
      };
    }

    return {
      success: true,
      message: data.message,
      data: (data.data ?? (data as unknown)) as T,
      pagination: data.pagination,
      status: res.status,
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[apiFetch timeout]', { endpoint, timeoutMs: API_TIMEOUT_MS });
      }
      return {
        success: false,
        message: `Délai dépassé (${Math.round(API_TIMEOUT_MS / 1000)}s). Vérifiez votre connexion.`,
      };
    }
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    const message = offline
      ? 'Vous semblez hors ligne. Vérifiez votre connexion internet.'
      : err instanceof Error
        ? err.message
        : 'Erreur réseau';
    if (process.env.NODE_ENV !== 'production') {
      console.error('[apiFetch error]', { endpoint, message, error: err });
    }
    return { success: false, message };
  } finally {
    clearTimeout(timeoutId);
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
