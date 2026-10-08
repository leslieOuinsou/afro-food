'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { getReglagesLivraison, saveCreneaux, saveZones, type ConfigCreneaux, type ConfigZones, type Zone } from '@/services/livraison';

const liste = (v: string) => v.split(/[,\n;]/).map((x) => x.trim()).filter(Boolean);
const champ = 'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal';

export default function AdminLivraisonPage() {
  const [zones, setZones] = useState<ConfigZones>({ actif: false, zones: [] });
  const [creneaux, setCreneaux] = useState<ConfigCreneaux | null>(null);
  const [defauts, setDefauts] = useState({ fraisStandard: 3.9, seuilGratuit: 30 });
  const [message, setMessage] = useState<{ type: 'ok' | 'erreur'; texte: string } | null>(null);
  const [occupe, setOccupe] = useState(false);

  useEffect(() => {
    void getReglagesLivraison().then((r) => {
      if (r.success && r.data) {
        setZones(r.data.zones);
        setCreneaux(r.data.creneaux);
        setDefauts(r.data.defauts);
      }
    });
  }, []);

  const maj = (i: number, patch: Partial<Zone>) => setZones((z) => ({ ...z, zones: z.zones.map((x, k) => (k === i ? { ...x, ...patch } : x)) }));

  const ajouter = () =>
    setZones((z) => ({
      ...z,
      zones: [...z.zones, { id: `z${Date.now().toString(36)}`, nom: `Zone ${z.zones.length + 1}`, codesPostaux: [], villes: [], frais: defauts.fraisStandard, minimumCommande: 0, gratuitDepuis: null }],
    }));

  const enregistrerZones = async () => {
    setOccupe(true);
    const res = await saveZones(zones);
    setOccupe(false);
    setMessage(res.success ? { type: 'ok', texte: 'Zones enregistrées.' } : { type: 'erreur', texte: res.message || 'Enregistrement impossible.' });
  };

  const enregistrerCreneaux = async () => {
    if (!creneaux) return;
    setOccupe(true);
    const res = await saveCreneaux(creneaux);
    setOccupe(false);
    setMessage(res.success ? { type: 'ok', texte: 'Créneaux enregistrés.' } : { type: 'erreur', texte: res.message || 'Enregistrement impossible.' });
  };

  const carte = 'rounded-xl border border-gray-200 bg-white p-4';

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-gray-900">Livraison</h1>
        <p className="text-sm text-gray-600">Zones desservies, frais par zone, et créneaux de livraison programmée.</p>
        {message && (
          <p className={`mt-4 rounded-lg p-3 text-sm ${message.type === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>{message.texte}</p>
        )}

        <section className={`${carte} mt-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-gray-900">Zones de livraison</h2>
              <p className="text-xs text-gray-600">
                Sans zones actives : tarif unique ({defauts.fraisStandard.toFixed(2).replace('.', ',')} €, gratuit dès {defauts.seuilGratuit} €). Avec zones actives, une
                adresse hors zone est refusée.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={zones.actif} onChange={(e) => setZones({ ...zones, actif: e.target.checked })} />
              Limiter la livraison à ces zones
            </label>
          </div>

          <div className="mt-4 space-y-3">
            {zones.zones.map((z, i) => (
              <div key={z.id} className="rounded-lg border border-gray-200 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-gray-700">
                    Nom de la zone
                    <input className={champ} value={z.nom} onChange={(e) => maj(i, { nom: e.target.value })} />
                  </label>
                  <label className="text-xs font-semibold text-gray-700">
                    Codes postaux ou préfixes (séparés par des virgules)
                    <input className={champ} value={z.codesPostaux.join(', ')} onChange={(e) => maj(i, { codesPostaux: liste(e.target.value) })} placeholder="75, 92, 93100" />
                  </label>
                  <label className="text-xs font-semibold text-gray-700 sm:col-span-2">
                    Villes (facultatif)
                    <input className={champ} value={z.villes.join(', ')} onChange={(e) => maj(i, { villes: liste(e.target.value) })} placeholder="Saint-Denis, Montreuil" />
                  </label>
                  <label className="text-xs font-semibold text-gray-700">
                    Frais de livraison (€)
                    <input className={champ} inputMode="decimal" value={z.frais} onChange={(e) => maj(i, { frais: Number(e.target.value.replace(',', '.')) || 0 })} />
                  </label>
                  <label className="text-xs font-semibold text-gray-700">
                    Commande minimum (€)
                    <input className={champ} inputMode="decimal" value={z.minimumCommande} onChange={(e) => maj(i, { minimumCommande: Number(e.target.value.replace(',', '.')) || 0 })} />
                  </label>
                  <label className="text-xs font-semibold text-gray-700">
                    Livraison offerte dès (€) — vide = seuil général
                    <input
                      className={champ}
                      inputMode="decimal"
                      value={z.gratuitDepuis ?? ''}
                      onChange={(e) => maj(i, { gratuitDepuis: e.target.value === '' ? null : Number(e.target.value.replace(',', '.')) || 0 })}
                    />
                  </label>
                  <div className="flex items-end justify-end">
                    <button type="button" onClick={() => setZones((c) => ({ ...c, zones: c.zones.filter((_, k) => k !== i) }))} className="text-sm font-semibold text-red-700 underline">
                      Supprimer cette zone
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {zones.zones.length === 0 && <p className="text-sm text-gray-500">Aucune zone définie.</p>}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={ajouter} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50">
              + Ajouter une zone
            </button>
            <button type="button" disabled={occupe} onClick={() => void enregistrerZones()} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50">
              Enregistrer les zones
            </button>
          </div>
        </section>

        {creneaux && (
          <section className={`${carte} mt-5`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-gray-900">Livraison programmée</h2>
                <p className="text-xs text-gray-600">Le client peut choisir un créneau précis au lieu de « dès que possible ».</p>
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={creneaux.actif} onChange={(e) => setCreneaux({ ...creneaux, actif: e.target.checked })} />
                Activer les créneaux
              </label>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="text-xs font-semibold text-gray-700">
                Première livraison
                <input type="time" className={champ} value={creneaux.ouverture} onChange={(e) => setCreneaux({ ...creneaux, ouverture: e.target.value })} />
              </label>
              <label className="text-xs font-semibold text-gray-700">
                Dernière heure de fin
                <input type="time" className={champ} value={creneaux.fermeture} onChange={(e) => setCreneaux({ ...creneaux, fermeture: e.target.value })} />
              </label>
              <label className="text-xs font-semibold text-gray-700">
                Durée d’un créneau
                <select className={champ} value={creneaux.pasMinutes} onChange={(e) => setCreneaux({ ...creneaux, pasMinutes: Number(e.target.value) })}>
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={60}>1 h</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-gray-700">
                Délai minimum avant livraison (min)
                <input className={champ} inputMode="numeric" value={creneaux.delaiMinimumMinutes} onChange={(e) => setCreneaux({ ...creneaux, delaiMinimumMinutes: Number(e.target.value) || 60 })} />
              </label>
              <label className="text-xs font-semibold text-gray-700">
                Jours ouverts à la réservation
                <input className={champ} inputMode="numeric" value={creneaux.joursMax} onChange={(e) => setCreneaux({ ...creneaux, joursMax: Number(e.target.value) || 3 })} />
              </label>
              <label className="text-xs font-semibold text-gray-700">
                Commandes max par créneau
                <input className={champ} inputMode="numeric" value={creneaux.capaciteParCreneau} onChange={(e) => setCreneaux({ ...creneaux, capaciteParCreneau: Number(e.target.value) || 8 })} />
              </label>
            </div>
            <button type="button" disabled={occupe} onClick={() => void enregistrerCreneaux()} className="mt-4 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50">
              Enregistrer les créneaux
            </button>
          </section>
        )}
      </div>
    </AdminLayout>
  );
}
