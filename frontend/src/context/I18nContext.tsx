'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { activerTraduction, chargerDictionnaire, desactiverTraduction, type Langue } from '@/lib/i18n/traducteur';

const CLE = 'afro_lang';

type Ctx = { langue: Langue; changerLangue: (l: Langue) => void };
const I18nContext = createContext<Ctx>({ langue: 'fr', changerLangue: () => undefined });

function langueEnregistree(): Langue {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|; )${CLE}=(fr|en)`));
    if (m) return m[1] as Langue;
    const l = localStorage.getItem(CLE);
    if (l === 'fr' || l === 'en') return l;
  } catch {
    /* stockage indisponible */
  }
  return 'fr';
}

/** Langue de l'interface (français par défaut) : le choix est mémorisé 1 an. */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [langue, setLangue] = useState<Langue>('fr');
  const premiereActivation = useRef(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLangue(langueEnregistree());
  }, []);

  useEffect(() => {
    let annule = false;
    let minuterie: number | undefined;
    if (langue === 'en') {
      // Au chargement de la page, on laisse React finir d'hydrater avant de modifier les textes (évite tout conflit)
      const delai = premiereActivation.current ? 400 : 0;
      premiereActivation.current = false;
      void import('@/lib/i18n/en').then(({ EN }) => {
        if (annule) return;
        minuterie = window.setTimeout(() => {
          if (annule) return;
          chargerDictionnaire(EN);
          activerTraduction();
        }, delai);
      });
    } else {
      premiereActivation.current = false;
      desactiverTraduction();
    }
    return () => {
      annule = true;
      if (minuterie) window.clearTimeout(minuterie);
    };
  }, [langue]);

  const changerLangue = useCallback((l: Langue) => {
    setLangue(l);
    try {
      document.cookie = `${CLE}=${l}; Max-Age=31536000; Path=/; SameSite=Lax`;
      localStorage.setItem(CLE, l);
    } catch {
      /* ignoré */
    }
  }, []);

  const valeur = useMemo(() => ({ langue, changerLangue }), [langue, changerLangue]);
  return <I18nContext.Provider value={valeur}>{children}</I18nContext.Provider>;
}

export const useLangue = () => useContext(I18nContext);
