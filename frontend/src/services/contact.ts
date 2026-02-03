/**
 * Service pour l'envoi de messages depuis la page contact
 */

import { apiPost } from '@/lib/api';

export interface ContactFormData {
  nom: string;
  email: string;
  sujet: string;
  message: string;
}

export async function envoyerMessageContact(data: ContactFormData): Promise<{ success: boolean; message?: string }> {
  const res = await apiPost<unknown>('/api/contact', data);
  return { success: res.success === true, message: res.message };
}
