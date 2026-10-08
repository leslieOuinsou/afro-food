'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { getEntreprise, saveEntreprise, type Entreprise } from '@/services/entreprise';

const CHAMPS: { cle: keyof Entreprise; label: string; placeholder: string; large?: boolean }[] = [
  { cle: 'nom', label: 'Raison sociale / nom commercial', placeholder: 'Afro-food SAS', large: true },
  { cle: 'formeJuridique', label: 'Forme juridique et capital', placeholder: 'SAS au capital de 1 000 €', large: true },
  { cle: 'adresse', label: 'Adresse', placeholder: '10 rue du Marché', large: true },
  { cle: 'codePostal', label: 'Code postal', placeholder: '75011' },
  { cle: 'ville', label: 'Ville', placeholder: 'Paris' },
  { cle: 'siret', label: 'SIRET', placeholder: '123 456 789 00012' },
  { cle: 'tvaIntra', label: 'N° de TVA intracommunautaire', placeholder: 'FR12345678901' },
  { cle: 'email', label: 'E-mail de contact', placeholder: 'contact@afro-food.fr' },
  { cle: 'telephone', label: 'Téléphone', placeholder: '01 23 45 67 89' },
];

export default function AdminEntreprisePage() {
  const [form, setForm] = useState<Entreprise | null>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'erreur'; texte: string } | null>(null);
  const [occupe, setOccupe] = useState(false);

  useEffect(() => {
    void getEntreprise().then((r) => {
      if (r.success && r.data) setForm(r.data);
    });
  }, []);

  const enregistrer = async () => {
    if (!form) return;
    setOccupe(true);
    setMessage(null);
    const res = await saveEntreprise(form);
    setOccupe(false);
    setMessage(res.success ? { type: 'ok', texte: 'Informations enregistrées. Elles apparaissent sur les prochaines factures.' } : { type: 'erreur', texte: res.message || 'Enregistrement impossible.' });
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-gray-900">Informations de l’entreprise</h1>
        <p className="text-sm text-gray-600">
          Ces informations légales figurent sur les factures et les fiches de paie. Renseignez-les avant d’émettre de vraies factures
          (SIRET et numéro de TVA obligatoires pour une entreprise assujettie).
        </p>
        {message && (
          <p className={`mt-4 rounded-lg p-3 text-sm ${message.type === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>{message.texte}</p>
        )}
        {form && (
          <div className="mt-5 grid max-w-3xl gap-4 sm:grid-cols-2">
            {CHAMPS.map((c) => (
              <label key={c.cle} className={`text-sm font-semibold text-gray-800 ${c.large ? 'sm:col-span-2' : ''}`}>
                {c.label}
                <input
                  value={form[c.cle]}
                  onChange={(e) => setForm({ ...form, [c.cle]: e.target.value })}
                  placeholder={c.placeholder}
                  maxLength={120}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal"
                />
              </label>
            ))}
            <div className="sm:col-span-2">
              <button
                onClick={() => void enregistrer()}
                disabled={occupe || !form.nom.trim()}
                className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {occupe ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
