'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { getConfigFidelite, saveConfigFidelite, type ConfigFidelite } from '@/services/fidelite';

const champ = 'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal';

export default function AdminFidelitePage() {
  const [cfg, setCfg] = useState<ConfigFidelite | null>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'erreur'; texte: string } | null>(null);
  const [occupe, setOccupe] = useState(false);

  useEffect(() => {
    void getConfigFidelite().then((r) => {
      if (r.success && r.data) setCfg(r.data);
    });
  }, []);

  const enregistrer = async () => {
    if (!cfg) return;
    setOccupe(true);
    const res = await saveConfigFidelite(cfg);
    setOccupe(false);
    setMessage(res.success ? { type: 'ok', texte: 'Programme enregistré.' } : { type: 'erreur', texte: res.message || 'Enregistrement impossible.' });
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-gray-900">Programme de fidélité</h1>
        <p className="text-sm text-gray-600">Les clients gagnent des points à chaque commande livrée et les échangent contre des codes de réduction.</p>
        {message && (
          <p className={`mt-4 rounded-lg p-3 text-sm ${message.type === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>{message.texte}</p>
        )}
        {cfg && (
          <div className="mt-5 max-w-2xl rounded-xl border border-gray-200 bg-white p-4">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={cfg.actif} onChange={(e) => setCfg({ ...cfg, actif: e.target.checked })} />
              Programme actif
            </label>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-gray-700">
                Points gagnés par euro dépensé
                <input className={champ} inputMode="decimal" value={cfg.pointsParEuro} onChange={(e) => setCfg({ ...cfg, pointsParEuro: Number(e.target.value.replace(',', '.')) || 1 })} />
              </label>
              <label className="text-xs font-semibold text-gray-700">
                Validité d’un code (jours)
                <input className={champ} inputMode="numeric" value={cfg.validiteJours} onChange={(e) => setCfg({ ...cfg, validiteJours: Number(e.target.value) || 90 })} />
              </label>
            </div>
            <p className="mt-5 text-sm font-semibold text-gray-900">Paliers de récompense</p>
            <div className="mt-2 space-y-2">
              {cfg.paliers.map((p, i) => (
                <div key={i} className="flex flex-wrap items-end gap-3">
                  <label className="text-xs font-semibold text-gray-700">
                    Points
                    <input
                      className={`${champ} w-28`}
                      inputMode="numeric"
                      value={p.points}
                      onChange={(e) => setCfg({ ...cfg, paliers: cfg.paliers.map((x, k) => (k === i ? { ...x, points: Number(e.target.value) || 0 } : x)) })}
                    />
                  </label>
                  <label className="text-xs font-semibold text-gray-700">
                    Réduction (€)
                    <input
                      className={`${champ} w-28`}
                      inputMode="decimal"
                      value={p.remise}
                      onChange={(e) => setCfg({ ...cfg, paliers: cfg.paliers.map((x, k) => (k === i ? { ...x, remise: Number(e.target.value.replace(',', '.')) || 0 } : x)) })}
                    />
                  </label>
                  <button type="button" onClick={() => setCfg({ ...cfg, paliers: cfg.paliers.filter((_, k) => k !== i) })} className="pb-2 text-sm font-semibold text-red-700 underline">
                    Retirer
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-3">
              <button type="button" onClick={() => setCfg({ ...cfg, paliers: [...cfg.paliers, { points: 100, remise: 5 }] })} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50">
                + Ajouter un palier
              </button>
              <button type="button" disabled={occupe} onClick={() => void enregistrer()} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50">
                Enregistrer
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
