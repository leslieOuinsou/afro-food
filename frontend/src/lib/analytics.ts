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
  // Les codes « MERCI-… » sont les codes offerts après une commande de plus de 30 €
  trackEvent(succes ? 'promo_applied' : 'promo_rejected', {
    coupon: code,
    code_recompense: code.toUpperCase().startsWith('MERCI-'),
  });
}

/** Arrivée sur la page de notation depuis l'e-mail de remerciement. */
export function trackReviewEmailClick(note: number | null): void {
  trackEvent('review_email_click', { note_preselectionnee: note ?? undefined });
}

/** Note envoyée par le client après livraison. */
export function trackReviewSubmitted(note: number, avecCommentaire: boolean): void {
  trackEvent('review_submitted', { note, commentaire: avecCommentaire });
}

/** Étapes du parcours « mot de passe oublié » : demande, renvoi, réinitialisation réussie. */
export function trackPasswordReset(etape: 'demande' | 'renvoi' | 'reussie'): void {
  trackEvent('password_reset', { etape });
}

// ── Notifications, suivi en direct, livreur, admin ─────────────────────────────────────

/** Rôle de l'utilisateur (client / admin / livreur) : permet d'exclure le personnel dans les rapports GA. */
export function setUserRole(role: string | null): void {
  if (!gaActif()) return;
  window.gtag!('set', 'user_properties', { user_role: role ?? 'visiteur' });
}

export function trackNotifBellOpen(role: string, nonLues: number): void {
  trackEvent('notification_bell_open', { role, non_lues: nonLues });
}

/** type : nouvelle_commande | avis | commande_prete | statut_commande | autre */
export function trackNotifClick(role: string, type: string): void {
  trackEvent('notification_click', { role, type });
}

export function trackPushToggle(role: string, etat: 'actif' | 'inactif' | 'refuse'): void {
  trackEvent('push_notifications', { role, etat });
}

export function trackPublicReviewsView(moyenne: number, total: number): void {
  trackEvent('public_reviews_view', { note_moyenne: moyenne, nombre_avis: total });
}

export function trackLiveTrackingView(): void {
  trackEvent('live_tracking_view');
}

export function trackLiveTrackingRecenter(): void {
  trackEvent('live_tracking_recenter');
}

export function trackDeliveryAction(action: 'prise_en_charge' | 'livree'): void {
  trackEvent('delivery_action', { action });
}

export function trackPositionSharing(actif: boolean): void {
  trackEvent('position_sharing', { etat: actif ? 'demarre' : 'arrete' });
}

export function trackDeliveryHistoryMore(): void {
  trackEvent('delivery_history_more');
}

export function trackAdminOrderStatus(statut: string): void {
  trackEvent('admin_order_status', { statut });
}

export function trackAdminReviewsView(filtreNote: number): void {
  trackEvent('admin_reviews_view', { filtre_note: filtreNote || 'tous' });
}
