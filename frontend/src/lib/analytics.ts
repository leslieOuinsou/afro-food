/**
 * Google Analytics 4. Chargé uniquement si l'utilisateur a accepté la catégorie « statistiques »
 * (voir `lib/consent.ts`) et si NEXT_PUBLIC_GA_ID est défini.
 */

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? '';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export type GaItem = {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
};

export function gaActif(): boolean {
  return Boolean(GA_ID) && typeof window !== 'undefined' && typeof window.gtag === 'function';
}

export function trackEvent(nom: string, params: Record<string, unknown> = {}): void {
  if (!gaActif()) return;
  window.gtag!('event', nom, params);
}

export function trackPageView(url: string): void {
  trackEvent('page_view', { page_path: url, page_location: window.location.href, page_title: document.title });
}

export function trackAddToCart(item: GaItem): void {
  trackEvent('add_to_cart', { currency: 'EUR', value: item.price * item.quantity, items: [item] });
}

export function trackBeginCheckout(items: GaItem[], value: number): void {
  trackEvent('begin_checkout', { currency: 'EUR', value, items });
}

export function trackPurchase(p: {
  transactionId: string;
  value: number;
  shipping: number;
  coupon?: string;
  items: GaItem[];
}): void {
  trackEvent('purchase', {
    transaction_id: p.transactionId,
    currency: 'EUR',
    value: p.value,
    shipping: p.shipping,
    coupon: p.coupon,
    items: p.items,
  });
}

export function trackViewItem(item: GaItem): void {
  trackEvent('view_item', { currency: 'EUR', value: item.price, items: [item] });
}

export function trackRemoveFromCart(item: GaItem): void {
  trackEvent('remove_from_cart', { currency: 'EUR', value: item.price * item.quantity, items: [item] });
}

export function trackAddToWishlist(item: GaItem): void {
  trackEvent('add_to_wishlist', { currency: 'EUR', value: item.price, items: [item] });
}

export function trackSearch(terme: string): void {
  trackEvent('search', { search_term: terme });
}

export function trackSignUp(): void {
  trackEvent('sign_up', { method: 'email' });
}

export function trackLogin(): void {
  trackEvent('login', { method: 'email' });
}

/** Événements sans donnée personnelle : jamais d'e-mail ni de message envoyé à GA. */
export function trackNewsletter(source: string): void {
  trackEvent('newsletter_signup', { source });
}

export function trackContact(): void {
  trackEvent('contact_submit');
}

export function trackPromo(code: string, succes: boolean): void {
  trackEvent(succes ? 'promo_applied' : 'promo_rejected', { coupon: code });
}

/** Étapes du parcours « mot de passe oublié » : demande, renvoi, réinitialisation réussie. */
export function trackPasswordReset(etape: 'demande' | 'renvoi' | 'reussie'): void {
  trackEvent('password_reset', { etape });
}
