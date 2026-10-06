/**
 * Consentement aux cookies (RGPD / CNIL).
 * Le choix est stocké dans un cookie first-party `afro_consent` (13 mois max).
 * Les cookies strictement nécessaires (session, panier, favoris) ne demandent pas de consentement.
 */

export const CONSENT_COOKIE = 'afro_consent';
export const CONSENT_VERSION = 1;
export const CONSENT_UPDATED_EVENT = 'afro:consent-updated';
export const OPEN_COOKIE_SETTINGS_EVENT = 'afro:open-cookie-settings';

const MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 12 mois : redemande le choix chaque année

export type ConsentCategories = {
  statistiques: boolean;
  marketing: boolean;
};

export type ConsentRecord = ConsentCategories & {
  version: number;
  date: string;
};

export const CONSENT_REFUSE: ConsentCategories = { statistiques: false, marketing: false };
export const CONSENT_ACCEPTE: ConsentCategories = { statistiques: true, marketing: true };

export function readConsent(): ConsentRecord | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
  if (!match) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(match.slice(CONSENT_COOKIE.length + 1))) as ConsentRecord;
    if (parsed.version !== CONSENT_VERSION) return null; // politique modifiée : on redemande
    return {
      version: parsed.version,
      date: parsed.date,
      statistiques: parsed.statistiques === true,
      marketing: parsed.marketing === true,
    };
  } catch {
    return null;
  }
}

export function saveConsent(categories: ConsentCategories): ConsentRecord {
  const record: ConsentRecord = { ...categories, version: CONSENT_VERSION, date: new Date().toISOString() };
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(record))}; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new Event(CONSENT_UPDATED_EVENT));
  return record;
}

export function openCookieSettings(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
}
