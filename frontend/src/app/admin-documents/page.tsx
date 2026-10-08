'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { getDocuments, refuserDocument, validerDocument, type DocumentClient } from '@/services/adminDocuments';
import { ouvrirJustificatif, tailleLisible, telechargerJustificatifBlob } from '@/services/justificatifs';
import { lireQrDepuisFichier } from '@/lib/lireQrFichier';
import QrScanner from '@/components/admin/QrScanner';
import { lireQrJustificatif } from '@/lib/qrJustificatif';

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
  const [aValider, setAValider] = useState<DocumentClient | null>(null);
  const [saisie, setSaisie] = useState('');
  const [erreurValidation, setErreurValidation] = useState('');
  const [scannerOuvert, setScannerOuvert] = useState(false);
  const [qrLu, setQrLu] = useState(false);
  const [scanEnCours, setScanEnCours] = useState(false);
  const [ouverts, setOuverts] = useState<Set<string>>(new Set());

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
    else setOuverts((prev) => new Set(prev).add(d.id));
  };

  const demanderValidation = (d: DocumentClient) => {
    setAValider(d);
    setSaisie('');
    setErreurValidation('');
    setScannerOuvert(false);
    setQrLu(false);
  };

  const traiterQr = (texte: string) => {
    if (!aValider) return;
    const qr = lireQrJustificatif(texte);
    if (!qr) {
      setErreurValidation('Ce QR code n’est pas un justificatif Afro-food.');
      return;
    }
    if (qr.numero !== aValider.commande.numeroCommande || Math.abs(qr.total - aValider.commande.total) > 0.009) {
      setErreurValidation(
        `Ce justificatif concerne ${qr.numero} (${money(qr.total)}), pas la commande ${aValider.commande.numeroCommande} (${money(aValider.commande.total)}).`
      );
      setScannerOuvert(false);
      return;
    }
    setErreurValidation('');
    setSaisie(qr.code);
    setQrLu(true);
    setScannerOuvert(false);
  };

  /** Scanne directement le document envoyé par le client : lit son QR code et remplit le code de vérification. */
  const scannerDocumentClient = async () => {
    if (!aValider) return;
    setErreurValidation('');
    setScanEnCours(true);
    try {
      const blob = await telechargerJustificatifBlob(aValider.commande._id, aValider.id);
      if (!blob) {
        setErreurValidation('Document introuvable.');
        return;
      }
      const texte = await lireQrDepuisFichier(blob, aValider.nom);
      if (!texte) setErreurValidation('Aucun QR code lisible dans ce document : il ne s’agit pas du justificatif émis par le site.');
      else traiterQr(texte);
    } catch {
      setErreurValidation('Document illisible : il ne s’agit pas d’un justificatif valide.');
    } finally {
      setScanEnCours(false);
    }
  };

  const confirmerValidation = async () => {
    if (!aValider) return;
    setOccupe(aValider.id);
    setErreurValidation('');
    const res = await validerDocument(
      aValider.id,
      aValider.verification.paiementStripe ? { code: saisie } : { verification: saisie }
    );
    setOccupe(null);
    if (!res.success) {
      setErreurValidation(res.message || 'Validation impossible.');
      return;
    }
    setAValider(null);
    await charger();
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
                    <p className="text-xs">Fichier authentique : identique au justificatif émis par le site (contrôlé à l’envoi).</p>
                    <p className="text-xs">
                      Montant attendu {money(d.commande.total)} · payé le {d.verification.payeLe ? dateHeure(d.verification.payeLe) : '—'}
                      {' · '}réf. {d.verification.referenceStripe}
                    </p>
                    <p className="text-xs">
                      Ouvrez le document : le code de vérification et son QR code y figurent. Vous devez les saisir pour valider.
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
                    disabled={occupe === d.id || !ouverts.has(d.id)}
                    title={ouverts.has(d.id) ? '' : 'Ouvrez d’abord le document'}
                    onClick={() => demanderValidation(d)}
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
      {aValider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Vérifier le document</h3>
            <p className="mt-1 text-sm text-gray-600">
              Commande {aValider.commande.numeroCommande} · {money(aValider.commande.total)}
            </p>
            {aValider.verification.paiementStripe ? (
              <>
                <p className="mt-3 text-sm text-gray-700">
                  Recopiez le <strong>code de vérification</strong> imprimé sur le document (ou scannez son QR code avec votre
                  téléphone). Vérifiez aussi que le montant et le numéro de commande correspondent.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={scanEnCours}
                    onClick={() => void scannerDocumentClient()}
                    className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {scanEnCours ? 'Analyse…' : 'Scanner le document du client'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setScannerOuvert((v) => !v)}
                    className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white"
                  >
                    {scannerOuvert ? 'Fermer le scanner' : 'Scanner avec la caméra / un fichier'}
                  </button>
                </div>
                {scannerOuvert && <QrScanner onResult={traiterQr} onClose={() => setScannerOuvert(false)} />}
                {qrLu && (
                  <p className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-800">
                    QR code lu : commande et montant correspondent ✓
                  </p>
                )}
                <input
                  value={saisie}
                  onChange={(e) => setSaisie(e.target.value)}
                  placeholder="Code de vérification"
                  autoFocus
                  className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </>
            ) : (
              <>
                <p className="mt-3 text-sm text-amber-800">
                  Aucun paiement Stripe n’est enregistré. Décrivez ce que vous avez vérifié (montant, date, référence du virement
                  sur le relevé).
                </p>
                <textarea
                  value={saisie}
                  onChange={(e) => setSaisie(e.target.value)}
                  rows={3}
                  className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </>
            )}
            {erreurValidation && <p className="mt-2 text-sm text-red-700">{erreurValidation}</p>}
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setAValider(null)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold"
              >
                Annuler
              </button>
              <button
                disabled={!saisie.trim() || occupe === aValider.id}
                onClick={() => void confirmerValidation()}
                className="flex-1 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
              >
                Valider la commande
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
