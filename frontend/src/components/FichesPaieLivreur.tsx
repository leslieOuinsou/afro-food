'use client';

import { useCallback, useEffect, useState } from 'react';
import { getMesFiches, ouvrirFichePdf, type FichePaie } from '@/services/paie';

const money = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
const jour = (j: string) => new Date(`${j}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const duree = (min: number) => `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`;

/** Section « Mes fiches de paie » de l'espace livreur : fiches envoyées par l'administration. */
export default function FichesPaieLivreur() {
  const [fiches, setFiches] = useState<FichePaie[] | null>(null);
  const [erreur, setErreur] = useState('');

  const charger = useCallback(async () => {
    const res = await getMesFiches();
    if (res.success) setFiches(res.data?.fiches ?? []);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void charger();
    const t = window.setInterval(() => {
      if (document.visibilityState === 'visible') void charger();
    }, 60000);
    return () => window.clearInterval(t);
  }, [charger]);

  const ouvrir = async (f: FichePaie) => {
    setErreur('');
    const err = await ouvrirFichePdf(f.id);
    if (err) setErreur(err);
    else await charger();
  };

  if (!fiches) return null;
  const nonLues = fiches.filter((f) => !f.luLe).length;

  return (
    <section className="mt-6" aria-labelledby="fiches-titre">
      <h2 id="fiches-titre" className="font-title text-2xl">
        Mes fiches de paie
        {nonLues > 0 && (
          <span className="ml-3 rounded-full bg-[var(--ochre)] px-2.5 py-0.5 align-middle text-xs font-semibold text-white">
            {nonLues} nouvelle{nonLues > 1 ? 's' : ''}
          </span>
        )}
      </h2>
      {erreur && <p className="mt-2 text-sm text-red-700">{erreur}</p>}
      {fiches.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--wood)]/60">Aucune fiche pour l’instant. L’administration vous les envoie ici.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {fiches.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--wood)]/10 bg-white/60 p-4">
              <div>
                <p className="font-semibold">
                  Du {jour(f.du)} au {jour(f.au)}
                  {!f.luLe && <span className="ml-2 text-xs font-semibold text-[var(--ochre)]">Nouveau</span>}
                </p>
                <p className="text-xs text-[var(--wood)]/60">
                  {f.numero} · {duree(f.totalMinutes)} · {f.nbLivraisons} livraison{f.nbLivraisons > 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-lg font-semibold text-[var(--ochre)]">{money(f.totalMontant)}</p>
                <button
                  type="button"
                  onClick={() => void ouvrir(f)}
                  className="rounded-full bg-[var(--ochre)] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a6500c]"
                >
                  Voir la fiche
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
