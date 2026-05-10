/**
 * Service pour la messagerie admin (messages contact)
 */

import { apiGet, apiPost, apiPatch } from '@/lib/api';

export interface ReponseMessage {
  _id?: string;
  corps: string;
  date: string;
  auteur: string;
}

export interface MessageContact {
  _id: string;
  nom: string;
  email: string;
  sujet: string;
  message: string;
  statut: 'non_lu' | 'lu' | 'repondu';
  reponses?: ReponseMessage[];
  dateLecture?: string;
  createdAt: string;
}

export async function getMessages(params?: { statut?: string; page?: number; limite?: number }): Promise<{
  messages: MessageContact[];
  pagination?: { page: number; total: number; totalPages: number };
  error?: string;
}> {
  const search = new URLSearchParams();
  if (params?.statut) search.set('statut', params.statut);
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limite != null) search.set('limite', String(params.limite));
  const query = search.toString();
  const res = await apiGet<{ messages: MessageContact[] }>(`/api/messages${query ? `?${query}` : ''}`);
  if (!res.success) {
    return { messages: [], error: res.message || 'Erreur lors du chargement des messages.' };
  }
  if (!res.data) return { messages: [] };
  const data = res.data as { messages?: MessageContact[] };
  const messages = Array.isArray(data.messages) ? data.messages : [];
  const pagination = (res as { pagination?: { page: number; total: number; totalPages: number } }).pagination;
  return { messages, pagination };
}

/** Nombre de messages non lus (pour le badge) */
export async function getUnreadCount(): Promise<number> {
  const res = await getMessages({ statut: 'non_lu', limite: 1 });
  if (res.error || !res.pagination) return 0;
  return res.pagination.total ?? 0;
}

export async function getMessageById(id: string): Promise<MessageContact | null> {
  const res = await apiGet<{ message: MessageContact }>(`/api/messages/${id}`);
  if (!res.success || !res.data) return null;
  const data = res.data as { message?: MessageContact };
  return data.message ?? null;
}

export async function marquerCommeLu(id: string): Promise<boolean> {
  const res = await apiPatch<{ message: MessageContact }>(`/api/messages/${id}/lu`);
  return res.success === true;
}

export async function repondreMessage(id: string, corps: string): Promise<{ success: boolean; message?: MessageContact }> {
  const res = await apiPost<{ message: MessageContact }>(`/api/messages/${id}/reply`, { corps });
  const payload = res.data as { message?: MessageContact } | undefined;
  return { success: res.success === true, message: payload?.message };
}
