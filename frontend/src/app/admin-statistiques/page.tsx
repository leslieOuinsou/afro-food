'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { getStatsAvancees, telechargerExport, type StatsAvancees } from '@/services/stats';

const money = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
const jourCourt = (j: string) => new Date(`${j}T12:00:00`).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
const LIBELLE_MODE: Record<string, string> = { carte: 'Carte', virement: 'Virement', mobile: 'Mobile Money', especes: 'Espèces' };
const iso = (d: Date) => d.toISOString().slice(0, 10);

function Barres({ donnees, couleur = '#C2610F', format }: { donnees: { etiquette: string; valeur: number }[]; couleur?: string; format: (n: number) => string }) {
  const max = Math.max(1, ...donnees.map((d) => d.valeur));
  const pas = Math.max(1, Math.ceil(donnees.length / 12));
  return (
    <div role="img" aria-label="Graphique en barres">
      <div className="flex h-44 items-end gap-[3px]">
        {donnees.map((d, i) => (
          <div key={`${d.etiquette}-${i}`} className="group relative flex h-full flex-1 items-end">
            <div className="w-full rounded-t" style={{ height: `${(d.valeur / max) * 100}%`, minHeight: d.valeur > 0 ? 3 : 0, background: couleur }} />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
              {d.etiquette} : {format(d.valeur)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-[3px] text-[10px] text-gray-500">
        {donnees.map((d, i) => (
          <span key={`${d.etiquette}-l${i}`} className="flex-1 text-center">
            {i % pas === 0 ? d.etiquette : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AdminStatistiquesPage() {
  const [aujourdhui, setAujourdhui] = useState('');
  const [du, setDu] = useState('');
  const [au, setAu] = useState('');
  const [stats, setStats] = useState<StatsAvancees | null>(null);
  const [erreur, setErreur] = useState('');
  const [exportEnCours, setExportEnCours] = useState('');

  // Période par défaut (30 derniers jours), calculée côté navigateur après l'affichage
  useEffect(() => {
    const maintenant = Date.now();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAujourdhui(iso(new Date(maintenant)));
    setDu(iso(new Date(maintenant - 29 * 24 * 3600 * 1000)));
    setAu(iso(new Date(maintenant)));
  }, []);

  const charger = useCallback(async () => {
    if (!du || !au) return;
    const res = await getStatsAvancees(du, au);
    if (!res.success) setErreur(res.message || 'Chargement impossible.');
    else {
      setErreur('');
      setStats(res.data ?? null);
    }
  }, [du, au]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void charger();
  }, [charger]);

  const periode = (jours: number) => {
    const fin = new Date();
    const debut = new Date(fin);
    debut.setDate(fin.getDate() - (jours - 1));
    setDu(iso(debut));
    setAu(iso(fin));
  };

  const exporter = async (type: 'ventes' | 'caisse' | 'paie') => {
    setExportEnCours(type);
    const err = await telechargerExport(type, du, au);
    setExportEnCours('');
    if (err) setErreur(err);
  };

  const carte = 'rounded-xl border border-gray-200 bg-white p-4';
  const maxPlat = Math.max(1, ...(stats?.topPlats.map((p) => p.quantite) ?? [1]));
  const totalModes = Object.values(stats?.modesPaiement ?? {}).reduce((t, n) => t + n, 0) || 1;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-gray-900">Statistiques</h1>
        <p className="text-sm text-gray-600">Chiffre d’affaires, plats les plus vendus, heures de pointe et exports comptables.</p>
        {erreur && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{erreur}</p>}

        <div className="mt-5 flex flex-wrap items-end gap-3">
          {[7, 30, 90].map((j) => (
            <button key={j} onClick={() => periode(j)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold hover:bg-gray-50">
              {j} jours
            </button>
          ))}
          <label className="text-xs font-semibold text-gray-700">
            Du
            <input type="date" value={du} max={au} onChange={(e) => setDu(e.target.value)} className="mt-1 block rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-normal" />
          </label>
          <label className="text-xs font-semibold text-gray-700">
            Au
            <input type="date" value={au} min={du} max={aujourdhui} onChange={(e) => setAu(e.target.value)} className="mt-1 block rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-normal" />
          </label>
        </div>

        {stats && (
          <>
            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className={carte}>
                <p className="text-xs uppercase text-gray-500">Chiffre d’affaires TTC</p>
                <p className="mt-1 text-xl font-bold text-orange-700">{money(stats.chiffreAffaires)}</p>
                <p className="text-xs text-gray-500">HT {money(stats.chiffreAffairesHT)} · TVA {money(stats.tva)}</p>
              </div>
              <div className={carte}>
                <p className="text-xs uppercase text-gray-500">Commandes</p>
                <p className="mt-1 text-xl font-bold">{stats.commandes}</p>
                <p className="text-xs text-gray-500">{stats.commandesPayees} payées</p>
              </div>
              <div className={carte}>
                <p className="text-xs uppercase text-gray-500">Panier moyen</p>
                <p className="mt-1 text-xl font-bold">{money(stats.panierMoyen)}</p>
              </div>
              <div className={carte}>
                <p className="text-xs uppercase text-gray-500">Annulations</p>
                <p className="mt-1 text-xl font-bold">{stats.annulees}</p>
                <p className="text-xs text-gray-500">{String(stats.tauxAnnulation).replace('.', ',')} % des commandes</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className={carte}>
                <p className="mb-3 text-sm font-semibold text-gray-900">Chiffre d’affaires par jour</p>
                <Barres donnees={stats.parJour.map((j) => ({ etiquette: jourCourt(j.jour), valeur: j.chiffreAffaires }))} format={money} />
              </div>
              <div className={carte}>
                <p className="mb-3 text-sm font-semibold text-gray-900">Heures de pointe (commandes)</p>
                <Barres
                  couleur="#2C1A0E"
                  donnees={stats.heuresDePointe.map((h) => ({ etiquette: `${h.heure} h`, valeur: h.commandes }))}
                  format={(n) => `${n} commande${n > 1 ? 's' : ''}`}
                />
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className={carte}>
                <p className="mb-3 text-sm font-semibold text-gray-900">Plats les plus vendus</p>
                {stats.topPlats.length === 0 && <p className="text-sm text-gray-500">Aucune vente sur la période.</p>}
                <ul className="space-y-2">
                  {stats.topPlats.map((p) => (
                    <li key={p.nom}>
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="truncate font-medium text-gray-900">{p.nom}</span>
                        <span className="shrink-0 text-gray-600">
                          {p.quantite} · {money(p.chiffreAffaires)}
                        </span>
                      </div>
                      <div className="mt-1 h-2 rounded bg-gray-100">
                        <div className="h-2 rounded bg-orange-600" style={{ width: `${(p.quantite / maxPlat) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={carte}>
                <p className="mb-3 text-sm font-semibold text-gray-900">Modes de paiement</p>
                <ul className="space-y-2">
                  {Object.entries(stats.modesPaiement).map(([mode, n]) => (
                    <li key={mode}>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-900">{LIBELLE_MODE[mode] ?? mode}</span>
                        <span className="text-gray-600">
                          {n} · {Math.round((n / totalModes) * 100)} %
                        </span>
                      </div>
                      <div className="mt-1 h-2 rounded bg-gray-100">
                        <div className="h-2 rounded bg-gray-800" style={{ width: `${(n / totalModes) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                  {Object.keys(stats.modesPaiement).length === 0 && <li className="text-sm text-gray-500">Aucune commande sur la période.</li>}
                </ul>
              </div>
            </div>
          </>
        )}

        <div className={`${carte} mt-4`}>
          <p className="text-sm font-semibold text-gray-900">Exports comptables (CSV, période sélectionnée)</p>
          <p className="text-xs text-gray-600">Ouvrables directement dans Excel ou Google Sheets, à transmettre à votre comptable.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(
              [
                ['ventes', 'Ventes (factures, TVA)'],
                ['caisse', 'Caisse espèces'],
                ['paie', 'Paie des livreurs'],
              ] as const
            ).map(([type, label]) => (
              <button
                key={type}
                onClick={() => void exporter(type)}
                disabled={exportEnCours !== ''}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {exportEnCours === type ? 'Export…' : `Exporter : ${label}`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
