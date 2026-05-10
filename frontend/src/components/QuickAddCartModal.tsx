'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export type QuickAddProduct = {
  id: string;
  name: string;
  image: string;
  origin: string;
  description: string;
  price: number;
  href: string;
};

export type QuickAddCartModalProps = {
  open: boolean;
  onClose: () => void;
  product: QuickAddProduct | null;
};

const ANIM_MS = 320;

function formatPriceEUR(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

export default function QuickAddCartModal({ open, onClose, product }: QuickAddCartModalProps) {
  const { addItem } = useCart();
  const [render, setRender] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [snapshot, setSnapshot] = useState<QuickAddProduct | null>(null);
  const [qty, setQty] = useState(1);
  const panelRef = useRef<HTMLDivElement>(null);

  const display = snapshot;

  useEffect(() => {
    if (open && product) {
      setSnapshot(product);
      setQty(1);
      setRender(true);
      const id = requestAnimationFrame(() => setAnimate(true));
      return () => cancelAnimationFrame(id);
    }
    if (!open) {
      setAnimate(false);
      const t = window.setTimeout(() => {
        setRender(false);
        setSnapshot(null);
      }, ANIM_MS);
      return () => window.clearTimeout(t);
    }
  }, [open, product]);

  useEffect(() => {
    if (!render) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [render]);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!render) return;
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [render, handleEscape]);

  const handleAdd = () => {
    if (!display) return;
    addItem({
      id: display.id,
      nom: display.name,
      prixUnitaire: display.price,
      image: display.image,
      quantite: qty,
    });
    onClose();
  };

  if (!render || !display) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center md:items-center md:p-6" role="dialog" aria-modal="true" aria-labelledby="quick-add-title">
      {/* Overlay */}
      <button
        type="button"
        className={`absolute inset-0 bg-[#140c07]/65 backdrop-blur-[2px] transition-opacity duration-[320ms] ease-out ${
          animate ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Fermer"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`relative z-[1] flex max-h-[min(92vh,720px)] w-full max-w-[640px] flex-col overflow-hidden rounded-t-[28px] border border-[var(--wood)]/12 bg-[var(--ivory)] shadow-[0_-12px_48px_rgba(0,0,0,.2)] transition-all duration-[320ms] ease-out md:max-h-[90vh] md:rounded-[28px] md:shadow-[0_24px_64px_rgba(0,0,0,.28)] ${
          animate
            ? 'translate-y-0 opacity-100 md:scale-100'
            : 'translate-y-full opacity-100 md:translate-y-0 md:scale-95 md:opacity-0'
        } `}
      >
        <div className="flex max-h-[inherit] flex-col md:flex-row md:overflow-hidden">
          {/* Image gauche */}
          <div className="relative aspect-[5/4] w-full shrink-0 overflow-hidden bg-[var(--paper)] md:aspect-auto md:w-[42%] md:min-h-[280px]">
            <img src={display.image} alt="" className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#2C1A0E]/40 to-transparent md:bg-gradient-to-r" />
          </div>

          {/* Contenu droite */}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6 md:p-8">
            <h2 id="quick-add-title" className="font-title text-2xl leading-tight text-[var(--wood)] md:text-[1.75rem]">
              {display.name}
            </h2>
            <p className="mt-2 font-ui text-xs font-semibold uppercase tracking-wide text-[var(--brick)]">{display.origin}</p>
            <p className="mt-4 font-ui text-sm leading-relaxed text-[var(--wood)]/80">{display.description}</p>

            <div className="mt-6 flex items-center justify-between gap-4 border-t border-[var(--wood)]/10 pt-6">
              <span className="font-ui text-2xl font-semibold tabular-nums text-[var(--ochre)]">{formatPriceEUR(display.price)}</span>
              <div className="inline-flex items-center rounded-full border border-[var(--wood)]/12 bg-white/60 p-1">
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--wood)] hover:bg-white"
                  aria-label="Diminuer"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <input
                  className="w-10 bg-transparent text-center font-ui text-sm font-semibold text-[var(--wood)] outline-none"
                  value={qty}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!Number.isNaN(v)) setQty(Math.min(99, Math.max(1, v)));
                  }}
                  inputMode="numeric"
                  aria-label="Quantité"
                />
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--wood)] hover:bg-white"
                  aria-label="Augmenter"
                  onClick={() => setQty((q) => Math.min(99, q + 1))}
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleAdd}
                className="w-full rounded-full bg-[var(--ochre)] py-3.5 font-ui text-sm font-semibold text-white shadow-[0_10px_28px_rgba(194,97,15,.28)] transition hover:bg-[#a6500c] sm:flex-1"
              >
                Ajouter au panier
              </button>
              <Link
                href={display.href}
                onClick={onClose}
                className="w-full text-center font-ui text-sm font-semibold text-[var(--wood)] underline decoration-[var(--wood)]/30 underline-offset-4 transition hover:text-[var(--ochre)] hover:decoration-[var(--ochre)]/50 sm:w-auto sm:shrink-0 sm:px-4"
              >
                Voir la fiche complète
              </Link>
            </div>
          </div>
        </div>

        {/* Close mobile */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--wood)]/15 bg-[var(--ivory)]/90 text-[var(--wood)] shadow-sm backdrop-blur md:right-3 md:top-3"
          aria-label="Fermer"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
