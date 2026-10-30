'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getRecette } from '@/services/features';

export default function RecetteDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<{ recette: Record<string, unknown>; plat: Record<string, unknown> | null } | null>(null);

  useEffect(() => {
    if (!slug) return;
    void getRecette(slug).then((r) => {
      if (r.success && r.data) setData(r.data);
    });
  }, [slug]);

  const r = data?.recette;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--ivory)] text-[var(--wood)]">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-grow px-4 py-10">
        <Link href="/recettes" className="text-sm text-[var(--ochre)]">
          ← Recettes
        </Link>
        {!r ? (
          <p className="mt-8 text-sm opacity-60">Chargement…</p>
        ) : (
          <>
            <h1 className="mt-4 font-title text-4xl">{String(r.titre)}</h1>
            <p className="mt-2 text-sm opacity-70">{String(r.resume)}</p>
            <article className="prose prose-stone mt-8 whitespace-pre-wrap text-sm leading-relaxed">{String(r.contenu)}</article>
            {data?.plat && (
              <Link
                href={`/produit/${data.plat.id || data.plat.slug}`}
                className="mt-8 inline-block rounded-2xl bg-[var(--ochre)] px-5 py-3 text-sm font-semibold text-white"
              >
                Commander « {String(data.plat.nom)} »
              </Link>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
