'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { avancerCuisine, getFileCuisine, ouvrirFlux } from '@/services/features';

type Ticket = {
  id: string;
  numeroCommande: string;
  statut: string;
  creneauLivraison?: string | null;
  client?: { prenom?: string; nom?: string };
  articles: Array<{ nom: string; quantite: number; instructions?: string | null }>;
};

export default function CuisinePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [file, setFile] = useState<Ticket[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const charger = useCallback(async () => {
    const res = await getFileCuisine();
    if (res.success && res.data?.file) setFile(res.data.file as Ticket[]);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user || !['admin', 'livreur'].includes(user.role)) {
      router.replace('/login?redirect=/cuisine');
      return;
    }
    void charger();
    const off = ouvrirFlux('cuisine', () => {
      void charger();
    });
    const t = setInterval(() => void charger(), 12000);
    return () => {
      off();
      clearInterval(t);
    };
  }, [loading, user, router, charger]);

  const avancer = async (id: string, statut: 'en_preparation' | 'prete') => {
    setBusy(id);
    await avancerCuisine(id, statut);
    await charger();
    setBusy(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#1a120c] text-[#f5e6d3]">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-grow px-4 py-8">
        <h1 className="font-title text-4xl text-[#E9A23B]">Cuisine · KDS</h1>
        <p className="mt-1 text-sm opacity-70">File de préparation en direct</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {file.map((t) => (
            <article key={t.id} className="rounded-2xl border border-[#E9A23B]/35 bg-[#2a1c12] p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-lg text-[#E9A23B]">{t.numeroCommande}</p>
                  <p className="text-xs opacity-60">
                    {t.client?.prenom} {t.client?.nom}
                    {t.creneauLivraison
                      ? ` · ${new Date(t.creneauLivraison).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                      : ' · ASAP'}
                  </p>
                </div>
                <span className="rounded-full bg-[#E9A23B]/15 px-2 py-0.5 text-xs uppercase">{t.statut.replace('_', ' ')}</span>
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {t.articles.map((a, i) => (
                  <li key={i}>
                    <strong>{a.quantite}×</strong> {a.nom}
                    {a.instructions ? <span className="block text-xs text-[#E9A23B]/80">→ {a.instructions}</span> : null}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex gap-2">
                {t.statut === 'confirmee' && (
                  <button
                    type="button"
                    disabled={busy === t.id}
                    onClick={() => void avancer(t.id, 'en_preparation')}
                    className="flex-1 rounded-xl bg-[#E9A23B] px-3 py-2 text-sm font-semibold text-[#1a120c]"
                  >
                    Préparer
                  </button>
                )}
                {t.statut === 'en_preparation' && (
                  <button
                    type="button"
                    disabled={busy === t.id}
                    onClick={() => void avancer(t.id, 'prete')}
                    className="flex-1 rounded-xl bg-[#7cb342] px-3 py-2 text-sm font-semibold text-[#1a120c]"
                  >
                    Prête
                  </button>
                )}
              </div>
            </article>
          ))}
          {file.length === 0 && <p className="opacity-60">Aucune commande en cuisine.</p>}
        </div>
      </main>
      <Footer />
    </div>
  );
}
