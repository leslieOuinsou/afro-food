'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BLOG_ARTICLES } from '@/data/blogArticles';
import { SEARCH_PRODUCTS, type SearchProduct } from '@/data/searchCatalog';
import type { BlogArticle } from '@/data/blogArticles';

type FilterPill = 'tout' | 'produits' | 'blog';
type SortTab = 'pertinence' | 'prix' | 'recent';

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function Highlight({ text, term }: { text: string; term: string }) {
  const t = term.trim();
  if (!t) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(t)})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === t.toLowerCase() ? (
          <mark
            key={i}
            className="rounded-md bg-[color:rgba(194,97,15,.35)] px-0.5 text-[var(--wood)] [text-decoration:none]"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function matchesQuery(text: string, q: string) {
  return text.toLowerCase().includes(q.trim().toLowerCase());
}

function scoreProduct(p: SearchProduct, q: string) {
  q = q.trim().toLowerCase();
  if (!q) return 0;
  let s = 0;
  if (p.name.toLowerCase().includes(q)) s += 4;
  if (p.category.toLowerCase().includes(q)) s += 2;
  if (p.origin.toLowerCase().includes(q)) s += 2;
  return s;
}

function scoreArticle(a: BlogArticle, q: string) {
  q = q.trim().toLowerCase();
  if (!q) return 0;
  let s = 0;
  if (a.title.toLowerCase().includes(q)) s += 4;
  if (a.excerpt.toLowerCase().includes(q)) s += 2;
  if (a.tags.some((t) => t.toLowerCase().includes(q))) s += 1;
  if (a.category.toLowerCase().includes(q)) s += 1;
  return s;
}

function parseArticleDateId(id: string) {
  const n = parseInt(id, 10);
  return Number.isNaN(n) ? 0 : n;
}

export default function RechercheSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = searchParams.get('q') ?? '';

  const [input, setInput] = useState(qParam);
  const [filter, setFilter] = useState<FilterPill>('tout');
  const [sort, setSort] = useState<SortTab>('pertinence');

  useEffect(() => {
    setInput(qParam);
  }, [qParam]);

  const q = qParam.trim();

  const filteredProducts = useMemo(() => {
    if (!q) return [];
    return SEARCH_PRODUCTS.filter(
      (p) =>
        matchesQuery(p.name, q) ||
        matchesQuery(p.category, q) ||
        matchesQuery(p.origin, q)
    );
  }, [q]);

  const filteredArticles = useMemo(() => {
    if (!q) return [];
    return BLOG_ARTICLES.filter(
      (a) =>
        matchesQuery(a.title, q) ||
        matchesQuery(a.excerpt, q) ||
        matchesQuery(a.category, q) ||
        a.tags.some((t) => matchesQuery(t, q))
    );
  }, [q]);

  const productsSorted = useMemo(() => {
    let list = [...filteredProducts];
    if (sort === 'prix') list.sort((a, b) => a.price - b.price);
    else if (sort === 'pertinence') list.sort((a, b) => scoreProduct(b, q) - scoreProduct(a, q));
    else list.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    return list;
  }, [filteredProducts, sort, q]);

  const articlesSorted = useMemo(() => {
    let list = [...filteredArticles];
    if (sort === 'recent') list.sort((a, b) => parseArticleDateId(b.id) - parseArticleDateId(a.id));
    else if (sort === 'pertinence') list.sort((a, b) => scoreArticle(b, q) - scoreArticle(a, q));
    else list.sort((a, b) => a.title.localeCompare(b.title, 'fr'));
    return list;
  }, [filteredArticles, sort, q]);

  const visibleProducts = filter === 'tout' || filter === 'produits' ? productsSorted : [];
  const visibleArticles = filter === 'tout' || filter === 'blog' ? articlesSorted : [];

  const totalCount = visibleProducts.length + visibleArticles.length;

  const submitSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const next = input.trim();
      const params = new URLSearchParams();
      if (next) params.set('q', next);
      router.push(`/recherche${params.toString() ? `?${params.toString()}` : ''}`);
    },
    [input, router]
  );

  const hasQuery = q.length > 0;
  const isEmpty = hasQuery && totalCount === 0;

  const SUGGESTIONS = ['jollof', 'bissap', 'Sénégal', 'épices', 'thieboudienne'];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--ivory)] text-[var(--wood)]">
      <Header />
      <main className="flex-grow pb-20">
        <div className="border-b border-[var(--wood)]/10 bg-[var(--paper)]/80">
          <div className="mx-auto max-w-[1100px] px-6 py-10 lg:px-12 lg:py-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--wood)]/55">Recherche</p>
            <form onSubmit={submitSearch} className="mt-4">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--wood)]/40">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.35-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="search"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Plats, épices, articles du blog…"
                  className="w-full rounded-2xl border border-[var(--wood)]/12 bg-white/80 py-4 pl-12 pr-4 text-[var(--wood)] shadow-sm outline-none transition focus:border-[var(--ochre)]/45 focus:ring-2 focus:ring-[color:rgba(194,97,15,.2)]"
                  aria-label="Rechercher"
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="rounded-full bg-[var(--ochre)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#a6500c]"
                >
                  Rechercher
                </button>
                {hasQuery && (
                  <Link
                    href="/recherche"
                    className="rounded-full border border-[var(--wood)]/15 bg-white/50 px-6 py-2.5 text-sm font-semibold text-[var(--wood)]/80 hover:bg-white/80"
                  >
                    Effacer
                  </Link>
                )}
              </div>
            </form>

            {hasQuery && (
              <>
                <p className="mt-8 font-ui text-sm text-[var(--wood)]/70">
                  {isEmpty ? (
                    <>Aucun résultat pour « {q} »</>
                  ) : (
                    <>
                      <span className="font-semibold text-[var(--wood)]">{totalCount}</span> résultat
                      {totalCount > 1 ? 's' : ''} pour{' '}
                      <mark className="rounded bg-[color:rgba(194,97,15,.3)] px-1.5 py-0.5 text-[var(--wood)]">{q}</mark>
                    </>
                  )}
                </p>

                {/* Filtres pills */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {(
                    [
                      ['tout', 'Tout'],
                      ['produits', 'Produits'],
                      ['blog', 'Blog'],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setFilter(id)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        filter === id
                          ? 'border-[var(--ochre)]/45 bg-[color:rgba(194,97,15,.14)] text-[var(--wood)] ring-1 ring-[var(--ochre)]/25'
                          : 'border-[var(--wood)]/12 bg-white/50 text-[var(--wood)]/80 hover:bg-white/80'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Tri */}
                <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--wood)]/10 pt-6">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--wood)]/50">Trier</span>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ['pertinence', 'Pertinence'],
                        ['prix', 'Prix'],
                        ['recent', 'Plus récents'],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSort(id)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                          sort === id
                            ? 'bg-[var(--wood)] text-[var(--ivory)]'
                            : 'text-[var(--wood)]/75 hover:bg-white/60'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mx-auto max-w-[1100px] px-6 pt-10 lg:px-12 lg:pt-12">
          {!hasQuery && (
            <div className="rounded-[28px] border border-[var(--wood)]/10 bg-white/50 p-10 text-center backdrop-blur">
              <p className="font-title text-2xl text-[var(--wood)]">Par où commencer ?</p>
              <p className="mt-2 text-sm text-[var(--wood)]/70">
                Saisissez un ou plusieurs mots dans la barre ci-dessus pour explorer le catalogue et le magazine.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <Link
                    key={s}
                    href={`/recherche?q=${encodeURIComponent(s)}`}
                    className="rounded-full border border-[var(--wood)]/12 bg-[var(--paper)] px-4 py-2 text-sm font-semibold text-[var(--wood)] hover:border-[var(--ochre)]/40"
                  >
                    {s}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {isEmpty && (
            <div className="rounded-[28px] border border-[var(--brick)]/20 bg-[color:rgba(139,58,42,.07)] px-8 py-14 text-center">
              <div className="mx-auto flex max-w-sm justify-center text-[var(--ochre)]/40" aria-hidden>
                <svg viewBox="0 0 200 160" className="h-36 w-full">
                  <ellipse cx="100" cy="140" rx="80" ry="12" fill="currentColor" opacity="0.2" />
                  <circle cx="100" cy="70" r="48" fill="none" stroke="currentColor" strokeWidth="3" />
                  <path d="M76 70h48M100 46v48" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <rect x="40" y="24" width="120" height="72" rx="8" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5" />
                </svg>
              </div>
              <h2 className="font-title mt-6 text-2xl text-[var(--wood)]">Aucun résultat</h2>
              <p className="mt-2 text-sm text-[var(--wood)]/75">
                Essayez un autre mot-clé ou élargissez votre recherche (pays, type de plat, nom…).
              </p>
              <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-[var(--wood)]/50">Suggestions</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <Link
                    key={s}
                    href={`/recherche?q=${encodeURIComponent(s)}`}
                    className="rounded-full bg-[var(--ochre)] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a6500c]"
                  >
                    {s}
                  </Link>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/catalogue" className="text-sm font-semibold text-[var(--ochre)] underline decoration-[var(--ochre)]/40 underline-offset-4">
                  Voir le catalogue
                </Link>
                <span className="text-[var(--wood)]/30">·</span>
                <Link href="/blog" className="text-sm font-semibold text-[var(--ochre)] underline decoration-[var(--ochre)]/40 underline-offset-4">
                  Blog
                </Link>
              </div>
            </div>
          )}

          {hasQuery && !isEmpty && (
            <div className="space-y-14">
              {visibleProducts.length > 0 && (
                <section>
                  <h2 className="font-title text-2xl text-[var(--wood)]">Produits</h2>
                  <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleProducts.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/produit/${p.id}`}
                          className="group flex overflow-hidden rounded-[22px] border border-[var(--wood)]/10 bg-white/55 shadow-sm backdrop-blur transition hover:bg-white/70"
                        >
                          <div className="h-24 w-24 shrink-0">
                            <img src={p.image} alt="" className="h-full w-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1 p-4">
                            <p className="font-semibold text-[var(--wood)] group-hover:text-[var(--ochre)]">
                              <Highlight text={p.name} term={q} />
                            </p>
                            <p className="mt-1 text-xs text-[var(--wood)]/60">
                              {p.category} · {p.origin}
                            </p>
                            <p className="mt-2 font-title text-lg text-[var(--ochre)]">
                              {p.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {visibleArticles.length > 0 && (
                <section>
                  <h2 className="font-title text-2xl text-[var(--wood)]">Magazine</h2>
                  <ul className="mt-6 space-y-4">
                    {visibleArticles.map((a) => (
                      <li key={a.id}>
                        <Link
                          href={`/blog/${a.id}`}
                          className="flex gap-4 rounded-[22px] border border-[var(--wood)]/10 bg-white/55 p-4 backdrop-blur transition hover:bg-white/70"
                        >
                          <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl">
                            <img src={a.image} alt="" className="h-full w-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold leading-snug text-[var(--wood)]">
                              <Highlight text={a.title} term={q} />
                            </p>
                            <p className="mt-1 line-clamp-2 text-sm text-[var(--wood)]/70">{a.excerpt}</p>
                            <p className="mt-2 text-xs text-[var(--wood)]/50">{a.date}</p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
