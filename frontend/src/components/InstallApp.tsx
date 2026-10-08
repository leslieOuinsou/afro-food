'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CONSENT_UPDATED_EVENT, readConsent } from '@/lib/consent';
import { GUIDE_TEXTE, promptInstall, useCanInstall, useInstallGuide, useIsInstalled } from '@/lib/install';

const CLE_REFUS = 'afro-install-refus';

function abonnerConsentement(cb: () => void) {
  window.addEventListener(CONSENT_UPDATED_EVENT, cb);
  return () => window.removeEventListener(CONSENT_UPDATED_EVENT, cb);
}
// Bandeau cookies validé (accepté ou refusé) : condition pour proposer l'installation.
function cookiesAcceptes() {
  return readConsent() !== null;
}

export default function InstallApp() {
  const peutInstaller = useCanInstall();
  const installee = useIsInstalled();
  const { user } = useAuth();
  const acceptes = useSyncExternalStore(abonnerConsentement, cookiesAcceptes, () => false);
  const guide = useInstallGuide();
  const [refuse, setRefuse] = useState(true);
  const [confirmation, setConfirmation] = useState(false);
  const [aide, setAide] = useState(false);
  const visible = !!user && acceptes && !(installee && !confirmation) && !(refuse && !confirmation);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    try {
       
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRefuse(sessionStorage.getItem(CLE_REFUS) === '1');
    } catch {
      setRefuse(false);
    }
  }, []);

  const fermer = () => {
    setConfirmation(false);
    setAide(false);
    try {
      sessionStorage.setItem(CLE_REFUS, '1');
    } catch {}
    setRefuse(true);
  };

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && fermer();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
     
  }, [visible]);

  useEffect(() => {
    const onInstalled = () => setConfirmation(true);
    window.addEventListener('appinstalled', onInstalled);
    return () => window.removeEventListener('appinstalled', onInstalled);
  }, []);


  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Installer l’application"
      className="fixed inset-x-4 z-50 mx-auto max-w-sm rounded-2xl bg-af-wood p-4 text-af-ivory shadow-2xl sm:left-auto sm:right-4 sm:mx-0"
      style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="" className="h-12 w-12 rounded-xl" />
        <div className="flex-1">
          <p className="font-semibold">{confirmation ? 'Application installée' : 'Installer Afro-food'}</p>
          <p className="text-sm opacity-80">
            {confirmation
              ? 'Retrouvez Afro-food sur votre écran d’accueil ou dans la liste de vos applications.'
              : 'Accès rapide depuis votre écran d’accueil, sur téléphone et ordinateur.'}
          </p>
        </div>
        <button onClick={fermer} aria-label="Fermer" className="px-1 text-xl leading-none opacity-70 hover:opacity-100">
          ×
        </button>
      </div>
      {!confirmation && (
        <button
          onClick={() => (peutInstaller ? promptInstall() : setAide((v) => !v))}
          className="mt-3 w-full rounded-xl bg-af-ocre px-4 py-2 font-semibold text-white hover:bg-af-saffron"
        >
          Installer l&apos;application
        </button>
      )}
      {aide && guide && <p className="mt-3 text-sm opacity-90">{GUIDE_TEXTE[guide]}</p>}
    </div>
  );
}
