'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  getArticleById,
  getRelatedArticles,
  FACET_LABELS,
} from '@/data/blogArticles';

export default function BlogArticlePage() {
  const params = useParams();
  const id = params?.id as string;
  const article = id ? getArticleById(id) : undefined;
  const related = id ? getRelatedArticles(id, 3) : [];

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--ivory)] text-[var(--wood)]">
        <Header />
        <main className="flex-grow flex items-center justify-center px-6 py-20">
          <div className="text-center">
            <h1 className="font-title text-3xl text-[var(--wood)]">Article introuvable</h1>
            <Link href="/blog" className="mt-6 inline-block text-sm font-semibold text-[var(--ochre)] hover:underline">
              ← Retour au magazine
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const paragraphs = article.content.split(/\n\n+/).filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--ivory)] text-[var(--wood)]">
      <Header />
      <article className="flex-grow">
        {/* Hero photo */}
        <header className="relative w-full overflow-hidden">
          <div className="relative aspect-[21/9] min-h-[280px] max-h-[min(56vh,520px)] w-full sm:aspect-[2.4/1]">
            <img src={article.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--ivory)] via-transparent to-[#2C1A0E]/30" />
          </div>
        </header>

        <div className="mx-auto max-w-[720px] px-6 pt-4 pb-16 lg:px-8 lg:pt-8 lg:pb-24">
          <Link
            href="/blog"
            className="inline-flex text-sm font-semibold text-[var(--ochre)] hover:underline"
          >
            ← Magazine
          </Link>

          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brick)]">
            {FACET_LABELS[article.facet]} · {article.category}
          </p>

          <h1 className="font-title mt-4 text-4xl leading-[0.98] tracking-tight text-[var(--wood)] sm:text-5xl lg:text-[3.25rem]">
            {article.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-[var(--wood)]/65">
            <span>{article.date}</span>
            <span aria-hidden>·</span>
            <span>{article.readTime} de lecture</span>
          </div>

          <p className="mt-8 text-xl leading-relaxed text-[var(--wood)]/85 lg:text-[1.35rem]">{article.excerpt}</p>

          {/* Corps de texte large */}
          <div className="prose-blog mt-12 space-y-6 text-lg leading-[1.75] text-[var(--wood)]/90">
            {paragraphs.map((p, i) => (
              <p key={i} className="font-ui text-[1.0625rem] lg:text-[1.125rem]">
                {p}
              </p>
            ))}
          </div>

          {/* Bloc auteur */}
          <aside className="mt-14 rounded-[28px] border border-[var(--wood)]/10 bg-white/60 p-8 backdrop-blur">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[color:rgba(194,97,15,.15)] font-title text-2xl text-[var(--ochre)]">
                {article.author
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--wood)]/55">Auteur</p>
                <p className="font-title mt-1 text-2xl text-[var(--wood)]">{article.author}</p>
                <p className="mt-3 text-sm leading-relaxed text-[var(--wood)]/75">{article.authorBio}</p>
              </div>
            </div>
          </aside>

          {/* Tags */}
          <div className="mt-10 flex flex-wrap gap-2">
            {article.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-[var(--wood)]/12 bg-[var(--paper)] px-3 py-1 text-xs font-medium text-[var(--wood)]/75"
              >
                #{t}
              </span>
            ))}
          </div>
        </div>

        {/* Articles liés */}
        {related.length > 0 && (
          <section className="border-t border-[var(--wood)]/10 bg-[color:rgba(44,26,14,.03)] py-16 lg:py-20">
            <div className="mx-auto max-w-[1200px] px-6 lg:px-12">
              <h2 className="font-title text-3xl text-[var(--wood)]">À lire ensuite</h2>
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/blog/${r.id}`}
                    className="group overflow-hidden rounded-[24px] border border-[var(--wood)]/10 bg-white/55 shadow-sm backdrop-blur transition hover:bg-white/70"
                  >
                    <div className="aspect-[16/10] overflow-hidden">
                      <img
                        src={r.image}
                        alt=""
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="p-5">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ochre)]">
                        {FACET_LABELS[r.facet]}
                      </span>
                      <h3 className="font-title mt-2 text-xl leading-snug text-[var(--wood)] group-hover:text-[var(--ochre)] line-clamp-2">
                        {r.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm text-[var(--wood)]/65">{r.excerpt}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </article>
      <Footer />
    </div>
  );
}
