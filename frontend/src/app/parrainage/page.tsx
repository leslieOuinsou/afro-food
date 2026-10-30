'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { getParrainage } from '@/services/features';

export default function ParrainagePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [data, setData] = useState<{
    code: string;
    filleuls: number;
    lien: string;
    recompenseFilleul: string;
    recompenseParrain: string;
  } | null>(null);
  const [copie, setCopie] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login?redirect=/parrainage');
      return;
    }
    void getParrainage().then((r) => {
      if (r.success && r.data) setData(r.data);
    });
  }, [loading, user, router]);

  const copier = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(data.lien);
    setCopie(true);
    setTimeout(() => setCopie(false), 2000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--ivory)] text-[var(--wood)]">
      <Header />
      <main className="mx-auto w-full max-w-xl flex-grow px-4 py-10">
        <h1 className="font-title text-4xl">Parrainage</h1>
        <p className="mt-2 text-sm opacity-70">Invitez vos proches : −5 € pour eux, +50 points pour vous.</p>
        {!data ? (
          <p className="mt-8 text-sm opacity-60">Chargement…</p>
        ) : (
          <section className="mt-8 rounded-[24px] border border-[var(--ochre)]/30 bg-white/70 p-6">
            <p className="text-xs uppercase tracking-wide opacity-60">Votre code</p>
            <p className="mt-1 font-mono text-3xl text-[var(--ochre)]">{data.code}</p>
            <p className="mt-4 text-sm">
              {data.filleuls} filleul{data.filleuls > 1 ? 's' : ''} · {data.recompenseFilleul} · {data.recompenseParrain}
            </p>
            <button
              type="button"
              onClick={() => void copier()}
              className="mt-6 w-full rounded-2xl bg-[var(--ochre)] px-4 py-3 text-sm font-semibold text-white"
            >
              {copie ? 'Lien copié !' : 'Copier mon lien d’invitation'}
            </button>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
