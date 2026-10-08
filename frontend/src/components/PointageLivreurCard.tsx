'use client';

import { useCallback, useEffect, useState } from 'react';
import { debutPointage, finPointage, getMonPointage, type MonPointage } from '@/services/paie';

const money = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
const duree = (min: number) => `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`;
const jourLisible = (j: string) =>
  new Date(`${j}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

/** Pointage du livreur : début/fin de service, heures du jour, gain estimé et historique des paies. */
export default function PointageLivreurCard() {
  const [data, setData] = useState<MonPointage | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState('');
  const [maintenant, setMaintenant] = useState(0);

  const charger = useCallback(async () => {
    const res = await getMonPointage();
    if (res.success && res.data) setData(res.data);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMaintenant(Date.now());
    void charger();
    // Chronomètre et rafraîchissement : le compteur avance sans recharger la page
    const t = window.setInterval(() => {
      setMaintenant(Date.now());
      if (document.visibilityState === 'visible') void charger();
    }, 30000);
    return () => window.clearInterval(t);
  }, [charger]);

  const basculer = async () => {
    if (!data) return;
    if (data.enService && !window.confirm('Terminer votre service ? Les heures seront comptées jusqu’à maintenant.')) return;
    setOccupe(true);
    setErreur('');
    const res = data.enService ? await finPointage() : await debutPointage();
    setOccupe(false);
    if (!res.success) setErreur(res.message || 'Action impossible.');
    await charger();
  };

  if (!data) return null;

  const minutesSession = data.debutSession && maintenant ? Math.max(0, Math.floor((maintenant - new Date(data.debutSession).getTime()) / 60000)) : 0;

  return (
    <section className="mt-4 rounded-2xl border border-[var(--wood)]/10 bg-white/70 p-4" aria-label="Mon service et ma paie">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--wood)]/60">Ma journée</p>
          <p className="mt-1 text-sm">
            {data.enService ? (
              <span className="font-semibold text-green-700">En service depuis {duree(minutesSession)}</span>
            ) : (
              <span className="text-[var(--wood)]/70">Hors service</span>
            )}
          </p>
        </div>
        <button
          type="button"
          disabled={occupe}
          onClick={() => void basculer()}
          className={`rounded-full px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${
            data.enService ? 'bg-[var(--brick)]' : 'bg-green-700 hover:bg-green-800'
          }`}
        >
          {data.enService ? 'Je termine mon service' : 'Je commence mon service'}
        </button>
      </div>
      {erreur && <p className="mt-2 text-sm text-red-700">{erreur}</p>}

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-[var(--ivory)] p-3">
          <p className="text-xs text-[var(--wood)]/60">Heures</p>
          <p className="mt-1 font-semibold">{duree(data.aujourdhui.minutes + 0)}</p>
        </div>
        <div className="rounded-xl bg-[var(--ivory)] p-3">
          <p className="text-xs text-[var(--wood)]/60">Livraisons</p>
          <p className="mt-1 font-semibold">{data.aujourdhui.nbLivraisons}</p>
        </div>
        <div className="rounded-xl bg-[var(--ivory)] p-3">
          <p className="text-xs text-[var(--wood)]/60">Gain estimé</p>
          <p className="mt-1 font-semibold text-[var(--ochre)]">{money(data.aujourdhui.gainEstime)}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-[var(--wood)]/60">Taux : {money(data.tauxHoraire)} de l’heure, payé chaque jour.</p>

      {data.jours.length > 0 && (
        <ul className="mt-4 divide-y divide-[var(--wood)]/10 text-sm">
          {data.jours.slice(0, 10).map((j) => {
            const paye = j.minutesAPayer === 0 && j.minutesPayees > 0 && !j.enCours;
            return (
              <li key={j.jour} className="flex items-center justify-between gap-3 py-2">
                <span>
                  <span className="font-semibold capitalize">{jourLisible(j.jour)}</span>
                  <span className="ml-2 text-xs text-[var(--wood)]/60">
                    {duree(j.minutesAPayer + j.minutesPayees)} · {j.nbLivraisons} livraison{j.nbLivraisons > 1 ? 's' : ''}
                  </span>
                </span>
                <span className={`text-xs font-semibold ${paye ? 'text-green-700' : 'text-[var(--ochre)]'}`}>
                  {j.enCours ? 'En cours' : paye ? `Payé ${money(j.montantPaye ?? 0)}` : `À payer ${money(j.montantAPayer)}`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
