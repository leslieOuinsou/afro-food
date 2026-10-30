'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getRecettes } from '@/services/features';

type Recette = { id: string; slug: string; titre: string; resume: string; paysOrigine?: string; dureeMin?: number };

export default function RecettesPage() {
  const [recettes, setRecettes] = useState<Recette[]>([]);

  useEffect(() => {
    void getRecettes().then((r) => {
      if (r.success && r.data?.recettes) setRecettes(r.data.recettes as Recette[]);
    });
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--ivory)] text-[var(--wood)]">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-grow px-4 py-10">
        <h1 className="font-title text-4xl">Recettes & origines</h1>
        <p className="mt-2 text-sm opacity-70">Les histoires derrière les plats que vous commandez.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {recettes.map((r) => (
            <Link key={r.id} href={`/recettes/${r.slug}`} className="rounded-[24px] border border-[var(--wood)]/10 bg-white/80 p-5 transition hover:border-[var(--ochre)]/40">
              <h2 className="font-title text-xl">{r.titre}</h2>
              <p className="mt-2 line-clamp-3 text-sm opacity-70">{r.resume}</p>
              <p className="mt-3 text-xs opacity-50">
                {[r.paysOrigine, r.dureeMin ? `${r.dureeMin} min` : null].filter(Boolean).join(' · ')}
              </p>
            </Link>
          ))}
          {recettes.length === 0 && <p className="text-sm opacity-60">Aucune recette publiée pour le moment.</p>}
        </div>
      </main>
      <Footer />
    </div>
  );
}
