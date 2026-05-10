'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function useCountUp(end: number, durationMs: number, enabled: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * end));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end, durationMs, enabled]);
  return value;
}

function useInViewOnce<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

const TIMELINE = [
  {
    year: '2023',
    title: 'L’idée',
    text: 'Constat : les saveurs africaines méritent une vitrine digne des producteurs. Esquisse d’une marketplace pensée comme un magazine.',
  },
  {
    year: '2024',
    title: 'Première sélection',
    text: 'Montée en puissance du catalogue : épices, plats maison, boissons. Fiches produits détaillées et traçabilité renforcée.',
  },
  {
    year: '2025',
    title: 'Ouverture élargie',
    text: 'Nouvelles régions, outils pour les artisans, et communauté qui grandit autour des commandes et des histoires.',
  },
  {
    year: '2026',
    title: 'Aujourd’hui',
    text: 'Afro-food propose une expérience éditoriale, chaleureuse et ancrée dans le réel, autour des saveurs africaines.',
  },
];

const TEAM = [
  {
    name: 'Amara K.',
    role: 'Direction & vision',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80',
  },
  {
    name: 'Fatou D.',
    role: 'Partenariats producteurs',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&q=80',
  },
  {
    name: 'Kofi T.',
    role: 'Expérience produit',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80',
  },
  {
    name: 'Léa M.',
    role: 'Contenu & communauté',
    image: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=800&q=80',
  },
];

