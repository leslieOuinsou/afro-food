'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/** Catalogue = page « menu » du site */
const MENU_HREF = '/catalogue';
const AFFICHAGE_MIN_MS = 2200;

export default function HomePage() {
  const router = useRouter();
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const started = performance.now();
    let frame: number;

    const tick = () => {
      const elapsed = performance.now() - started;
      const target = Math.min(100, (elapsed / AFFICHAGE_MIN_MS) * 100);
      setPct((prev) => (target > prev ? target : prev));
      if (elapsed < AFFICHAGE_MIN_MS) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const go = window.setTimeout(() => {
      router.replace(MENU_HREF);
    }, AFFICHAGE_MIN_MS);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(go);
    };
  }, [router]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--ivory)] px-6 text-[var(--wood)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        aria-hidden
        style={{
          backgroundImage: `radial-gradient(circle at 30% 20%, #C2610F 0%, transparent 45%),
            radial-gradient(circle at 70% 80%, #2C1A0E 0%, transparent 50%)`,
        }}
      />

      <div className="relative z-[1] flex max-w-sm flex-col items-center text-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 animate-pulse rounded-full bg-[#C2610F]/20 blur-xl" aria-hidden />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-[28px] border border-[var(--wood)]/10 bg-white shadow-[0_20px_50px_rgba(44,26,14,.12)]">
            <Image src="/logo-afro-eats.png" alt="Afro-food" width={72} height={72} className="object-contain" priority />
          </div>
        </div>

        <p className="font-ui text-xs font-semibold uppercase tracking-[0.2em] text-[#C2610F]">Afro-food</p>
        <h1 className="font-title mt-3 text-2xl tracking-tight text-[var(--wood)] sm:text-3xl">Préparation du menu…</h1>
        <p className="mt-2 font-ui text-sm leading-relaxed text-[var(--wood)]/65">
          Chargement de vos saveurs préférées.
        </p>

        <div className="mt-10 h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-[var(--wood)]/10" aria-hidden>
          <div
            className="h-full rounded-full bg-[#C2610F] transition-[width] duration-150 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        <Link
          href={MENU_HREF}
          className="mt-10 font-ui text-sm font-semibold text-[#C2610F] underline decoration-[#C2610F]/35 underline-offset-4 transition hover:decoration-[#C2610F]"
        >
          Passer cette étape et ouvrir le menu
        </Link>
      </div>
    </div>
  );
}
