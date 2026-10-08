'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { getDocuments, refuserDocument, validerDocument, type DocumentClient } from '@/services/adminDocuments';
import { ouvrirJustificatif, tailleLisible } from '@/services/justificatifs';

const money = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
const dateHeure = (iso: string) => new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
const ONGLETS = [
  ['en_attente', 'À vérifier'],
  ['valide', 'Validés'],
  ['refuse', 'Refusés'],
] as const;

export default function AdminDocumentsPage() {
  const [onglet, setOnglet] = useState<(typeof ONGLETS)[number][0]>('en_attente');
  const [documents, setDocuments] = useState<DocumentClient[]>([]);
  const [nbAVerifier, setNbAVerifier] = useState(0);
  const [erreur, setErreur] = useState('');
  const [occupe, setOccupe] = useState<string | null>(null);

  const charger = useCallback(async () => {
    const [liste, attente] = await Promise.all([getDocuments(onglet), getDocuments('en_attente')]);
    if (!liste.success) setErreur(liste.message || 'Chargement impossible.');
    else setDocuments(liste.data?.documents ?? []);
    if (attente.success) setNbAVerifier(attente.data?.documents.length ?? 0);
  }, [onglet]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void charger();
  }, [charger]);

  const ouvrir = async (d: DocumentClient) => {
    const err = await ouvrirJustificatif(d.commande._id, d.id);
    if (err) setErreur(err);
  };

  const valider = async (d: DocumentClient) => {
    const avertissement = d.verification.paiementStripe
      ? ''
      : '\n\nATTENTION : aucun paiement Stripe n’est enregistré pour cette commande.';
    if (
      !window.confirm(
        `Valider ce document ?\nLa commande ${d.commande.numeroCommande} (${money(d.commande.total)}) sera confirmée et pourra partir en préparation puis en livraison.${avertissement}`
      )
    )
      return;
    setOccupe(d.id);
    setErreur('');
    const res = await validerDocument(d.id);
    setOccupe(null);
    if (!res.success) setErreur(res.message || 'Validation impossible.');
    else await charger();
  };

  const refuser = async (d: DocumentClient) => {
    const motif = window.prompt('Motif du refus (le client le verra) :');
    if (!motif) return;
    setOccupe(d.id);
    setErreur('');
    const res = await refuserDocument(d.id, motif);
    setOccupe(null);
    if (!res.success) setErreur(res.message || 'Refus impossible.');
    else await charger();
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-gray-900">Mes documents</h1>
        <p className="text-sm text-gray-600">
          Justificatifs de paiement envoyés par les clients qui paient par virement. Ouvrez le document, vérifiez-le, puis
          validez : la commande peut alors partir en préparation et en livraison.
        </p>
        {erreur && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{erreur}</p>}

        <div className="mt-5 flex gap-2 border-b border-gray-200">
          {ONGLETS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setOnglet(id)}
              className={`px-4 py-2 text-sm font-semibold ${
                onglet === id ? 'border-b-2 border-orange-600 text-orange-700' : 'text-gray-500'
              }`}
            >
              {label}
              {id === 'en_attente' && nbAVerifier > 0 && (
                <span className="ml-2 rounded-full bg-orange-600 px-2 py-0.5 text-xs text-white">{nbAVerifier}</span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-4">
          {documents.length === 0 && <p className="text-sm text-gray-500">Aucun document.</p>}
          {documents.map((d) => (
            <div key={d.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">
                    Commande <span className="font-mono">{d.commande.numeroCommande}</span> · {money(d.commande.total)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {d.commande.client} {d.commande.email && `· ${d.commande.email}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    Reçu le {dateHeure(d.createdAt)} · {d.nom} ({tailleLisible(d.taille)})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void ouvrir(d)}
                  className="rounded-lg border border-orange-600 px-3 py-1.5 text-sm font-semibold text-orange-700 hover:bg-orange-50"
                >
                  Ouvrir le document
                </button>
              </div>

              <div
                className={`mt-3 rounded-lg px-3 py-2 text-sm ${
                  d.verification.paiementStripe ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'
                }`}
              >
                {d.verification.paiementStripe ? (
                  <>
                    <p className="font-semibold">Paiement Stripe confirmé par le serveur</p>
                    <p className="text-xs">
                      Montant attendu {money(d.commande.total)} · payé le {d.verification.payeLe ? dateHeure(d.verification.payeLe) : '—'}
                      {' · '}réf. {d.verification.referenceStripe}
                    </p>
                    <p className="text-xs">
                      Code de vérification attendu sur le PDF : <span className="font-mono font-bold">{d.verification.codeAttendu}</span>
                    </p>
                  </>
                ) : (
                  <p className="font-semibold">Aucun paiement Stripe enregistré pour cette commande : contrôlez le document avec soin.</p>
                )}
              </div>

              {d.statut === 'en_attente' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={occupe === d.id}
                    onClick={() => void valider(d)}
                    className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                  >
                    Valider
                  </button>
                  <button
                    type="button"
                    disabled={occupe === d.id}
                    onClick={() => void refuser(d)}
                    className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    Refuser
                  </button>
                </div>
              )}
              {d.statut === 'valide' && (
                <p className="mt-3 text-sm font-semibold text-green-700">
                  Validé{d.traiteLe ? ` le ${dateHeure(d.traiteLe)}` : ''} · commande {d.commande.statut}
                </p>
              )}
              {d.statut === 'refuse' && (
                <p className="mt-3 text-sm font-semibold text-red-700">
                  Refusé{d.traiteLe ? ` le ${dateHeure(d.traiteLe)}` : ''} : {d.motifRefus}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