export default function AboutPage() {
  const statsRef = useInViewOnce<HTMLDivElement>();
  const guides = useCountUp(120, 1600, statsRef.inView);
  const pays = useCountUp(18, 1600, statsRef.inView);
  const produits = useCountUp(2100, 2000, statsRef.inView);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--ivory)] text-[var(--wood)]">
      <Header />

      {/* Hero mission — plein écran */}
      <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden border-b border-[var(--wood)]/10">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2C1A0E] via-[#2C1A0E]/75 to-[#2C1A0E]/35" />
        <div className="relative z-[1] mx-auto max-w-[1100px] px-6 pb-20 pt-32 text-center lg:px-12 lg:pb-28">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--ivory)]/70">Notre mission</p>
          <h1 className="font-title mt-6 text-4xl leading-[0.95] tracking-tight text-[var(--ivory)] sm:text-5xl lg:text-6xl xl:text-7xl">
            Mettre l’Afrique à table,
            <br />
            <span className="text-[var(--ochre)]">sans en rabattre</span> du goût ni des histoires.
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-[var(--ivory)]/85 lg:text-lg">
            Une marketplace où chaque plat, chaque épice et chaque bouteille raconte une terre, une main, une communauté.
          </p>
        </div>
      </section>

      {/* Histoire — timeline verticale */}
      <section className="mx-auto max-w-[720px] px-6 py-20 lg:px-12 lg:py-24">
        <h2 className="font-title text-center text-4xl text-[var(--wood)] lg:text-5xl">Notre histoire</h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-sm text-[var(--wood)]/70">
          De l’idée à la plateforme : les étapes qui ont façonné Afro-food.
        </p>
        <ul className="relative mt-16 space-y-0 border-l-2 border-[var(--wood)]/12 pl-8">
          {TIMELINE.map((item) => (
            <li key={item.year} className="relative pb-14 last:pb-0">
              <span className="absolute -left-[9px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[var(--ochre)]/60 bg-[var(--ivory)] ring-4 ring-[var(--ivory)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--ochre)]" />
              </span>
              <article className="rounded-[24px] border border-[var(--wood)]/10 bg-white/55 p-6 shadow-sm backdrop-blur">
                <p className="font-title text-3xl text-[var(--ochre)]">{item.year}</p>
                <h3 className="font-title mt-2 text-xl text-[var(--wood)]">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--wood)]/75">{item.text}</p>
              </article>
            </li>
          ))}
        </ul>
      </section>

      {/* Valeurs — 3 colonnes */}
      <section className="border-y border-[var(--wood)]/10 bg-[color:rgba(139,58,42,.06)] py-20 lg:py-24">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-12">
          <h2 className="font-title text-center text-4xl text-[var(--wood)] lg:text-5xl">Nos valeurs</h2>
          <div className="mt-14 grid gap-8 md:grid-cols-3 md:gap-6">
            {[
              {
                title: 'Authenticité',
                text: 'Recettes et produits qui honorent les terroirs sans les figer.',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.95 4.95l-.71-.71M4.05 4.05l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                ),
              },
              {
                title: 'Traçabilité',
                text: 'Origines claires, informations lisibles : vous savez ce que vous mettez au panier.',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                ),
              },
              {
                title: 'Communauté',
                text: 'Une place où passionnés et curieux se retrouvent autour des mêmes saveurs.',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                ),
              },
            ].map((v) => (
              <article
                key={v.title}
                className="rounded-[28px] border border-[var(--wood)]/10 bg-[var(--ivory)]/80 p-8 text-center shadow-sm backdrop-blur"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:rgba(194,97,15,.15)] text-[var(--ochre)]">
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    {v.icon}
                  </svg>
                </div>
                <h3 className="font-title mt-6 text-2xl text-[var(--wood)]">{v.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--wood)]/75">{v.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Équipe — grille éditoriale */}
      <section className="mx-auto max-w-[1200px] px-6 py-20 lg:px-12 lg:py-24">
        <h2 className="font-title text-4xl text-[var(--wood)] lg:text-5xl">L’équipe</h2>
        <p className="mt-3 max-w-2xl text-sm text-[var(--wood)]/70">
          Des profils complémentaires, une même obsession : faire vivre la cuisine africaine avec exigence et chaleur.
        </p>
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 lg:gap-5">
          {TEAM.map((m, i) => (
            <figure
              key={m.name}
              className={`group overflow-hidden rounded-[24px] border border-[var(--wood)]/10 bg-white/50 shadow-sm ${
                i === 0 ? 'sm:col-span-2 lg:col-span-2 lg:row-span-2' : ''
              } ${i === 3 ? 'sm:col-span-2 lg:col-span-2 lg:col-start-3 lg:row-start-2' : ''}`}
            >
              <div
                className={
                  i === 0
                    ? 'aspect-[4/3] min-h-[220px] lg:aspect-auto lg:min-h-[min(100%,420px)]'
                    : 'aspect-[4/5] min-h-[200px]'
                }
              >
                <img
                  src={m.image}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <figcaption className="border-t border-[var(--wood)]/08 bg-[var(--paper)]/90 px-4 py-4">
                <p className="font-title text-lg text-[var(--wood)]">{m.name}</p>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--brick)]">{m.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Chiffres clés — animés */}
      <section
        ref={statsRef.ref}
        className="border-t border-[var(--wood)]/10 bg-[#2C1A0E] py-16 text-[var(--ivory)] lg:py-20"
      >
        <div className="mx-auto grid max-w-[1000px] grid-cols-1 gap-10 px-6 text-center sm:grid-cols-3 lg:px-12">
          <div>
            <p className="font-title text-5xl tabular-nums text-[var(--ochre)] lg:text-6xl">{guides}+</p>
            <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-[var(--ivory)]/70">Guides &amp; recettes</p>
          </div>
          <div>
            <p className="font-title text-5xl tabular-nums text-[var(--ochre)] lg:text-6xl">{pays}</p>
            <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-[var(--ivory)]/70">Pays d’origine</p>
          </div>
          <div>
            <p className="font-title text-5xl tabular-nums text-[var(--ochre)] lg:text-6xl">{produits.toLocaleString('fr-FR')}+</p>
            <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-[var(--ivory)]/70">Produits référencés</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-[800px] px-6 text-center lg:px-12">
          <h2 className="font-title text-4xl text-[var(--wood)] lg:text-5xl">Rejoindre la communauté</h2>
          <p className="mt-4 text-sm leading-relaxed text-[var(--wood)]/75">
            Commandez, vendez ou simplement suivez nos histoires : la table s’agrandit avec vous.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/catalogue"
              className="inline-flex w-full justify-center rounded-full bg-[var(--ochre)] px-10 py-4 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(194,97,15,.25)] transition hover:bg-[#a6500c] sm:w-auto"
            >
              Explorer le catalogue
            </Link>
            <Link
              href="/inscription"
              className="inline-flex w-full justify-center rounded-full border border-[var(--wood)]/20 bg-white/60 px-10 py-4 text-sm font-semibold text-[var(--wood)] backdrop-blur transition hover:bg-white sm:w-auto"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
