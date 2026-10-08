'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  corrigerSession,
  emettreFiches,
  getToutesFiches,
  ouvrirFichePdf,
  type FichePaie,
  getPaies,
  getResumePaie,
  getSessions,
  payerJournee,
  setPlafond,
  setTaux,
  type JourPaie,
  type PaieFaite,
  type SessionPointage,
} from '@/services/paie';

const money = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
const duree = (min: number) => `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`;
const jourLisible = (j: string) =>
  new Date(`${j}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const heure = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
// Valeur d'un <input type="datetime-local"> à partir d'une date ISO (heure locale du navigateur)
const versInput = (iso: string) => {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export default function AdminPaiePage() {
  const [journees, setJournees] = useState<JourPaie[]>([]);
  const [taux, setTauxLocal] = useState(9);
  const [tauxSaisi, setTauxSaisi] = useState('9');
  const [plafond, setPlafondLocal] = useState(14);
  const [plafondSaisi, setPlafondSaisi] = useState('14');
  const [totalAPayer, setTotalAPayer] = useState(0);
  const [paies, setPaies] = useState<PaieFaite[]>([]);
  const [onglet, setOnglet] = useState<'jours' | 'historique' | 'fiches'>('jours');
  const [fiches, setFiches] = useState<FichePaie[]>([]);
  const [du, setDu] = useState('');
  const [au, setAu] = useState('');
  const [erreur, setErreur] = useState('');
  const [info, setInfo] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionPointage[]>([]);

  const charger = useCallback(async () => {
    const [r, p, f] = await Promise.all([getResumePaie(), getPaies(), getToutesFiches()]);
    if (f.success) setFiches(f.data?.fiches ?? []);
    if (!r.success) setErreur(r.message || 'Chargement impossible.');
    else if (r.data) {
      setJournees(r.data.journees);
      setTauxLocal(r.data.tauxHoraire);
      setTauxSaisi(String(r.data.tauxHoraire));
      setTotalAPayer(r.data.totalAPayer);
      if (r.data.plafondHeures) {
        setPlafondLocal(r.data.plafondHeures);
        setPlafondSaisi(String(r.data.plafondHeures));
      }
    }
    if (p.success) setPaies(p.data?.paies ?? []);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void charger();
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') void charger();
    }, 30000);
    return () => window.clearInterval(t);
  }, [charger]);

  // Période par défaut du formulaire d'émission : le mois en cours
  useEffect(() => {
    const n = new Date();
    const mois = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDu(`${mois}-01`);
    setAu(n.toISOString().slice(0, 10));
  }, []);

  const emettre = async () => {
    if (!window.confirm(`Envoyer les fiches de rémunération du ${du} au ${au} à tous les livreurs concernés ?`)) return;
    setOccupe(true);
    setErreur('');
    setInfo('');
    const res = await emettreFiches(du, au);
    setOccupe(false);
    if (!res.success) setErreur(res.message || 'Émission impossible.');
    else {
      setInfo(res.message || 'Fiches envoyées.');
      await charger();
    }
  };

  const ouvrirFiche = async (f: FichePaie) => {
    const err = await ouvrirFichePdf(f.id);
    if (err) setErreur(err);
  };

  const enregistrerTaux = async () => {
    const res = await setTaux(Number(tauxSaisi.replace(',', '.')));
    if (!res.success) setErreur(res.message || 'Taux invalide.');
    else {
      setErreur('');
      setInfo('Taux enregistré : il s’applique aux prochains paiements.');
      await charger();
    }
  };

  const enregistrerPlafond = async () => {
    const res = await setPlafond(Number(plafondSaisi.replace(',', '.')));
    if (!res.success) setErreur(res.message || 'Plafond invalide.');
    else {
      setErreur('');
      setInfo('Plafond enregistré : il s’applique aux prochains calculs et paiements.');
      await charger();
    }
  };

  const payer = async (j: JourPaie) => {
    const nom = j.livreur ? `${j.livreur.prenom} ${j.livreur.nom}` : 'ce livreur';
    const mode = window.prompt(
      `Payer ${money(j.montantAPayer)} à ${nom} pour le ${jourLisible(j.jour)} (${duree(j.minutesAPayer)}).\nMode de paiement : espèces, virement ou autre ?`,
      'espèces'
    );
    if (!mode) return;
    const m = /vir/i.test(mode) ? 'virement' : /autre/i.test(mode) ? 'autre' : 'especes';
    setOccupe(true);
    setErreur('');
    setInfo('');
    const res = await payerJournee(j.livreurId, j.jour, m);
    setOccupe(false);
    if (!res.success) setErreur(res.message || 'Paiement impossible.');
    else {
      setInfo(`Journée payée : ${money(j.montantAPayer)}.`);
      await charger();
    }
  };

  const voirSessions = async (j: JourPaie) => {
    const cle = `${j.livreurId}|${j.jour}`;
    if (ouvert === cle) {
      setOuvert(null);
      return;
    }
    const res = await getSessions(j.livreurId, j.jour);
    setSessions(res.success ? (res.data?.pointages ?? []) : []);
    setOuvert(cle);
  };

  const corriger = async (s: SessionPointage, j: JourPaie) => {
    const saisie = window.prompt(
      'Nouvelle heure de fin (AAAA-MM-JJTHH:MM, heure locale) :',
      versInput(s.fin ?? new Date().toISOString())
    );
    if (!saisie) return;
    const fin = new Date(saisie);
    if (Number.isNaN(fin.getTime())) {
      setErreur('Date invalide.');
      return;
    }
    const res = await corrigerSession(s.id, fin.toISOString());
    if (!res.success) setErreur(res.message || 'Correction impossible.');
    else {
      setErreur('');
      await charger();
      const r = await getSessions(j.livreurId, j.jour);
      setSessions(r.success ? (r.data?.pointages ?? []) : []);
    }
  };

  const carte = 'rounded-xl border border-gray-200 bg-white p-4';
  const totalPaye = paies.reduce((t, p) => t + p.montant, 0);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-gray-900">Paie des livreurs</h1>
        <p className="text-sm text-gray-600">
          Les livreurs pointent leur début et leur fin de service. Chaque journée est payée à l’heure pointée, au taux ci-dessous.
        </p>
        {erreur && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{erreur}</p>}
        {info && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{info}</p>}

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className={carte}>
            <p className="text-xs uppercase text-gray-500">Reste à payer</p>
            <p className="mt-1 text-xl font-bold text-orange-700">{money(totalAPayer)}</p>
          </div>
          <div className={carte}>
            <p className="text-xs uppercase text-gray-500">Déjà payé (historique)</p>
            <p className="mt-1 text-xl font-bold">{money(totalPaye)}</p>
          </div>
          <div className={`${carte} col-span-2`}>
            <p className="text-xs uppercase text-gray-500">Taux horaire</p>
            <div className="mt-1 flex items-center gap-2">
              <input
                inputMode="decimal"
                value={tauxSaisi}
                onChange={(e) => setTauxSaisi(e.target.value)}
                className="w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                aria-label="Taux horaire en euros"
              />
              <span className="text-sm text-gray-600">€ / heure</span>
              <button
                onClick={() => void enregistrerTaux()}
                disabled={Number(tauxSaisi.replace(',', '.')) === taux}
                className="rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
              >
                Enregistrer
              </button>
            </div>
          </div>
          <div className={`${carte} col-span-2`}>
            <p className="text-xs uppercase text-gray-500">Plafond d’heures payées par jour</p>
            <div className="mt-1 flex items-center gap-2">
              <input
                inputMode="decimal"
                value={plafondSaisi}
                onChange={(e) => setPlafondSaisi(e.target.value)}
                className="w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                aria-label="Plafond d'heures par jour"
              />
              <span className="text-sm text-gray-600">h / jour</span>
              <button
                onClick={() => void enregistrerPlafond()}
                disabled={Number(plafondSaisi.replace(',', '.')) === plafond}
                className="rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-2 border-b border-gray-200">
          {(
            [
              ['jours', 'Journées'],
              ['historique', 'Paiements effectués'],
              ['fiches', 'Fiches de paie'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setOnglet(id)}
              className={`px-4 py-2 text-sm font-semibold ${onglet === id ? 'border-b-2 border-orange-600 text-orange-700' : 'text-gray-500'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {onglet === 'jours' && (
          <div className="mt-4 space-y-3">
            {journees.length === 0 && <p className="text-sm text-gray-500">Aucun pointage sur les 14 derniers jours.</p>}
            {journees.map((j) => {
              const cle = `${j.livreurId}|${j.jour}`;
              const payable = j.minutesAPayer > 0 && !j.enCours;
              return (
                <div key={cle} className={carte}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold capitalize text-gray-900">
                        {j.livreur ? `${j.livreur.prenom} ${j.livreur.nom}` : 'Livreur'} · {jourLisible(j.jour)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {duree(j.minutesAPayer + j.minutesPayees)} pointées · {j.nbLivraisons} livraison{j.nbLivraisons > 1 ? 's' : ''}
                        {j.enCours && <span className="ml-2 font-semibold text-green-700">● en service</span>}
                        {(j.minutesAuDelaPlafond ?? 0) > 0 && (
                          <span className="ml-2 font-semibold text-amber-700">
                            {duree(j.minutesAuDelaPlafond ?? 0)} au-delà du plafond (non payées)
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      {j.minutesAPayer > 0 ? (
                        <p className="text-lg font-bold text-orange-700">{money(j.montantAPayer)}</p>
                      ) : (
                        <p className="text-sm font-semibold text-green-700">Payée</p>
                      )}
                      <p className="text-xs text-gray-500">{j.minutesAPayer > 0 ? `${duree(j.minutesAPayer)} à payer` : ''}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      disabled={!payable || occupe}
                      onClick={() => void payer(j)}
                      title={j.enCours ? 'Session en cours : attendez la fin du service' : ''}
                      className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-40"
                    >
                      Payer la journée
                    </button>
                    <button onClick={() => void voirSessions(j)} className="text-sm font-semibold text-gray-700 underline">
                      {ouvert === cle ? 'Masquer les sessions' : 'Voir / corriger les sessions'}
                    </button>
                  </div>
                  {ouvert === cle && (
                    <ul className="mt-3 space-y-1 rounded-lg bg-gray-50 p-3 text-sm">
                      {sessions.map((s) => (
                        <li key={s.id} className="flex flex-wrap items-center justify-between gap-2">
                          <span>
                            {heure(s.debut)} → {s.fin ? heure(s.fin) : <em className="text-green-700">en cours</em>}
                            {s.paieId && <span className="ml-2 text-xs text-green-700">payée</span>}
                            {s.clotureAuto && <span className="ml-2 text-xs text-amber-700">clôturée automatiquement</span>}
                          </span>
                          {!s.paieId && (
                            <button onClick={() => void corriger(s, j)} className="text-xs font-semibold text-orange-700 underline">
                              {s.fin ? 'Corriger la fin' : 'Clôturer'}
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {onglet === 'fiches' && (
          <div className="mt-4 space-y-4">
            <div className={carte}>
              <p className="font-semibold text-gray-900">Envoyer les fiches de rémunération</p>
              <p className="text-xs text-gray-600">
                Chaque livreur reçoit une fiche regroupant ses journées déjà payées sur la période. Une journée n’est incluse
                qu’une seule fois.
              </p>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <label className="text-xs font-semibold text-gray-700">
                  Du
                  <input type="date" value={du} onChange={(e) => setDu(e.target.value)} className="mt-1 block rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-normal" />
                </label>
                <label className="text-xs font-semibold text-gray-700">
                  Au
                  <input type="date" value={au} onChange={(e) => setAu(e.target.value)} className="mt-1 block rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-normal" />
                </label>
                <button
                  onClick={() => void emettre()}
                  disabled={!du || !au || du > au || occupe}
                  className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  Générer et envoyer
                </button>
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-2">N°</th>
                    <th className="px-4 py-2">Livreur</th>
                    <th className="px-4 py-2">Période</th>
                    <th className="px-4 py-2">Total</th>
                    <th className="px-4 py-2">Envoyée le</th>
                    <th className="px-4 py-2">Lue</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {fiches.map((f) => (
                    <tr key={f.id}>
                      <td className="px-4 py-2 font-mono text-xs">{f.numero}</td>
                      <td className="px-4 py-2">
                        {f.livreur?.prenom} {f.livreur?.nom}
                      </td>
                      <td className="px-4 py-2">
                        {f.du} → {f.au}
                      </td>
                      <td className="px-4 py-2 font-semibold">{money(f.totalMontant)}</td>
                      <td className="px-4 py-2">{new Date(f.envoyeLe).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-2">{f.luLe ? <span className="text-green-700">Oui</span> : <span className="text-orange-700">Pas encore</span>}</td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => void ouvrirFiche(f)} className="text-xs font-semibold text-orange-700 underline">
                          Voir
                        </button>
                      </td>
                    </tr>
                  ))}
                  {fiches.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                        Aucune fiche envoyée.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {onglet === 'historique' && (
          <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2">Payée le</th>
                  <th className="px-4 py-2">Livreur</th>
                  <th className="px-4 py-2">Journée</th>
                  <th className="px-4 py-2">Heures</th>
                  <th className="px-4 py-2">Livraisons</th>
                  <th className="px-4 py-2">Taux</th>
                  <th className="px-4 py-2">Montant</th>
                  <th className="px-4 py-2">Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paies.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2">{new Date(p.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="px-4 py-2">
                      {p.livreur.prenom} {p.livreur.nom}
                    </td>
                    <td className="px-4 py-2">{p.jour}</td>
                    <td className="px-4 py-2">{duree(p.minutes)}</td>
                    <td className="px-4 py-2">{p.nbLivraisons}</td>
                    <td className="px-4 py-2">{money(p.tauxHoraire)}/h</td>
                    <td className="px-4 py-2 font-semibold">{money(p.montant)}</td>
                    <td className="px-4 py-2">{p.mode}</td>
                  </tr>
                ))}
                {paies.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                      Aucun paiement effectué.
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
