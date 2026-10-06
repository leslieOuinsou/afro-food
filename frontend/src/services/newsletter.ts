/**
 * Service newsletter — abonnement via API
 */
import { apiPost, ApiResponse } from '@/lib/api';

export async function subscribeNewsletter(
  email: string
): Promise<ApiResponse<{ subscriber?: unknown }>> {
  return apiPost('/api/newsletter', { email });
}
