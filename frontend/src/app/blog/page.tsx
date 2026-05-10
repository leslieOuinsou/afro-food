'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  BLOG_ARTICLES,
  FACET_LABELS,
  type BlogFacet,
} from '@/data/blogArticles';

const ALL_TAGS = Array.from(new Set(BLOG_ARTICLES.flatMap((a) => a.tags))).slice(0, 8);

export default function BlogPage() {
  const [facet, setFacet] = useState<BlogFacet | null>(null);

  const filtered = useMemo(() => {
    if (!facet) return BLOG_ARTICLES;
    return BLOG_ARTICLES.filter((a) => a.facet === facet);
  }, [facet]);

  const featured = filtered[0] ?? BLOG_ARTICLES[0];
  const recents = (filtered.length > 1 ? filtered.slice(1, 4) : BLOG_ARTICLES.slice(1, 4)).slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--ivory)] text-[var(--wood)]">
      <Header />
      <main className="flex-grow">
        {/* Hero à la une — plein largeur */}
        <section className="relative w-full overflow-hidden border-b border-[var(--wood)]/10">
          <div className="relative min-h-[min(72vh,640px)]">
            <img
              src={featured.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2C1A0E] via-[#2C1A0E]/55 to-transparent" />
            <div className="relative mx-auto flex min-h-[min(72vh,640px)] max-w-[1400px] flex-col justify-end px-6 pb-14 pt-24 lg:px-12 lg:pb-20">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ivory)]/70">
                À la une · {FACET_LABELS[featured.facet]}
              </p>
              <h1 className="font-title mt-4 max-w-4xl text-4xl leading-[0.95] tracking-tight text-[var(--ivory)] sm:text-5xl lg:text-6xl">
                {featured.title}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--ivory)]/85 lg:text-lg">
                {featured.excerpt}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={`/blog/${featured.id}`}
                  className="inline-flex rounded-full bg-[var(--ochre)] px-8 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(194,97,15,.25)] hover:bg-[#a6500c]"
                >
                  Lire l’article
                </Link>
                <span className="text-sm text-[var(--ivory)]/70">
                  {featured.date} · {featured.readTime} de lecture
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1400px] px-6 py-14 lg:grid lg:grid-cols-12 lg:gap-12 lg:px-12 lg:py-16">
          {/* Grille asymétrique — 3 articles récents */}
          <div className="lg:col-span-8">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-title text-3xl text-[var(--wood)] lg:text-4xl">Récemment</h2>
                <p className="mt-1 text-sm text-[var(--wood)]/65">Sélection magazine</p>
              </div>
              {facet && (
                <button
                  type="button"
                  onClick={() => setFacet(null)}
                  className="text-sm font-semibold text-[var(--ochre)] hover:underline"
                >
                  Tout afficher
                </button>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-12 lg:gap-6">
              {recents.length === 0 && (
                <p className="col-span-full text-sm text-[var(--wood)]/65 lg:col-span-12">
                  Aucun autre article dans cette sélection pour le moment.
                </p>
              )}
              {recents[0] && (
                <article className="group overflow-hidden rounded-[28px] border border-[var(--wood)]/10 bg-white/55 shadow-sm backdrop-blur lg:col-span-7">
                  <Link href={`/blog/${recents[0].id}`} className="block">
                    <div className="aspect-[16/10] overflow-hidden">
                      <img
                        src={recents[0].image}
                        alt=""
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="p-6">
                      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--ochre)]">
                        {FACET_LABELS[recents[0].facet]}
                      </span>
                      <h3 className="font-title mt-2 text-2xl leading-tight text-[var(--wood)] group-hover:text-[var(--ochre)]">
                        {recents[0].title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm text-[var(--wood)]/70">{recents[0].excerpt}</p>
                    </div>
                  </Link>
                </article>
              )}
              <div className="flex flex-col gap-6 lg:col-span-5">
                {recents.slice(1).map((a) => (
                  <article
                    key={a.id}
                    className="group flex overflow-hidden rounded-[24px] border border-[var(--wood)]/10 bg-white/55 shadow-sm backdrop-blur transition hover:bg-white/70"
                  >
                    <Link href={`/blog/${a.id}`} className="flex min-h-0 w-full gap-4">
                      <div className="relative h-36 w-32 shrink-0 overflow-hidden sm:h-40 sm:w-40">
                        <img src={a.image} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-center py-4 pr-4">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--brick)]">
                          {FACET_LABELS[a.facet]}
                        </span>
                        <h3 className="font-title mt-1 text-lg leading-snug text-[var(--wood)] group-hover:text-[var(--ochre)] line-clamp-3">
                          {a.title}
                        </h3>
                        <p className="mt-2 text-xs text-[var(--wood)]/55">{a.date}</p>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="mt-12 space-y-10 lg:col-span-4 lg:mt-0">
            <div className="rounded-[28px] border border-[var(--wood)]/10 bg-white/55 p-6 backdrop-blur">
              <h3 className="font-title text-xl text-[var(--wood)]">Catégories</h3>
              <ul className="mt-4 space-y-1">
                {(Object.keys(FACET_LABELS) as BlogFacet[]).map((key) => (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => setFacet(facet === key ? null : key)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                        facet === key
                          ? 'bg-[color:rgba(194,97,15,.14)] text-[var(--wood)] ring-1 ring-[var(--ochre)]/30'
                          : 'text-[var(--wood)]/80 hover:bg-white/60'
                      }`}
                    >
                      {FACET_LABELS[key]}
                      <span className="text-xs text-[var(--wood)]/45">
                        {BLOG_ARTICLES.filter((a) => a.facet === key).length}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[28px] border border-[var(--wood)]/10 bg-white/55 p-6 backdrop-blur">
              <h3 className="font-title text-xl text-[var(--wood)]">Tags</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {ALL_TAGS.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-[var(--wood)]/15 bg-[var(--paper)] px-3 py-1 text-xs font-medium text-[var(--wood)]/80"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-[var(--brick)]/20 bg-[color:rgba(139,58,42,.08)] p-6">
              <h3 className="font-title text-xl text-[var(--wood)]">Newsletter</h3>
              <p className="mt-2 text-sm text-[var(--wood)]/75">
                Recettes, portraits et conseils — une fois par semaine.
              </p>
              <form
                className="mt-4 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                }}
              >
                <label className="sr-only" htmlFor="blog-newsletter-email">
                  Email
                </label>
                <input
                  id="blog-newsletter-email"
                  type="email"
                  placeholder="votre@email.com"
                  className="w-full rounded-2xl border border-[var(--wood)]/15 bg-white/80 px-4 py-3 text-sm text-[var(--wood)] outline-none focus:border-[var(--ochre)]/45"
                />
                <button
                  type="submit"
                  className="w-full rounded-full bg-[var(--wood)] py-3 text-sm font-semibold text-[var(--ivory)] hover:bg-[var(--wood)]/95"
                >
                  S’inscrire
                </button>
              </form>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
