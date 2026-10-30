'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { creerAbonnement, getMonAbonnement, majAbonnement } from '@/services/features';

export default function AbonnementsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [abo, setAbo] = useState<{ id: string; frequence: string; tailleBox: number; statut: string; prochainCreneau?: string } | null>(null);
  const [frequence, setFrequence] = useState('hebdo');
  const [taille, setTaille] = useState(4);
  const [msg, setMsg] = useState('');

  const charger = async () => {
    const res = await getMonAbonnement();
    if (res.success) setAbo((res.data?.abonnement as typeof abo) || null);
  };

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login?redirect=/abonnements');
      return;
    }
    void charger();
  }, [loading, user, router]);

  const souscrire = async () => {
    const res = await creerAbonnement({ frequence, tailleBox: taille });
    setMsg(res.success ? 'Box activée !' : res.message || 'Erreur');
    await charger();
  };

  const pause = async () => {
    if (!abo) return;
    await majAbonnement(abo.id, { statut: abo.statut === 'pause' ? 'actif' : 'pause' });
    await charger();
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--ivory)] text-[var(--wood)]">
      <Header />
      <main className="mx-auto w-full max-w-xl flex-grow px-4 py-10">
        <h1 className="font-title text-4xl">Box Afro-food</h1>
        <p className="mt-2 text-sm opacity-70">Abonnement hebdo ou bi-hebdo : une sélection de plats africains livrée chez vous.</p>

        {abo ? (
          <section className="mt-8 rounded-[24px] border border-[var(--ochre)]/30 bg-white/70 p-6">
            <p className="text-sm uppercase opacity-60">Statut</p>
            <p className="font-title text-2xl text-[var(--ochre)]">{abo.statut}</p>
            <p className="mt-2 text-sm">
              {abo.frequence} · {abo.tailleBox} plats
              {abo.prochainCreneau ? ` · prochain : ${new Date(abo.prochainCreneau).toLocaleDateString('fr-FR')}` : ''}
            </p>
            <button type="button" onClick={() => void pause()} className="mt-6 rounded-2xl bg-[var(--wood)] px-4 py-3 text-sm font-semibold text-white">
              {abo.statut === 'pause' ? 'Reprendre' : 'Mettre en pause'}
            </button>
          </section>
        ) : (
          <section className="mt-8 space-y-4 rounded-[24px] border border-[var(--ochre)]/30 bg-white/70 p-6">
            <label className="block text-sm">
              Fréquence
              <select value={frequence} onChange={(e) => setFrequence(e.target.value)} className="mt-1 w-full rounded-xl border border-[var(--wood)]/15 bg-white px-3 py-2">
                <option value="hebdo">Chaque semaine</option>
                <option value="bihebdo">Toutes les 2 semaines</option>
              </select>
            </label>
            <label className="block text-sm">
              Taille de la box
              <input type="number" min={2} max={8} value={taille} onChange={(e) => setTaille(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-[var(--wood)]/15 bg-white px-3 py-2" />
            </label>
            <button type="button" onClick={() => void souscrire()} className="w-full rounded-2xl bg-[var(--ochre)] px-4 py-3 text-sm font-semibold text-white">
              Activer ma box
            </button>
          </section>
        )}
        {msg && <p className="mt-4 text-sm">{msg}</p>}
      </main>
      <Footer />
    </div>
  );
}
