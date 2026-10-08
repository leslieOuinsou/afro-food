'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  annulerReversement,
  creerReversement,
  getJournal,
  getRapprochement,
  getReversements,
  getSoldes,
  type LigneJournal,
  type Rapprochement,
  type Reversement,
  type SoldeLivreur,
} from '@/services/caisse';

const money = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
const dateHeure = (iso: string) => new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
const LIBELLE_TYPE: Record<LigneJournal['type'], string> = {
  encaissement: 'Encaissement',
  reversement: 'Reversement',
  annulation_reversement: 'Annulation de reversement',
};

export default function AdminCaissePage() {
  const [livreurs, setLivreurs] = useState<SoldeLivreur[]>([]);
  const [plafond, setPlafond] = useState(0);
  const [total, setTotal] = useState(0);
  const [rapprochement, setRapprochement] = useState<Rapprochement | null>(null);
  const [reversements, setReversements] = useState<Reversement[]>([]);
  const [journal, setJournal] = useState<LigneJournal[]>([]);
  const [selection, setSelection] = useState<Record<string, Set<string>>>({});
  const [erreur, setErreur] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [onglet, setOnglet] = useState<'soldes' | 'reversements' | 'journal'>('soldes');

  const charger = useCallback(async () => {
    const [s, r, rev, j] = await Promise.all([getSoldes(), getRapprochement(), getReversements(), getJournal()]);
    if (!s.success) setErreur(s.message || 'Chargement impossible.');
    else {
      setLivreurs(s.data?.livreurs ?? []);
      setPlafond(s.data?.plafond ?? 0);
      setTotal(s.data?.totalARecevoir ?? 0);
    }
    if (r.success && r.data) setRapprochement(r.data);
    if (rev.success) setReversements(rev.data?.reversements ?? []);
    if (j.success) setJournal(j.data?.lignes ?? []);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void charger();
  }, [charger]);

  const basculer = (livreurId: string, commandeId: string) =>
    setSelection((prev) => {
      const set = new Set(prev[livreurId] ?? []);
      if (set.has(commandeId)) set.delete(commandeId);
      else set.add(commandeId);
      return { ...prev, [livreurId]: set };
    });

  const toutSelectionner = (l: SoldeLivreur) =>
    setSelection((prev) => ({
      ...prev,
      [l.livreur._id]:
        (prev[l.livreur._id]?.size ?? 0) === l.commandes.length ? new Set() : new Set(l.commandes.map((c) => c._id)),
    }));

  const montantSelectionne = (l: SoldeLivreur) =>
    l.commandes.filter((c) => selection[l.livreur._id]?.has(c._id)).reduce((t, c) => t + c.encaisse, 0);

  const reverser = async (l: SoldeLivreur) => {
    const ids = [...(selection[l.livreur._id] ?? [])];
    if (!ids.length) return;
    const montant = money(montantSelectionne(l));
    if (!window.confirm(`Confirmer que ${l.livreur.prenom} ${l.livreur.nom} vous a remis ${montant} en espèces ?`)) return;
    setOccupe(true);
    setErreur('');
    const res = await creerReversement(l.livreur._id, ids);
    setOccupe(false);
    if (!res.success) setErreur(res.message || 'Reversement impossible.');
    else {
      setSelection((prev) => ({ ...prev, [l.livreur._id]: new Set() }));
      await charger();
    }
  };

  const annuler = async (r: Reversement) => {
    const motif = window.prompt(`Motif de l’annulation du reversement de ${money(r.montant)} :`);
    if (!motif) return;
    const res = await annulerReversement(r.id, motif);
    if (!res.success) setErreur(res.message || 'Annulation impossible.');
    else await charger();
  };

  const carte = 'rounded-xl border border-gray-200 bg-white p-4';

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-gray-900">Caisse livreurs</h1>
        <p className="text-sm text-gray-600">
          Espèces encaissées par les livreurs à la livraison, et leur remise à l’administration.
        </p>
        {erreur && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{erreur}</p>}

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className={carte}>
            <p className="text-xs uppercase text-gray-500">Reste à recevoir</p>
            <p className="mt-1 text-xl font-bold text-orange-700">{money(total)}</p>
          </div>
          <div className={carte}>
            <p className="text-xs uppercase text-gray-500">Encaissé aujourd’hui</p>
            <p className="mt-1 text-xl font-bold">{money(rapprochement?.encaisse ?? 0)}</p>
          </div>
          <div className={carte}>
            <p className="text-xs uppercase text-gray-500">Reversé aujourd’hui</p>
            <p className="mt-1 text-xl font-bold">{money(rapprochement?.reverse ?? 0)}</p>
          </div>
          <div className={carte}>
            <p className="text-xs uppercase text-gray-500">Plafond / livreur</p>
            <p className="mt-1 text-xl font-bold">{money(plafond)}</p>
          </div>
        </div>

        <div className="mt-6 flex gap-2 border-b border-gray-200">
          {(
            [
              ['soldes', 'Soldes'],
              ['reversements', 'Reversements'],
              ['journal', 'Journal'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setOnglet(id)}
              className={`px-4 py-2 text-sm font-semibold ${
                onglet === id ? 'border-b-2 border-orange-600 text-orange-700' : 'text-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {onglet === 'soldes' && (
          <div className="mt-4 space-y-4">
            {livreurs.length === 0 && <p className="text-sm text-gray-500">Aucun livreur.</p>}
            {livreurs.map((l) => {
              const sel = selection[l.livreur._id] ?? new Set<string>();
              return (
                <div key={l.livreur._id} className={`${carte} ${l.alerte ? 'border-red-300' : ''}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {l.livreur.prenom} {l.livreur.nom}
                      </p>
                      {l.livreur.telephone && <p className="text-xs text-gray-500">{l.livreur.telephone}</p>}
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${l.solde > 0 ? 'text-orange-700' : 'text-green-700'}`}>
                        {money(l.solde)}
                      </p>
                      <p className="text-xs text-gray-500">{l.nbCommandes} commande(s) à reverser</p>
                    </div>
                  </div>
                  {l.alerte && (
                    <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                      Solde non reversé depuis {l.ageHeures} h.
                    </p>
                  )}
                  {l.plafondAtteint && (
                    <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                      Plafond atteint : ce livreur ne reçoit plus de course en espèces.
                    </p>
                  )}
                  {l.commandes.length > 0 && (
                    <>
                      <table className="mt-3 w-full text-left text-sm">
                        <thead className="text-xs uppercase text-gray-500">
                          <tr>
                            <th className="py-1">
                              <input
                                type="checkbox"
                                aria-label="Tout sélectionner"
                                checked={sel.size === l.commandes.length}
                                onChange={() => toutSelectionner(l)}
                              />
                            </th>
                            <th>Commande</th>
                            <th>Encaissé</th>
                            <th className="hidden sm:table-cell">Écart</th>
                            <th className="hidden sm:table-cell">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {l.commandes.map((c) => (
                            <tr key={c._id}>
                              <td className="py-2">
                                <input
                                  type="checkbox"
                                  checked={sel.has(c._id)}
                                  onChange={() => basculer(l.livreur._id, c._id)}
                                  aria-label={`Sélectionner ${c.numeroCommande}`}
                                />
                              </td>
                              <td className="font-mono">{c.numeroCommande}</td>
                              <td className="font-semibold">{money(c.encaisse)}</td>
                              <td className="hidden sm:table-cell">
                                {c.ecart !== 0 ? (
                                  <span className="text-red-700" title={c.raisonEcart ?? ''}>
                                    {c.ecart > 0 ? '+' : ''}
                                    {money(c.ecart)}
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="hidden text-xs text-gray-500 sm:table-cell">{dateHeure(c.encaisseLe)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-sm text-gray-600">Sélection : {money(montantSelectionne(l))}</p>
                        <button
                          type="button"
                          disabled={sel.size === 0 || occupe}
                          onClick={() => void reverser(l)}
                          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                        >
                          J’ai reçu les espèces
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {onglet === 'reversements' && (
          <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Livreur</th>
                  <th className="px-4 py-2">Montant</th>
                  <th className="px-4 py-2">Commandes</th>
                  <th className="px-4 py-2">Reçu par</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reversements.map((r) => (
                  <tr key={r.id} className={r.annuleLe ? 'text-gray-400 line-through' : ''}>
                    <td className="px-4 py-2">{dateHeure(r.createdAt)}</td>
                    <td className="px-4 py-2">
                      {r.livreur.prenom} {r.livreur.nom}
                    </td>
                    <td className="px-4 py-2 font-semibold">{money(r.montant)}</td>
                    <td className="px-4 py-2 text-xs">{r.commandes.map((c) => c.numeroCommande).join(', ')}</td>
                    <td className="px-4 py-2">
                      {r.admin.prenom} {r.admin.nom}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {!r.annuleLe && (
                        <button type="button" onClick={() => void annuler(r)} className="text-xs font-semibold text-red-700">
                          Annuler
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {reversements.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                      Aucun reversement.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {onglet === 'journal' && (
          <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Opération</th>
                  <th className="px-4 py-2">Livreur</th>
                  <th className="px-4 py-2">Montant</th>
                  <th className="px-4 py-2">Détail</th>
                  <th className="px-4 py-2">Auteur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {journal.map((j) => (
                  <tr key={j.id}>
                    <td className="px-4 py-2">{dateHeure(j.createdAt)}</td>
                    <td className="px-4 py-2">{LIBELLE_TYPE[j.type]}</td>
                    <td className="px-4 py-2">
                      {j.livreur.prenom} {j.livreur.nom}
                    </td>
                    <td className={`px-4 py-2 font-semibold ${j.montant < 0 ? 'text-green-700' : 'text-orange-700'}`}>
                      {j.montant > 0 ? '+' : ''}
                      {money(j.montant)}
                    </td>
                    <td className="px-4 py-2 text-xs">{[j.commande?.numeroCommande, j.note].filter(Boolean).join(' · ')}</td>
                    <td className="px-4 py-2">
                      {j.auteur.prenom} {j.auteur.nom}
                    </td>
                  </tr>
                ))}
                {journal.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                      Journal vide.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
