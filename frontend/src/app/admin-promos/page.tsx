'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  getPromos,
  createPromo,
  updatePromo,
  togglePromo,
  deletePromo,
  type PromoCode,
  type PromoInput,
  type TypeRemise,
} from '@/services/adminPromos';

type FormState = {
  code: string;
  description: string;
  typeRemise: TypeRemise;
  valeur: string;
  montantMax: string;
  montantMinimum: string;
  usageParClient: string;
  premiereCommandeSeulement: boolean;
  categories: string;
  utilisationsMax: string;
  dateDebut: string;
  dateFin: string;
  actif: boolean;
};

const FORM_VIDE: FormState = {
  code: '',
  description: '',
  typeRemise: 'pourcentage',
  valeur: '',
  montantMax: '',
  montantMinimum: '',
  usageParClient: '',
  premiereCommandeSeulement: false,
  categories: '',
  utilisationsMax: '',
  dateDebut: '',
  dateFin: '',
  actif: true,
};

const toDateInput = (iso?: string | null) => (iso ? iso.slice(0, 10) : '');

function formDepuisPromo(p: PromoCode): FormState {
  return {
    code: p.code,
    description: p.description ?? '',
    typeRemise: p.typeRemise,
    valeur: String(p.valeur),
    montantMax: p.montantMax != null ? String(p.montantMax) : '',
    montantMinimum: p.montantMinimum != null ? String(p.montantMinimum) : '',
    usageParClient: p.usageParClient != null ? String(p.usageParClient) : '',
    premiereCommandeSeulement: p.premiereCommandeSeulement,
    categories: (p.categories ?? []).join(', '),
    utilisationsMax: p.utilisationsMax != null ? String(p.utilisationsMax) : '',
    dateDebut: toDateInput(p.dateDebut),
    dateFin: toDateInput(p.dateFin),
    actif: p.actif,
  };
}

function inputDepuisForm(f: FormState): PromoInput {
  return {
    code: f.code.trim().toUpperCase(),
    description: f.description.trim(),
    typeRemise: f.typeRemise,
    valeur: f.typeRemise === 'livraison' ? 0 : Number(f.valeur),
    montantMax: f.montantMax ? Number(f.montantMax) : null,
    montantMinimum: f.montantMinimum ? Number(f.montantMinimum) : null,
    usageParClient: f.usageParClient ? Number(f.usageParClient) : null,
    premiereCommandeSeulement: f.premiereCommandeSeulement,
    categories: f.categories.split(',').map((c) => c.trim()).filter(Boolean),
    utilisationsMax: f.utilisationsMax ? Number(f.utilisationsMax) : null,
    dateDebut: f.dateDebut || undefined,
    dateFin: f.dateFin || null,
    actif: f.actif,
  };
}

function statutPromo(p: PromoCode): { label: string; classe: string } {
  const now = Date.now();
  if (!p.actif) return { label: 'Désactivé', classe: 'bg-gray-100 text-gray-700' };
  if (p.dateFin && new Date(p.dateFin).getTime() < now) return { label: 'Expiré', classe: 'bg-red-100 text-red-800' };
  if (new Date(p.dateDebut).getTime() > now) return { label: 'Programmé', classe: 'bg-blue-100 text-blue-800' };
  if (p.utilisationsMax != null && p.utilisations >= p.utilisationsMax)
    return { label: 'Épuisé', classe: 'bg-amber-100 text-amber-800' };
  return { label: 'Actif', classe: 'bg-green-100 text-green-800' };
}

const formatRemise = (p: PromoCode) =>
  p.typeRemise === 'livraison'
    ? 'Livraison offerte'
    : p.typeRemise === 'pourcentage'
      ? `${p.valeur} %${p.montantMax != null ? ` (max ${p.montantMax} €)` : ''}`
      : `${p.valeur} €`;

