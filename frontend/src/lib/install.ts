'use client';

import { useSyncExternalStore } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallGuide = 'ios' | 'safari-mac' | 'firefox-desktop' | 'menu' | null;

const CLE_INSTALLEE = 'afro-installee';
const listeners = new Set<() => void>();
let evenement: BeforeInstallPromptEvent | null = null;
let installee = false;

function notifier() {
  listeners.forEach((l) => l());
}

function enStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function marquerInstallee() {
  installee = true;
  evenement = null;
  try {
    localStorage.setItem(CLE_INSTALLEE, '1');
  } catch {}
  notifier();
}

// Capte beforeinstallprompt dès le chargement du module (avant le rendu React).
if (typeof window !== 'undefined') {
  try {
    installee = localStorage.getItem(CLE_INSTALLEE) === '1';
  } catch {}
  if (enStandalone()) installee = true;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    evenement = e as BeforeInstallPromptEvent;
    notifier();
  });
  window.addEventListener('appinstalled', marquerInstallee);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useCanInstall() {
  return useSyncExternalStore(subscribe, () => evenement !== null && !installee, () => false);
}

export function useIsInstalled() {
  return useSyncExternalStore(subscribe, () => installee, () => false);
}

export async function promptInstall(): Promise<boolean> {
  if (!evenement) return false;
  const e = evenement;
  await e.prompt();
  const { outcome } = await e.userChoice;
  evenement = null;
  if (outcome === 'accepted') marquerInstallee();
  else notifier();
  return outcome === 'accepted';
}

/** Consigne manuelle quand le navigateur n'offre pas de bouton d'installation. */
export function getInstallGuide(): InstallGuide {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (ios) return 'ios';
  if (/firefox|fxios/i.test(ua)) return /android|mobile/i.test(ua) ? 'menu' : 'firefox-desktop';
  if (/safari/i.test(ua) && !/chrome|chromium|crios|edg/i.test(ua)) return 'safari-mac';
  return 'menu';
}

export const GUIDE_TEXTE: Record<Exclude<InstallGuide, null>, string> = {
  ios: 'Touchez Partager dans Safari, puis « Sur l’écran d’accueil ».',
  'safari-mac': 'Dans Safari : menu Fichier > Ajouter au Dock.',
  'firefox-desktop': 'Firefox ne permet pas d’installer l’app sur ordinateur. Ouvrez le site dans Chrome ou Edge.',
  menu: 'Ouvrez le menu ⋮ du navigateur, puis « Installer l’application ».',
};

const noop = () => () => {};
export function useInstallGuide(): InstallGuide {
  return useSyncExternalStore(noop, getInstallGuide, () => null);
}
