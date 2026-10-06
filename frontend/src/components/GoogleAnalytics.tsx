'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { CONSENT_UPDATED_EVENT, readConsent } from '@/lib/consent';
import { GA_ID, trackPageView } from '@/lib/analytics';

function chargerGa() {
  if (!GA_ID || typeof window === 'undefined' || window.gtag) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('js', new Date());
  // page_view envoyé manuellement (navigation SPA)
  window.gtag('config', GA_ID, { send_page_view: false, anonymize_ip: true });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(script);
}

function supprimerCookiesGa() {
  const domaines = [location.hostname, `.${location.hostname}`];
  document.cookie.split('; ').forEach((c) => {
    const nom = c.split('=')[0];
    if (nom === '_ga' || nom.startsWith('_ga_') || nom === '_gid') {
      domaines.forEach((d) => {
        document.cookie = `${nom}=; Max-Age=0; Path=/; Domain=${d}`;
      });
      document.cookie = `${nom}=; Max-Age=0; Path=/`;
    }
  });
}

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const url = pathname + (searchParams?.toString() ? `?${searchParams}` : '');
  const urlRef = useRef(url);
  urlRef.current = url;

  useEffect(() => {
    const synchroniser = () => {
      if (readConsent()?.statistiques) {
        const dejaCharge = Boolean(window.gtag);
        chargerGa();
        if (!dejaCharge) trackPageView(urlRef.current);
      } else if (window.gtag) {
        // consentement retiré : désactive GA et supprime les cookies
        (window as unknown as Record<string, boolean>)[`ga-disable-${GA_ID}`] = true;
        supprimerCookiesGa();
      }
    };
    synchroniser();
    window.addEventListener(CONSENT_UPDATED_EVENT, synchroniser);
    return () => window.removeEventListener(CONSENT_UPDATED_EVENT, synchroniser);
  }, []);

  useEffect(() => {
    if (readConsent()?.statistiques && window.gtag) {
      (window as unknown as Record<string, boolean>)[`ga-disable-${GA_ID}`] = false;
      trackPageView(url);
    }
  }, [url]);

  return null;
}