const conditionsPromo = (p: PromoCode) =>
  [
    p.montantMinimum != null ? `dès ${p.montantMinimum} €` : '',
    p.premiereCommandeSeulement ? '1re commande' : '',
    p.usageParClient != null ? `${p.usageParClient}×/client` : '',
    p.categories?.length ? p.categories.join(', ') : '',
  ].filter(Boolean);

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recherche, setRecherche] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(FORM_VIDE);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getPromos({ recherche: recherche.trim() || undefined });
    if (res.error) setError(res.error);
    else setPromos(res.data ?? []);
    setLoading(false);
  }, [recherche]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 250);
    return () => clearTimeout(t);
  }, [load]);

  const ouvrirCreation = () => {
    setEditingId(null);
    setForm(FORM_VIDE);
    setFormError(null);
    setShowForm(true);
  };

  const ouvrirEdition = (p: PromoCode) => {
    setEditingId(p._id);
    setForm(formDepuisPromo(p));
    setFormError(null);
    setShowForm(true);
  };

  const enregistrer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    const input = inputDepuisForm(form);
    const res = editingId ? await updatePromo(editingId, input) : await createPromo(input);
    setSaving(false);
    if (res.error) {
      setFormError(res.error);
      return;
    }
    setShowForm(false);
    await load();
  };

  const basculer = async (p: PromoCode) => {
    const res = await togglePromo(p._id);
    if (res.error) setError(res.error);
    else await load();
  };

  const supprimer = async (p: PromoCode) => {
    if (!window.confirm(`Supprimer le code ${p.code} ? Cette action est définitive.`)) return;
    const res = await deletePromo(p._id);
    if (res.error) setError(res.error);
    else await load();
  };

  const champ = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500';

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Codes promo</h1>
            <p className="text-sm text-gray-600">Créez et gérez les remises appliquées au panier.</p>
          </div>
          <button
            type="button"
            onClick={ouvrirCreation}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
          >
            + Nouveau code
          </button>
        </div>

        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un code…"
          className={`${champ} mb-4 max-w-sm`}
        />

        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Remise</th>
                <th className="px-4 py-3">Validité</th>
                <th className="px-4 py-3">Utilisations</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Chargement…</td></tr>
              ) : promos.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Aucun code promo.</td></tr>
              ) : (
                promos.map((p) => {
                  const statut = statutPromo(p);
                  return (
                    <tr key={p._id}>
                      <td className="px-4 py-3">
                        <div className="font-mono font-semibold text-gray-900">{p.code}</div>
                        {p.description && <div className="text-xs text-gray-500">{p.description}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div>{formatRemise(p)}</div>
                        {conditionsPromo(p).length > 0 && (
                          <div className="text-xs text-gray-500">{conditionsPromo(p).join(' · ')}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {toDateInput(p.dateDebut)} → {p.dateFin ? toDateInput(p.dateFin) : '∞'}
                      </td>
                      <td className="px-4 py-3">
                        {p.utilisations}{p.utilisationsMax != null ? ` / ${p.utilisationsMax}` : ''}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${statut.classe}`}>{statut.label}</span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button type="button" onClick={() => void basculer(p)} className="mr-3 text-xs font-medium text-blue-700 hover:underline">
                          {p.actif ? 'Désactiver' : 'Activer'}
                        </button>
                        <button type="button" onClick={() => ouvrirEdition(p)} className="mr-3 text-xs font-medium text-orange-700 hover:underline">
                          Modifier
                        </button>
                        <button type="button" onClick={() => void supprimer(p)} className="text-xs font-medium text-red-700 hover:underline">
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={enregistrer} className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Modifier le code' : 'Nouveau code promo'}</h2>

            <label className="block text-sm">
              <span className="font-medium text-gray-700">Code</span>
              <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="BIENVENUE5" className={`${champ} mt-1 font-mono uppercase`} />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-gray-700">Description</span>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${champ} mt-1`} />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="font-medium text-gray-700">Type</span>
                <select value={form.typeRemise} onChange={(e) => setForm({ ...form, typeRemise: e.target.value as TypeRemise })} className={`${champ} mt-1`}>
                  <option value="pourcentage">Pourcentage (%)</option>
                  <option value="fixe">Montant fixe (€)</option>
                  <option value="livraison">Livraison offerte</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium text-gray-700">Valeur</span>
                <input required={form.typeRemise !== 'livraison'} disabled={form.typeRemise === 'livraison'} type="number" min="0.01" step="0.01" value={form.typeRemise === 'livraison' ? '' : form.valeur} onChange={(e) => setForm({ ...form, valeur: e.target.value })} className={`${champ} mt-1 disabled:bg-gray-100`} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="font-medium text-gray-700">Remise max (€)</span>
                <input type="number" min="0.01" step="0.01" value={form.montantMax} onChange={(e) => setForm({ ...form, montantMax: e.target.value })} disabled={form.typeRemise !== 'pourcentage'} className={`${champ} mt-1 disabled:bg-gray-100`} />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-gray-700">Utilisations max</span>
                <input type="number" min="1" step="1" value={form.utilisationsMax} onChange={(e) => setForm({ ...form, utilisationsMax: e.target.value })} placeholder="Illimité" className={`${champ} mt-1`} />
              </label>
            </div>

            <fieldset className="space-y-3 rounded-lg border border-gray-200 p-3">
              <legend className="px-1 text-xs font-semibold uppercase text-gray-500">Conditions</legend>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="font-medium text-gray-700">Panier minimum (€)</span>
                  <input type="number" min="0.01" step="0.01" value={form.montantMinimum} onChange={(e) => setForm({ ...form, montantMinimum: e.target.value })} placeholder="Aucun" className={`${champ} mt-1`} />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-gray-700">Utilisations par client</span>
                  <input type="number" min="1" step="1" value={form.usageParClient} onChange={(e) => setForm({ ...form, usageParClient: e.target.value })} placeholder="Illimité" className={`${champ} mt-1`} />
                </label>
              </div>
              <label className="block text-sm">
                <span className="font-medium text-gray-700">Catégories concernées</span>
                <input value={form.categories} onChange={(e) => setForm({ ...form, categories: e.target.value })} placeholder="Toutes (ou ex. boissons, desserts)" className={`${champ} mt-1`} />
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.premiereCommandeSeulement} onChange={(e) => setForm({ ...form, premiereCommandeSeulement: e.target.checked })} />
                Réservé à la première commande
              </label>
            </fieldset>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="font-medium text-gray-700">Début</span>
                <input type="date" value={form.dateDebut} onChange={(e) => setForm({ ...form, dateDebut: e.target.value })} className={`${champ} mt-1`} />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-gray-700">Fin</span>
                <input type="date" value={form.dateFin} onChange={(e) => setForm({ ...form, dateFin: e.target.value })} className={`${champ} mt-1`} />
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.actif} onChange={(e) => setForm({ ...form, actif: e.target.checked })} />
              Code actif
            </label>

            {formError && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</div>}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Annuler
              </button>
              <button type="submit" disabled={saving} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50">
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}
