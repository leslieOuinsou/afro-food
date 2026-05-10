'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_PREFIX = 'afro-eats_promo:';

export type BannerPromoVariant = 'top' | 'editorial' | 'popup';

export type TopMode = 'delivery' | 'countdown';

export type BannerPromoProps = {
  variant: BannerPromoVariant;
  /** Suffixe de clé localStorage (ex. `livraison-hiver-2026`) */
  storageKey: string;
  /** Titre (Cormorant) */
  title: string;
  /** Texte complémentaire (Syne) */
  description?: string;
  /** Pastille ou sur-titre (accent brique) */
  badge?: string;
  /** Variante `top` : message livraison ou compte à rebours */
  topMode?: TopMode;
  /** Fin du compte à rebours (ISO, timestamp ou Date) */
  countdownEnd?: string | number | Date;
  /** Libellé du bouton d’action */
  ctaLabel?: string;
  href?: string;
  /** Bannière éditoriale : visuel */
  imageSrc?: string;
  imageAlt?: string;
  /** Popup : délai avant affichage (ms), défaut 1200 */
  popupDelayMs?: number;
  className?: string;
  /** Masquer le bouton fermer */
  hideClose?: boolean;
  /** Quand le compte à rebours atteint zéro */
  onCountdownEnd?: () => void;
  children?: ReactNode;
};

function storageFullKey(key: string) {
  return `${STORAGE_PREFIX}${key}`;
}

function readDismissed(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(storageFullKey(key)) === '1';
  } catch {
    return false;
  }
}

function writeDismissed(key: string) {
  try {
    window.localStorage.setItem(storageFullKey(key), '1');
  } catch {}
}

function parseEnd(input: string | number | Date): Date {
  if (input instanceof Date) return input;
  if (typeof input === 'number') return new Date(input);
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? new Date(Date.now() + 86400000) : d;
}

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isExpired: boolean;
};

export function useCountdown(end: Date | null, tickMs = 1000): CountdownParts {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!end) return;
    const id = window.setInterval(() => setNow(Date.now()), tickMs);
    return () => window.clearInterval(id);
  }, [end, tickMs]);

  return useMemo(() => {
    if (!end) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isExpired: true };
    }
    const totalMs = Math.max(0, end.getTime() - now);
    const isExpired = totalMs <= 0;
    const sec = Math.floor(totalMs / 1000);
    const days = Math.floor(sec / 86400);
    const hours = Math.floor((sec % 86400) / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    return { days, hours, minutes, seconds, totalMs, isExpired };
  }, [end, now]);
}

function TimeSegment({
  value,
  label,
  accentClass,
}: {
  value: number;
  label: string;
  accentClass: string;
}) {
  const str = String(value).padStart(2, '0');
  const [bump, setBump] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (value !== prev.current) {
      prev.current = value;
      setBump(true);
      const t = window.setTimeout(() => setBump(false), 320);
      return () => window.clearTimeout(t);
    }
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className={`flex min-w-[2.75rem] items-center justify-center rounded-lg border-2 px-2 py-1.5 font-ui text-lg font-bold tabular-nums text-[#FAF3E0] shadow-inner transition-transform duration-200 sm:min-w-[3rem] sm:text-xl ${
          accentClass
        } ${bump ? 'scale-105 motion-safe:animate-[promo-digit-pop_0.28s_ease-out]' : 'scale-100'}`}
      >
        {str}
      </span>
      <span className="font-ui text-[10px] font-semibold uppercase tracking-wider text-[#FAF3E0]/75">
        {label}
      </span>
    </div>
  );
}

function CountdownRow({
  end,
  accentBorder,
  onEnd,
}: {
  end: Date;
  accentBorder: string;
  onEnd?: () => void;
}) {
  const { days, hours, minutes, seconds, isExpired, totalMs } = useCountdown(end);
  const endedRef = useRef(false);

  useEffect(() => {
    if (isExpired && totalMs === 0 && !endedRef.current) {
      endedRef.current = true;
      onEnd?.();
    }
  }, [isExpired, totalMs, onEnd]);

  if (isExpired) {
    return (
      <p className="font-ui text-sm font-semibold text-[#FAF3E0]/90">Offre terminée — restez à l’affût !</p>
    );
  }

  return (
    <div
      className="flex flex-wrap items-end justify-center gap-2 sm:gap-3 md:justify-start"
      aria-live="polite"
      aria-atomic="true"
    >
      {days > 0 ? <TimeSegment value={days} label="j" accentClass={accentBorder} /> : null}
      <TimeSegment value={hours} label="h" accentClass={accentBorder} />
      <TimeSegment value={minutes} label="min" accentClass={accentBorder} />
      <TimeSegment value={seconds} label="s" accentClass={accentBorder} />
    </div>
  );
}

