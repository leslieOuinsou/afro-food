'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { getAvis, type AvisPayload } from '@/services/adminAvis';
import { trackAdminReviewsView } from '@/lib/analytics';

const money = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
const dateHeure = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function Etoiles({ note, taille = 'text-xl' }: { note: number; taille?: string }) {
  return (
    <span className={`${taille} leading-none`} aria-label={`${note} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= note ? 'text-amber-500' : 'text-gray-300'}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function AdminAvisPage() {
  const [data, setData] = useState<AvisPayload | null>(null);
  const [filtre, setFiltre] = useState<number>(0);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    const res = await getAvis({ note: filtre || undefined, limite: 100 });
    if (res.success && res.data) {
      setData(res.data);
      setErreur('');
    } else {
      setErreur(res.message || 'Impossible de charger les avis.');
    }
    setChargement(false);
  }, [filtre]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChargement(true);
    void charger();
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') void charger();
    }, 30000);
    return () => window.clearInterval(t);
  }, [charger]);

  useEffect(() => {
    trackAdminReviewsView(filtre);
  }, [filtre]);

  const total = data?.total ?? 0;

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="mb-1 text-3xl font-bold text-gray-900">Avis clients</h1>
        <p className="text-gray-600">Les notes laissées par les clients après la livraison.</p>
      </div>

      {erreur && <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">{erreur}</p>}

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <p className="mb-2 text-sm font-medium text-gray-500">Note moyenne</p>
          {data?.moyenne != null ? (
            <>
              <p className="text-4xl font-bold text-gray-900">
                {String(data.moyenne).replace('.', ',')} <span className="text-lg font-medium text-gray-400">/ 5</span>
              </p>
              <div className="mt-1">
                <Etoiles note={Math.round(data.moyenne)} />
              </div>
            </>
          ) : (
            <p className="text-gray-400">Aucun avis pour le moment</p>
          )}
          <p className="mt-2 text-sm text-gray-500">{total} avis</p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm md:col-span-2">
          <p className="mb-3 text-sm font-medium text-gray-500">Répartition</p>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((n) => {
              const nb = data?.repartition?.[String(n)] ?? 0;
              const pct = total ? Math.round((nb / total) * 100) : 0;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setFiltre(filtre === n ? 0 : n)}
                  className={`flex w-full items-center gap-3 rounded-md px-2 py-1 text-left text-sm hover:bg-gray-50 ${
                    filtre === n ? 'bg-orange-50 ring-1 ring-orange-300' : ''
                  }`}
                >
                  <span className="w-12 shrink-0 text-gray-700">{n} ★</span>
                  <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <span className="block h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="w-16 shrink-0 text-right text-gray-500">
                    {nb} ({pct} %)
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-gray-500">Filtrer :</span>
        {[0, 5, 4, 3, 2, 1].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setFiltre(n)}
            className={`rounded-full border px-3 py-1 ${
              filtre === n ? 'border-orange-500 bg-orange-500 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {n === 0 ? 'Tous' : `${n} ★`}
          </button>
        ))}
      </div>

      {chargement && !data ? (
        <p className="rounded-lg bg-gray-50 p-4 text-gray-600">Chargement des avis…</p>
      ) : data && data.avis.length === 0 ? (
        <p className="rounded-lg border bg-white p-8 text-center text-gray-500">
          {filtre ? `Aucun avis à ${filtre} étoile${filtre > 1 ? 's' : ''}.` : 'Aucun avis pour le moment.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {data?.avis.map((a) => (
            <li key={a.commandeId} className="rounded-lg border bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Etoiles note={a.note} taille="text-2xl" />
                  <p className="mt-1 font-semibold text-gray-900">{a.client.nom || 'Client'}</p>
                  {a.client.email && <p className="text-sm text-gray-500">{a.client.email}</p>}
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>{dateHeure(a.date)}</p>
                  <p className="font-mono text-gray-700">
                    {a.numeroCommande} · {money(a.total)}
                  </p>
                </div>
              </div>
              {a.commentaire ? (
                <blockquote className="mt-3 border-l-4 border-orange-400 bg-orange-50/50 px-4 py-2 text-gray-800">
                  {a.commentaire}
                </blockquote>
              ) : (
                <p className="mt-3 text-sm italic text-gray-400">Sans commentaire.</p>
              )}
              <a href="/commande-admin" className="mt-3 inline-block text-sm font-medium text-orange-600 hover:underline">
                Voir les commandes →
              </a>
            </li>
          ))}
        </ul>
      )}
    </AdminLayout>
  );
}
