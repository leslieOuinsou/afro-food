export default function LoadingCatalogue() {
  return (
    <div className="min-h-screen bg-[var(--ivory)] text-[var(--wood)]">
      <main className="mx-auto w-full max-w-[1400px] px-6 py-10 lg:px-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
          {/* Sidebar skeleton */}
          <aside className="lg:w-[340px]">
            <div className="rounded-[28px] border border-[var(--wood)]/10 bg-white/55 p-6 backdrop-blur">
              <div className="h-7 w-40 animate-pulse rounded-lg bg-[var(--wood)]/10" />
              <div className="mt-6 space-y-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i}>
                    <div className="h-4 w-28 animate-pulse rounded bg-[var(--wood)]/10" />
                    <div className="mt-3 space-y-2">
                      {Array.from({ length: 3 }).map((__, j) => (
                        <div key={j} className="h-10 w-full animate-pulse rounded-xl bg-[var(--wood)]/8" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 h-11 w-full animate-pulse rounded-full bg-[var(--wood)]/10" />
            </div>
          </aside>

          {/* Content skeleton */}
          <section className="flex-1">
            <div className="rounded-[28px] border border-[var(--wood)]/10 bg-white/55 p-6 backdrop-blur">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="h-10 w-full animate-pulse rounded-2xl bg-[var(--wood)]/10 lg:max-w-[520px]" />
                <div className="h-10 w-56 animate-pulse rounded-2xl bg-[var(--wood)]/10" />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {Array.from({ length: 9 }).map((_, idx) => (
                <article
                  key={idx}
                  className="overflow-hidden rounded-[28px] border border-[var(--wood)]/10 bg-white/55 shadow-sm backdrop-blur"
                >
                  <div className="h-44 w-full animate-pulse bg-[var(--wood)]/10" />
                  <div className="p-5">
                    <div className="h-5 w-3/4 animate-pulse rounded bg-[var(--wood)]/10" />
                    <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-[var(--wood)]/10" />
                    <div className="mt-6 flex items-center justify-between">
                      <div className="h-7 w-20 animate-pulse rounded bg-[var(--wood)]/10" />
                      <div className="h-10 w-28 animate-pulse rounded-full bg-[var(--wood)]/10" />
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-10 flex items-center justify-center gap-3">
              <div className="h-10 w-24 animate-pulse rounded-full bg-[var(--wood)]/10" />
              <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--wood)]/10" />
              <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--wood)]/10" />
              <div className="h-10 w-24 animate-pulse rounded-full bg-[var(--wood)]/10" />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