function CloseButton({ onClick, label = 'Fermer la promotion' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#FAF3E0]/25 text-[#FAF3E0]/90 transition hover:bg-[#8B3A2A]/35 hover:text-[#FAF3E0]"
      aria-label={label}
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

export default function BannerPromo({
  variant,
  storageKey,
  title,
  description,
  badge,
  topMode = 'delivery',
  countdownEnd,
  ctaLabel,
  href,
  imageSrc,
  imageAlt = '',
  popupDelayMs = 1200,
  className = '',
  hideClose = false,
  onCountdownEnd,
  children,
}: BannerPromoProps) {
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);

  const endDate = useMemo(() => {
    if (!countdownEnd) return null;
    return parseEnd(countdownEnd);
  }, [countdownEnd]);

  useEffect(() => {
    setReady(true);
    setDismissed(readDismissed(storageKey));
  }, [storageKey]);

  const close = useCallback(() => {
    writeDismissed(storageKey);
    setDismissed(true);
    setPopupVisible(false);
  }, [storageKey]);

  useEffect(() => {
    if (variant !== 'popup' || !ready || dismissed) return;
    const t = window.setTimeout(() => setPopupVisible(true), popupDelayMs);
    return () => window.clearTimeout(t);
  }, [variant, ready, dismissed, popupDelayMs]);

  useEffect(() => {
    if (variant !== 'popup' || !popupVisible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [variant, popupVisible]);

  useEffect(() => {
    if (variant !== 'popup' || !popupVisible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [variant, popupVisible, close]);

  if (!ready || dismissed) return null;

  const accentBorder = 'border-[#8B3A2A] bg-[#8B3A2A]/25';
  const shell = 'bg-[#C2610F] text-[#FAF3E0]';

  /* ——— Top ——— */
  if (variant === 'top') {
    return (
      <>
        <div
          role="region"
          aria-label="Promotion"
          className={`fixed left-0 right-0 top-0 z-[110] ${shell} shadow-[0_6px_24px_rgba(44,26,14,.2)] ${className}`}
        >
          <div className="mx-auto flex max-w-[1400px] items-start gap-3 px-4 py-2.5 sm:items-center sm:px-6 lg:px-10">
            <div className="min-w-0 flex-1 text-center sm:text-left">
              {badge ? (
                <span className="mb-1 inline-block rounded-full border border-[#8B3A2A]/50 bg-[#8B3A2A]/20 px-2.5 py-0.5 font-ui text-[10px] font-bold uppercase tracking-widest text-[#FAF3E0]">
                  {badge}
                </span>
              ) : null}
              <p className="font-title text-base leading-tight tracking-tight sm:text-lg md:text-xl">{title}</p>
              {description && topMode === 'delivery' ? (
                <p className="mt-0.5 font-ui text-xs text-[#FAF3E0]/85 sm:text-sm">{description}</p>
              ) : null}
              {topMode === 'countdown' && endDate ? (
                <div className="mt-2 flex flex-col items-center gap-2 sm:flex-row sm:justify-center md:justify-start">
                  {description ? (
                    <p className="font-ui text-xs text-[#FAF3E0]/88 sm:text-sm md:mr-2">{description}</p>
                  ) : null}
                  <CountdownRow end={endDate} accentBorder={accentBorder} onEnd={onCountdownEnd} />
                </div>
              ) : null}
              {children}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {ctaLabel && href ? (
                <Link
                  href={href}
                  className="hidden rounded-full border-2 border-[#8B3A2A] bg-[#8B3A2A]/30 px-4 py-1.5 font-ui text-xs font-semibold text-[#FAF3E0] transition hover:bg-[#8B3A2A]/45 md:inline-flex"
                >
                  {ctaLabel}
                </Link>
              ) : null}
              {!hideClose ? <CloseButton onClick={close} /> : null}
            </div>
          </div>
        </div>
        {/* Réserve l’espace sous le bandeau fixe */}
        <div className="h-[72px] w-full shrink-0 sm:h-[64px]" aria-hidden />
      </>
    );
  }

  /* ——— Editorial ——— */
  if (variant === 'editorial') {
    return (
      <section
        role="region"
        aria-label="Mise en avant"
        className={`relative w-full overflow-hidden ${shell} ${className}`}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -12deg,
              #8B3A2A 0px,
              #8B3A2A 1px,
              transparent 1px,
              transparent 14px
            )`,
          }}
        />
        <div className="relative mx-auto grid max-w-[1400px] items-center gap-8 px-6 py-12 md:grid-cols-2 md:gap-12 md:py-16 lg:px-12">
          {imageSrc ? (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border-2 border-[#8B3A2A]/40 shadow-[0_20px_50px_rgba(0,0,0,.2)] md:aspect-[5/4]">
              <Image src={imageSrc} alt={imageAlt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
          ) : null}
          <div className={imageSrc ? '' : 'md:col-span-2 md:text-center'}>
            {badge ? (
              <span className="inline-block rounded-full border border-[#8B3A2A]/55 bg-[#8B3A2A]/25 px-3 py-1 font-ui text-xs font-bold uppercase tracking-[0.2em] text-[#FAF3E0]">
                {badge}
              </span>
            ) : null}
            <h2 className="font-title mt-4 text-3xl leading-[1.05] tracking-tight md:text-4xl lg:text-[2.75rem]">
              {title}
            </h2>
            {description ? (
              <p className="mt-4 max-w-xl font-ui text-base leading-relaxed text-[#FAF3E0]/88 md:text-lg">
                {description}
              </p>
            ) : null}
            {endDate ? (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-6">
                <CountdownRow end={endDate} accentBorder={accentBorder} onEnd={onCountdownEnd} />
              </div>
            ) : null}
            {ctaLabel && href ? (
              <Link
                href={href}
                className="mt-8 inline-flex rounded-full border-2 border-[#FAF3E0] bg-[#8B3A2A]/35 px-8 py-3 font-ui text-sm font-semibold text-[#FAF3E0] shadow-[0_12px_30px_rgba(0,0,0,.15)] transition hover:bg-[#8B3A2A]/55"
              >
                {ctaLabel}
              </Link>
            ) : null}
            {children}
            {!hideClose ? (
              <div className={`mt-6 flex ${imageSrc ? '' : 'md:justify-center'}`}>
                <CloseButton onClick={close} label="Masquer cette bannière" />
              </div>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  /* ——— Popup ——— */
  if (!popupVisible) return null;

  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-[#2C1A0E]/55 backdrop-blur-[2px]"
        aria-label="Fermer"
        onClick={close}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="banner-promo-popup-title"
        className={`relative z-[1] w-full max-w-md overflow-hidden rounded-3xl border-2 border-[#8B3A2A]/45 shadow-[0_28px_80px_rgba(0,0,0,.35)] ${shell} ${className}`}
      >
        <div className="absolute right-3 top-3">
          <CloseButton onClick={close} />
        </div>
        <div className="px-6 pb-8 pt-10 sm:px-10 sm:pb-10 sm:pt-12">
          {badge ? (
            <span className="inline-block rounded-full border border-[#8B3A2A]/55 bg-[#8B3A2A]/25 px-3 py-1 font-ui text-[10px] font-bold uppercase tracking-widest text-[#FAF3E0]">
              {badge}
            </span>
          ) : null}
          <h2 id="banner-promo-popup-title" className="font-title mt-3 text-2xl leading-tight tracking-tight sm:text-3xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-3 font-ui text-sm leading-relaxed text-[#FAF3E0]/88 sm:text-base">{description}</p>
          ) : null}
          {endDate ? (
            <div className="mt-6 flex justify-center">
              <CountdownRow end={endDate} accentBorder={accentBorder} onEnd={onCountdownEnd} />
            </div>
          ) : null}
          {children}
          {ctaLabel && href ? (
            <Link
              href={href}
              onClick={close}
              className="mt-8 flex w-full items-center justify-center rounded-full border-2 border-[#FAF3E0] bg-[#8B3A2A]/40 py-3.5 font-ui text-sm font-semibold text-[#FAF3E0] transition hover:bg-[#8B3A2A]/55"
            >
              {ctaLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
