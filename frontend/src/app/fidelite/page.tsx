'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { echangerPoints, getMaFidelite, type MaFidelite } from '@/services/fidelite';

const money = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

export default function FidelitePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<MaFidelite | null>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'erreur'; texte: string } | null>(null);
  const [occupe, setOccupe] = useState(false);

  const charger = useCallback(async () => {
    const res = await getMaFidelite();
    if (res.success && res.data) setData(res.data);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login?redirect=/fidelite');
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void charger();
  }, [authLoading, user, router, charger]);

  const echanger = async (points: number, remise: number) => {
    if (!window.confirm(`Échanger ${points} points contre un code de ${money(remise)} ?`)) return;
    setOccupe(true);
    setMessage(null);
    const res = await echangerPoints(points);
    setOccupe(false);
    if (!res.success) setMessage({ type: 'erreur', texte: res.message || 'Échange impossible.' });
    else {
      setMessage({ type: 'ok', texte: `Votre code : ${res.data?.code}. Saisissez-le dans le panier.` });
      await charger();
    }
  };

  const progression = data?.prochainPalier ? Math.min(100, Math.round((data.points / data.prochainPalier.points) * 100)) : 100;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--ivory)] text-[var(--wood)]">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-grow px-4 py-10">
        <h1 className="font-title text-4xl">Ma fidélité</h1>
        {!data ? (
          <p className="mt-6 text-sm text-[var(--wood)]/60">Chargement…</p>
        ) : !data.actif ? (
          <p className="mt-6 text-sm text-[var(--wood)]/70">Le programme de fidélité n’est pas actif pour le moment.</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-[var(--wood)]/70">
              Gagnez {data.pointsParEuro} point{data.pointsParEuro > 1 ? 's' : ''} par euro dépensé, à chaque commande livrée, puis échangez vos points contre des
              réductions.
            </p>

            <section className="mt-6 rounded-[24px] border border-[var(--ochre)]/30 bg-[color:rgba(233,162,59,.10)] p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--wood)]/60">Mes points</p>
              <p className="mt-1 font-title text-5xl text-[var(--ochre)]">{data.points}</p>
              {data.prochainPalier ? (
                <>
                  <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/70" role="progressbar" aria-valuenow={progression} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full bg-[var(--ochre)]" style={{ width: `${progression}%` }} />
                  </div>
                  <p className="mt-2 text-sm">
                    Encore <strong>{data.prochainPalier.manque} points</strong> pour une réduction de {money(data.prochainPalier.remise)}.
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm">Vous avez atteint tous les paliers : choisissez votre récompense ci-dessous.</p>
              )}
            </section>

            {message && (
              <p className={`mt-4 rounded-2xl p-3 text-sm ${message.type === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>{message.texte}</p>
            )}

            <h2 className="mt-8 font-title text-2xl">Échanger mes points</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-3">
              {data.paliers.map((p) => (
                <li key={p.points} className="flex flex-col rounded-2xl border border-[var(--wood)]/10 bg-white/60 p-4">
                  <p className="text-2xl font-semibold text-[var(--ochre)]">{money(p.remise)}</p>
                  <p className="text-xs text-[var(--wood)]/60">de réduction · {p.points} points</p>
                  <button
                    type="button"
                    disabled={!p.accessible || occupe}
                    onClick={() => void echanger(p.points, p.remise)}
                    className="mt-3 rounded-full bg-[var(--ochre)] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a6500c] disabled:opacity-40"
                  >
                    {p.accessible ? 'Échanger' : 'Pas assez de points'}
                  </button>
                </li>
              ))}
            </ul>

            {data.codes.length > 0 && (
              <>
                <h2 className="mt-8 font-title text-2xl">Mes codes</h2>
                <ul className="mt-3 space-y-2">
                  {data.codes.map((c) => (
                    <li key={c.code} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--wood)]/10 bg-white/60 px-4 py-3 text-sm">
                      <span className="font-mono font-semibold">{c.code}</span>
                      <span>
                        {money(c.valeur)} ·{' '}
                        {c.utilisations > 0 ? 'utilisé' : c.dateFin && new Date(c.dateFin) < new Date() ? 'expiré' : `valable jusqu’au ${c.dateFin ? new Date(c.dateFin).toLocaleDateString('fr-FR') : '—'}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <h2 className="mt-8 font-title text-2xl">Historique</h2>
            {data.mouvements.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--wood)]/60">Aucun point pour l’instant : ils arrivent dès votre première livraison.</p>
            ) : (
              <ul className="mt-3 divide-y divide-[var(--wood)]/10 rounded-2xl border border-[var(--wood)]/10 bg-white/60 text-sm">
                {data.mouvements.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <span>
                      {m.motif}
                      <span className="ml-2 text-xs text-[var(--wood)]/50">{new Date(m.createdAt).toLocaleDateString('fr-FR')}</span>
                    </span>
                    <span className={`font-semibold ${m.delta >= 0 ? 'text-green-700' : 'text-[var(--brick)]'}`}>
                      {m.delta > 0 ? '+' : ''}
                      {m.delta}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-6 text-center text-sm">
              <Link href="/catalogue" className="font-semibold text-[var(--ochre)] underline">
                Retour au catalogue
              </Link>
            </p>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
