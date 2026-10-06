'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { trackNotifBellOpen, trackNotifClick, trackPushToggle } from '@/lib/analytics';
import { activerPush, desactiverPush, etatPush, type PushEtat } from '@/lib/push';
import {
  NOTIFS_UPDATED_EVENT,
  definirSon,
  lireNotifs,
  marquerLue,
  marquerToutesLues,
  sonActif,
  viderNotifs,
  type Notif,
  type NotifRole,
} from '@/lib/notifications';

function typeNotif(id: string): string {
  if (id.startsWith('cmd-')) return 'nouvelle_commande';
  if (id.startsWith('avis-')) return 'avis';
  if (id.startsWith('prete-')) return 'commande_prete';
  return 'statut_commande';
}

function depuis(iso: string): string {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

/** Cloche de notifications avec compteur de non-lues et liste déroulante. */
export default function NotificationBell({ role }: { role: NotifRole }) {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [ouvert, setOuvert] = useState(false);
  const [son, setSon] = useState(true);
  const racine = useRef<HTMLDivElement>(null);
  const [push, setPush] = useState<PushEtat>('inactif');
  const [pushOccupe, setPushOccupe] = useState(false);

  const charger = useCallback(() => {
    setNotifs(lireNotifs(role));
    setSon(sonActif(role));
  }, [role]);

  useEffect(() => {
    charger();
    window.addEventListener(NOTIFS_UPDATED_EVENT, charger);
    window.addEventListener('storage', charger);
    return () => {
      window.removeEventListener(NOTIFS_UPDATED_EVENT, charger);
      window.removeEventListener('storage', charger);
    };
  }, [charger]);

  useEffect(() => {
    if (!ouvert) return;
    const dehors = (e: MouseEvent) => {
      if (racine.current && !racine.current.contains(e.target as Node)) setOuvert(false);
    };
    const echap = (e: KeyboardEvent) => e.key === 'Escape' && setOuvert(false);
    document.addEventListener('mousedown', dehors);
    document.addEventListener('keydown', echap);
    return () => {
      document.removeEventListener('mousedown', dehors);
      document.removeEventListener('keydown', echap);
    };
  }, [ouvert]);

  useEffect(() => {
    if (!ouvert) return;
    let annule = false;
    void etatPush().then((e) => !annule && setPush(e));
    return () => {
      annule = true;
    };
  }, [ouvert]);

  const basculerPush = async () => {
    setPushOccupe(true);
    try {
      const etat = push === 'actif' ? await desactiverPush() : await activerPush();
      setPush(etat);
      if (etat === 'actif' || etat === 'inactif' || etat === 'refuse') trackPushToggle(role, etat);
    } catch {
      setPush(await etatPush());
    } finally {
      setPushOccupe(false);
    }
  };

  const nonLues = notifs.filter((n) => !n.lue).length;

  return (
    <div ref={racine} className="relative">
      <button
        type="button"
        onClick={() => {
          if (!ouvert) trackNotifBellOpen(role, nonLues);
          setOuvert((o) => !o);
        }}
        aria-label={nonLues ? `Notifications, ${nonLues} non lue${nonLues > 1 ? 's' : ''}` : 'Notifications'}
        aria-expanded={ouvert}
        className="relative rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {nonLues > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white ring-2 ring-white">
            {nonLues > 9 ? '9+' : nonLues}
          </span>
        )}
      </button>

      {ouvert && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-12 z-[400] w-[min(92vw,360px)] overflow-hidden rounded-2xl bg-white text-gray-900 shadow-2xl ring-1 ring-gray-200"
        >
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            <div className="flex items-center gap-3 text-xs">
              <button
                type="button"
                onClick={() => definirSon(role, !son)}
                className="text-gray-500 hover:text-gray-800"
                title="Activer ou couper le bip"
              >
                {son ? '🔔 Son' : '🔕 Muet'}
              </button>
              {nonLues > 0 && (
                <button type="button" onClick={() => marquerToutesLues(role)} className="font-semibold text-orange-600 hover:underline">
                  Tout lire
                </button>
              )}
            </div>
          </div>
          <ul className="max-h-[60vh] divide-y divide-gray-100 overflow-y-auto">
            {notifs.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-gray-500">Aucune notification pour le moment.</li>
            ) : (
              notifs.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    onClick={() => {
                      trackNotifClick(role, typeNotif(n.id));
                      marquerLue(role, n.id);
                      setOuvert(false);
                    }}
                    className={`flex gap-3 px-4 py-3 hover:bg-gray-50 ${n.lue ? '' : 'bg-orange-50/60'}`}
                  >
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.lue ? 'bg-transparent' : 'bg-orange-500'}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{n.titre}</span>
                      <span className="block truncate text-sm text-gray-600">{n.detail}</span>
                      <span className="mt-0.5 block text-xs text-gray-400">{depuis(n.date)}</span>
                    </span>
                  </Link>
                </li>
              ))
            )}
          </ul>
          {push !== 'non-supporte' && push !== 'non-configure' && (
            <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-600">
              {push === 'refuse' ? (
                <p>Les notifications sont bloquées pour ce site. Autorisez-les dans les réglages du navigateur (icône à gauche de l&apos;adresse).</p>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <p>
                    {push === 'actif'
                      ? 'Vous êtes prévenu même quand le site est fermé.'
                      : 'Soyez prévenu même quand le site est fermé.'}
                  </p>
                  <button
                    type="button"
                    disabled={pushOccupe}
                    onClick={() => void basculerPush()}
                    className={`shrink-0 rounded-full px-3 py-1.5 font-semibold disabled:opacity-50 ${
                      push === 'actif' ? 'border border-gray-300 text-gray-700' : 'bg-orange-600 text-white'
                    }`}
                  >
                    {push === 'actif' ? 'Désactiver' : 'Activer'}
                  </button>
                </div>
              )}
            </div>
          )}
          {notifs.length > 0 && (
            <button
              type="button"
              onClick={() => viderNotifs(role)}
              className="w-full border-t border-gray-100 px-4 py-2.5 text-xs text-gray-500 hover:bg-gray-50"
            >
              Effacer l&apos;historique
            </button>
          )}
        </div>
      )}
    </div>
  );
}
