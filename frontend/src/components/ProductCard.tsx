'use client';

import { useCallback, useEffect, useState } from 'react';
import { trackAddToWishlist } from '@/lib/analytics';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { FAVORITES_STORAGE_KEY, dispatchFavoritesUpdated } from '@/lib/favoritesStorage';

export type ProductCardVariant = 'default' | 'compact' | 'featured';

export type ProductCardProps = {
  id: string;
  name: string;
  image: string;
  /** Affiché dans le badge sur l’image (ex. pays d’origine) */
  originLabel: string;
  vendorName: string;
  vendorHref: string;
  /** Note sur 5 */
  rating: number;
  /** Prix unitaire en euros */
  price: number;
  /** null = illimité ; 0 = rupture */
  quantiteMax?: number | null;
  variant?: ProductCardVariant;
  className?: string;
};

function formatPriceEUR(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

function Stars({ value }: { value: number }) {
  const full = Math.floor(Math.min(5, Math.max(0, value)));
  const half = value - full >= 0.5 && full < 5;
  return (
    <span className="inline-flex items-center gap-0.5 text-[var(--ochre)]" aria-label={`${value.toFixed(1)} sur 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="text-[13px] leading-none">
          {i < full ? '★' : i === full && half ? '⯪' : '☆'}
        </span>
      ))}
    </span>
  );
}

type FavItem = { id: string; nom: string; image: string };

function readFavorites(): FavItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    return Array.isArray(p) ? (p as FavItem[]) : [];
  } catch {
    return [];
  }
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );
}

export default function ProductCard({
  id,
  name,
  image,
  originLabel,
  vendorName,
  vendorHref,
  rating,
  price,
  quantiteMax = null,
  variant = 'default',
  className = '',
}: ProductCardProps) {
  const { addItem } = useCart();
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFavorite(readFavorites().some((f) => f.id === id));
  }, [id]);

  const toggleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const list = readFavorites();
      const exists = list.some((f) => f.id === id);
      let next: FavItem[];
      if (exists) {
        next = list.filter((f) => f.id !== id);
        setFavorite(false);
      } else {
        next = [...list, { id, nom: name, image }];
        setFavorite(true);
        trackAddToWishlist({ item_id: id, item_name: name, price: 0, quantity: 1 });
      }
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
        dispatchFavoritesUpdated();
      } catch {
        /* ignore */
      }
    },
    [id, image, name]
  );

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantiteMax === 0) return;
    addItem({ id, nom: name, prixUnitaire: price, image, quantiteMax });
  };

  const isCompact = variant === 'compact';
  const isFeatured = variant === 'featured';

  const imageWrapClass = isFeatured
    ? 'relative aspect-[4/3] w-full shrink-0 overflow-hidden md:aspect-auto md:h-auto md:min-h-[260px] md:w-[48%] lg:min-h-[300px]'
    : isCompact
      ? 'relative aspect-[3/2] max-h-[168px] w-full overflow-hidden'
      : 'relative aspect-[4/3] w-full overflow-hidden';

  const cardClass = [
    'group relative flex flex-col overflow-hidden rounded-[24px] border border-[var(--wood)]/10 bg-[var(--ivory)] shadow-sm transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(44,26,14,.12)]',
    isFeatured ? 'md:flex-row md:rounded-[28px]' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const bodyClass = isFeatured
    ? 'flex flex-1 flex-col justify-center p-6 md:p-8 lg:p-10'
    : isCompact
      ? 'flex flex-1 flex-col p-4'
      : 'flex flex-1 flex-col p-5';

  return (
    <article className={cardClass}>
      <div className={imageWrapClass}>
        <img
          src={image}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2C1A0E]/55 via-transparent to-transparent opacity-80 transition-opacity group-hover:opacity-95" />

        <div className="absolute bottom-3 left-3 max-w-[calc(100%-5rem)]">
          <span className="inline-flex items-center rounded-full border border-white/25 bg-white/90 px-2.5 py-1 font-ui text-[10px] font-semibold uppercase tracking-wide text-[var(--wood)] shadow-sm backdrop-blur">
            {originLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={toggleFavorite}
          className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur transition ${
            favorite
              ? 'border-[var(--brick)]/40 bg-[var(--brick)]/90 text-[var(--ivory)]'
              : 'border-white/30 bg-white/85 text-[var(--wood)] hover:bg-white'
          }`}
          aria-label={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <HeartIcon filled={favorite} />
        </button>
      </div>

      <div className={bodyClass}>
        <h3
          className={`font-title text-[var(--wood)] leading-tight ${
            isFeatured ? 'text-2xl sm:text-3xl' : isCompact ? 'text-lg' : 'text-xl'
          }`}
        >
          {name}
        </h3>

        <p className="mt-2 font-ui text-xs text-[var(--wood)]/65">
          <Link
            href={vendorHref}
            className="font-medium text-[var(--brick)] underline decoration-[var(--brick)]/30 underline-offset-2 transition hover:text-[var(--ochre)] hover:decoration-[var(--ochre)]"
            onClick={(e) => e.stopPropagation()}
          >
            {vendorName}
          </Link>
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Stars value={rating} />
          <span className="font-ui text-xs tabular-nums text-[var(--wood)]/55">{rating.toFixed(1)}</span>
        </div>

        <div
          className={`mt-auto flex flex-wrap items-end justify-between gap-3 pt-4 ${isFeatured ? 'pt-6' : 'pt-3'}`}
        >
          <span
            className={`font-ui font-semibold tabular-nums text-[var(--ochre)] ${
              isFeatured ? 'text-3xl' : isCompact ? 'text-xl' : 'text-2xl'
            }`}
          >
            {formatPriceEUR(price)}
          </span>
          <button
            type="button"
            onClick={handleAdd}
            disabled={quantiteMax === 0}
            className="rounded-full bg-[var(--wood)] px-5 py-2.5 font-ui text-sm font-semibold text-[var(--ivory)] transition hover:bg-[var(--wood)]/95 disabled:cursor-not-allowed disabled:bg-[var(--wood)]/35 disabled:text-[var(--ivory)]/70"
          >
            {quantiteMax === 0 ? 'Indisponible' : 'Ajouter au panier'}
          </button>
        </div>
      </div>
    </article>
  );
}
