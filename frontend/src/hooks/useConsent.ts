'use client';

import { useEffect, useState } from 'react';
import { CONSENT_UPDATED_EVENT, readConsent, type ConsentRecord } from '@/lib/consent';

/**
 * Consentement courant (null = pas encore de choix).
 * À utiliser pour conditionner tout script optionnel :
 *   const consent = useConsent();
 *   if (consent?.statistiques) { ...charger l'outil d'analyse... }
 */
export function useConsent(): ConsentRecord | null {
  const [consent, setConsent] = useState<ConsentRecord | null>(null);

  useEffect(() => {
    const sync = () => setConsent(readConsent());
    sync();
    window.addEventListener(CONSENT_UPDATED_EVENT, sync);
    return () => window.removeEventListener(CONSENT_UPDATED_EVENT, sync);
  }, []);

  return consent;
}
