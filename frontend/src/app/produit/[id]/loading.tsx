export default function LoadingProduit() {
  return (
    <div className="min-h-screen bg-[var(--ivory)] text-[var(--wood)]">
      <main className="mx-auto w-full max-w-[1400px] px-6 py-10 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Galerie */}
          <section className="lg:col-span-7">
            <div className="grid gap-4 lg:grid-cols-[92px_1fr]">
              <div className="hidden lg:grid gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[78px] w-[92px] animate-pulse rounded-2xl bg-[var(--wood)]/10"
                  />
                ))}
              </div>
              <div className="h-[520px] w-full animate-pulse rounded-[34px] bg-[var(--wood)]/10" />
            </div>
          </section>

          {/* Infos */}
          <section className="lg:col-span-5">
            <div className="rounded-[34px] border border-[var(--wood)]/10 bg-white/55 p-6 backdrop-blur lg:p-8">
              <div className="h-5 w-28 animate-pulse rounded bg-[var(--wood)]/10" />
              <div className="mt-5 h-10 w-3/4 animate-pulse rounded-lg bg-[var(--wood)]/10" />
              <div className="mt-3 h-5 w-2/3 animate-pulse rounded bg-[var(--wood)]/10" />
              <div className="mt-6 space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-[var(--wood)]/10" />
                <div className="h-4 w-11/12 animate-pulse rounded bg-[var(--wood)]/10" />
                <div className="h-4 w-10/12 animate-pulse rounded bg-[var(--wood)]/10" />
              </div>
              <div className="mt-8 flex items-center justify-between">
                <div className="h-10 w-40 animate-pulse rounded-full bg-[var(--wood)]/10" />
                <div className="h-10 w-44 animate-pulse rounded-full bg-[var(--wood)]/10" />
              </div>
            </div>
          </section>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-[28px] border border-[var(--wood)]/10 bg-white/55 p-6 backdrop-blur"
              >
                <div className="h-7 w-52 animate-pulse rounded bg-[var(--wood)]/10" />
                <div className="mt-5 space-y-2">
                  <div className="h-4 w-full animate-pulse rounded bg-[var(--wood)]/10" />
                  <div className="h-4 w-11/12 animate-pulse rounded bg-[var(--wood)]/10" />
                  <div className="h-4 w-10/12 animate-pulse rounded bg-[var(--wood)]/10" />
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-4 space-y-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="rounded-[28px] border border-[var(--wood)]/10 bg-white/55 p-6 backdrop-blur"
              >
                <div className="h-7 w-44 animate-pulse rounded bg-[var(--wood)]/10" />
                <div className="mt-5 space-y-2">
                  <div className="h-4 w-full animate-pulse rounded bg-[var(--wood)]/10" />
                  <div className="h-4 w-10/12 animate-pulse rounded bg-[var(--wood)]/10" />
                  <div className="h-4 w-9/12 animate-pulse rounded bg-[var(--wood)]/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

