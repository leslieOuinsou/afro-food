'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { accueilPourRole } from '@/components/RoleGuard';
import { useAuth } from '@/context/AuthContext';
import {
  CONSENT_ACCEPTE,
  CONSENT_REFUSE,
  OPEN_COOKIE_SETTINGS_EVENT,
  readConsent,
  saveConsent,
  type ConsentCategories,
} from '@/lib/consent';

type Vue = 'ferme' | 'bandeau' | 'preferences';

function Interrupteur({
  id,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        checked ? 'bg-[var(--ochre)]' : 'bg-[var(--wood)]/25'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  );
}

export default function CookieConsent() {
  const [vue, setVue] = useState<Vue>('ferme');
  const [choix, setChoix] = useState<ConsentCategories>(CONSENT_REFUSE);

  useEffect(() => {
    const existant = readConsent();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (existant) setChoix({ statistiques: existant.statistiques, marketing: existant.marketing });

    const ouvrir = () => {
      const actuel = readConsent();
      setChoix(actuel ? { statistiques: actuel.statistiques, marketing: actuel.marketing } : CONSENT_REFUSE);
      setVue('preferences');
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, ouvrir);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, ouvrir);
  }, []);

  const valider = useCallback((categories: ConsentCategories) => {
    saveConsent(categories);
    setChoix(categories);
    setVue('ferme');
  }, []);

  // Bandeau affiché une seule fois par connexion, sur la première page du profil
  // (catalogue pour le client, tableau de bord pour l'admin, page livreur pour le livreur).
  const { user, loading } = useAuth();
  const pathname = usePathname();
  useEffect(() => {
    if (loading) return;
    const cle = 'afro-cookies-connexion';
    try {
      if (!user) {
        sessionStorage.removeItem(cle);
      } else if (pathname === accueilPourRole(user.role) && !sessionStorage.getItem(cle)) {
        sessionStorage.setItem(cle, '1');
        const actuel = readConsent();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setChoix(actuel ? { statistiques: actuel.statistiques, marketing: actuel.marketing } : CONSENT_REFUSE);
        setVue('bandeau');
      }
    } catch {}
  }, [user, loading, pathname]);

  useEffect(() => {
    if (vue !== 'preferences') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setVue(readConsent() ? 'ferme' : 'bandeau');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [vue]);

  if (vue === 'ferme') return null;

  const boutonBase =
    'rounded-full px-3 py-2 text-sm font-semibold transition sm:px-5 sm:py-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ochre)]';
  // « Refuser » et « Accepter » ont le même poids visuel (exigence CNIL)
  const boutonPrincipal = `${boutonBase} bg-[var(--wood)] text-[var(--ivory)] hover:bg-[var(--wood)]/90`;
  const boutonSecondaire = `${boutonBase} border border-[var(--wood)]/25 text-[var(--wood)] hover:bg-[var(--wood)]/5`;

  if (vue === 'bandeau') {
    return (
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby="cookie-titre"
        className="fixed inset-x-0 bottom-0 z-[200] p-2 sm:p-4"
      >
        <div className="mx-auto max-w-4xl rounded-[20px] border border-[var(--wood)]/10 bg-[var(--ivory)] p-4 shadow-[0_18px_60px_rgba(44,26,14,.25)] sm:rounded-[24px] sm:p-6">
          <h2 id="cookie-titre" className="font-title text-xl text-[var(--wood)] sm:text-2xl">
            Vos choix sur les cookies
          </h2>
          <p className="mt-1.5 text-xs leading-snug text-[var(--wood)]/80 sm:mt-2 sm:text-sm sm:leading-relaxed">
            Nous utilisons des cookies indispensables au fonctionnement du site (connexion, panier). Avec votre accord,
            nous pouvons aussi en utiliser pour mesurer l&apos;audience et personnaliser nos offres. Vous pouvez changer
            d&apos;avis à tout moment.{' '}
            <Link href="/cookies" className="underline hover:text-[var(--ochre)]">
              En savoir plus
            </Link>
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:flex sm:flex-row sm:justify-end">
            <button type="button" className={`${boutonSecondaire} col-span-2 sm:col-span-1`} onClick={() => setVue('preferences')}>
              Personnaliser
            </button>
            <button type="button" className={boutonPrincipal} onClick={() => valider(CONSENT_REFUSE)}>
              Tout refuser
            </button>
            <button type="button" className={boutonPrincipal} onClick={() => valider(CONSENT_ACCEPTE)}>
              Tout accepter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[210] flex items-end justify-center bg-black/45 p-3 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-pref-titre"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[24px] bg-[var(--ivory)] p-6 shadow-2xl"
      >
        <h2 id="cookie-pref-titre" className="font-title text-2xl text-[var(--wood)]">
          Préférences cookies
        </h2>

        <ul className="mt-5 space-y-5 text-[var(--wood)]">
          <li className="flex items-start justify-between gap-4">
            <div>
              <label htmlFor="ck-necessaires" className="font-semibold">
                Strictement nécessaires
              </label>
              <p className="mt-1 text-sm text-[var(--wood)]/70">
                Connexion, panier, favoris, sécurité et mémorisation de ce choix. Toujours actifs.
              </p>
            </div>
            <Interrupteur id="ck-necessaires" checked disabled />
          </li>
          <li className="flex items-start justify-between gap-4">
            <div>
              <label htmlFor="ck-stats" className="font-semibold">
                Mesure d&apos;audience
              </label>
              <p className="mt-1 text-sm text-[var(--wood)]/70">
                Statistiques de fréquentation anonymisées pour améliorer le site.
              </p>
            </div>
            <Interrupteur
              id="ck-stats"
              checked={choix.statistiques}
              onChange={(v) => setChoix((c) => ({ ...c, statistiques: v }))}
            />
          </li>
          <li className="flex items-start justify-between gap-4">
            <div>
              <label htmlFor="ck-marketing" className="font-semibold">
                Marketing
              </label>
              <p className="mt-1 text-sm text-[var(--wood)]/70">
                Offres et publicités personnalisées, mesure de l&apos;efficacité des campagnes.
              </p>
            </div>
            <Interrupteur
              id="ck-marketing"
              checked={choix.marketing}
              onChange={(v) => setChoix((c) => ({ ...c, marketing: v }))}
            />
          </li>
        </ul>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button type="button" className={boutonPrincipal} onClick={() => valider(CONSENT_REFUSE)}>
            Tout refuser
          </button>
          <button type="button" className={boutonPrincipal} onClick={() => valider(CONSENT_ACCEPTE)}>
            Tout accepter
          </button>
          <button
            type="button"
            className={`${boutonBase} bg-[var(--ochre)] text-white hover:bg-[#a6500c]`}
            onClick={() => valider(choix)}
          >
            Enregistrer mes choix
          </button>
        </div>
      </div>
    </div>
  );
}
