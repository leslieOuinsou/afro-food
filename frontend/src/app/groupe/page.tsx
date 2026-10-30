'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { creerGroupe, fermerGroupe, getGroupe } from '@/services/features';

function GroupeInner() {
  const router = useRouter();
  const params = useSearchParams();
  const codeParam = params.get('code') || '';
  const { user, loading } = useAuth();
  const [code, setCode] = useState(codeParam);
  const [groupe, setGroupe] = useState<Awaited<ReturnType<typeof getGroupe>>['data'] | null>(null);
  const [erreur, setErreur] = useState('');
  const [lien, setLien] = useState('');

  const charger = async (c: string) => {
    const res = await getGroupe(c);
    if (!res.success) {
      setErreur(res.message || 'Groupe introuvable');
      setGroupe(null);
      return;
    }
    setErreur('');
    setGroupe(res.data || null);
  };

  useEffect(() => {
    if (codeParam) void charger(codeParam.toUpperCase());
  }, [codeParam]);

  const creer = async () => {
    if (!user) {
      router.push('/login?redirect=/groupe');
      return;
    }
    const res = await creerGroupe();
    if (res.success && res.data) {
      setCode(res.data.code);
      setLien(`${window.location.origin}/groupe?code=${res.data.code}`);
      await charger(res.data.code);
    } else setErreur(res.message || 'Création impossible');
  };

  const finaliser = async () => {
    if (!code) return;
    const res = await fermerGroupe(code);
    if (!res.success || !res.data) {
      setErreur(res.message || 'Impossible de finaliser');
      return;
    }
    try {
      sessionStorage.setItem('afro_groupe_checkout', JSON.stringify(res.data.articlesCheckout));
    } catch {
      /* ignore */
    }
    router.push('/panier?groupe=1');
  };

  return (
    <main className="mx-auto w-full max-w-xl flex-grow px-4 py-10">
      <h1 className="font-title text-4xl">Commande de groupe</h1>
      <p className="mt-2 text-sm opacity-70">Créez un panier partagé : chacun ajoute ses plats, vous payez.</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={() => void creer()} className="rounded-2xl bg-[var(--ochre)] px-4 py-3 text-sm font-semibold text-white">
          Créer un groupe
        </button>
        <form
          className="flex flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const c = code.trim().toUpperCase();
            setCode(c);
            router.replace(`/groupe?code=${c}`);
            void charger(c);
          }}
        >
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="GRP-XXXXXX"
            className="flex-1 rounded-2xl border border-[var(--wood)]/15 bg-white px-4 py-3 text-sm"
          />
          <button type="submit" className="rounded-2xl border border-[var(--wood)]/20 px-4 py-3 text-sm">
            Rejoindre
          </button>
        </form>
      </div>

      {lien && (
        <p className="mt-4 break-all rounded-xl bg-white/80 p-3 text-xs">
          Lien à partager : <Link href={lien}>{lien}</Link>
        </p>
      )}
      {erreur && <p className="mt-4 text-sm text-red-700">{erreur}</p>}
      {loading && <p className="mt-4 text-sm opacity-60">Auth…</p>}

      {groupe && (
        <section className="mt-8 rounded-[24px] border border-[var(--ochre)]/25 bg-white/70 p-5">
          <p className="font-mono text-lg text-[var(--ochre)]">{groupe.code}</p>
          <p className="text-sm opacity-70">
            Hôte : {groupe.hote.prenom} · {groupe.statut}
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {(groupe.articles || []).map((a, i) => (
              <li key={i} className="flex justify-between gap-2 border-b border-[var(--wood)]/10 py-2">
                <span>
                  {a.quantite}× {a.nomPlat} <span className="opacity-50">({a.nom})</span>
                </span>
                <span>{(a.prixUnitaire * a.quantite).toFixed(2)} €</span>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => void finaliser()} className="mt-4 w-full rounded-2xl bg-[var(--wood)] px-4 py-3 text-sm font-semibold text-white">
            Finaliser et aller au panier
          </button>
          <Link href="/catalogue" className="mt-3 block text-center text-sm text-[var(--ochre)] underline">
            Ajouter des plats depuis le catalogue
          </Link>
        </section>
      )}
    </main>
  );
}

export default function GroupePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--ivory)] text-[var(--wood)]">
      <Header />
      <Suspense fallback={<p className="p-8 text-sm opacity-60">Chargement…</p>}>
        <GroupeInner />
      </Suspense>
      <Footer />
    </div>
  );
}
