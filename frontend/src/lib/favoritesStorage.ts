/** Stockage favoris (sync navbar badge ↔ dashboard) */
export const FAVORITES_STORAGE_KEY = 'afro_eats_favorites';
export const FAVORITES_UPDATED_EVENT = 'afro:favorites-updated';

export function dispatchFavoritesUpdated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(FAVORITES_UPDATED_EVENT));
}
