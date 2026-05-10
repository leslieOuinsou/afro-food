"use client";

import Link from "next/link";
import type { Dish } from "@/lib/data";

export type DishCardVariant = "default" | "compact" | "featured";

type DishCardProps = {
  dish: Dish;
  variant?: DishCardVariant;
  className?: string;
};

function KenteOverlay({ className }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 opacity-[0.10] ${className ?? ""}`}
      aria-hidden
      style={{
        backgroundImage: `repeating-linear-gradient(
          90deg,
          #d4651a 0px,
          #d4651a 6px,
          #ef9f27 6px,
          #ef9f27 12px,
          #1a6040 12px,
          #1a6040 18px,
          #7a1e2e 18px,
          #7a1e2e 24px,
          #fef9f2 24px,
          #fef9f2 30px
        )`,
        backgroundSize: "120px 100%",
        mixBlendMode: "multiply",
      }}
    />
  );
}

function SpiceMeter({ level }: { level: number }) {
  const n = Math.max(0, Math.min(4, Math.round(level)));
  return (
    <div className="flex gap-1" aria-label={`Niveau d’épices ${n} sur 4`}>
      {Array.from({ length: 4 }).map((_, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full border ${
            i < n ? "border-af-ocre bg-af-ocre" : "border-af-mud/40 bg-transparent"
          }`}
        />
      ))}
    </div>
  );
}

function formatPriceEUR(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function DishCard({ dish, variant = "default", className = "" }: DishCardProps) {
  const imgH = variant === "compact" ? "h-[120px]" : "h-[160px]";
  const titleSize =
    variant === "compact"
      ? "text-[17px]"
      : variant === "featured"
        ? "text-[22px]"
        : "text-[20px]";
  const descSize = variant === "compact" ? "text-[9px]" : "text-[10px]";
  const ring =
    variant === "featured"
      ? "ring-2 ring-af-ocre/90 shadow-[0_12px_36px_rgba(212,101,26,0.18)]"
      : "border border-earth-100";

  return (
    <Link
      href={`/produit/${dish.id}`}
      className={`group block overflow-hidden rounded-2xl bg-white ${ring} transition duration-300 ease-out hover:-translate-y-[6px] hover:shadow-[0_16px_40px_rgba(58,26,6,0.14)] ${className}`}
    >
      <div className={`relative ${imgH} w-full overflow-hidden`} style={{ backgroundColor: dish.bgColor }}>
        <KenteOverlay />
        {/* Remplacement futur : <Image src={...} alt="" fill className="object-cover" /> */}
        <span className="absolute left-3 top-3 rounded px-2 py-1 font-ui text-[8px] font-semibold uppercase tracking-wider text-af-ivory" style={{ backgroundColor: "rgba(30,13,2,0.75)" }}>
          {dish.badge}
        </span>
        <div className="absolute bottom-3 right-3 rounded-full bg-af-wood/25 p-1.5 backdrop-blur-sm">
          <SpiceMeter level={dish.spicy} />
        </div>
      </div>

      <div className="px-4 pb-4 pt-3">
        <p className="mb-0.5 font-ui text-[8px] font-semibold uppercase tracking-[0.2em] text-af-ocre">
          {dish.origin}
        </p>
        <h3
          className={`font-title font-bold leading-[1.1] text-af-wood ${titleSize}`}
        >
          {dish.name}
        </h3>
        <p
          className={`font-body mt-1.5 line-clamp-2 leading-snug text-af-earth ${descSize}`}
        >
          {dish.description}
        </p>

        <div className="mt-4 flex items-end justify-between border-t border-earth-100 pt-3">
          <div className="flex items-center gap-1.5 text-af-sand">
            <svg width={10} height={10} viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
              <circle cx={12} cy={12} r={9} stroke="currentColor" strokeWidth={1.5} />
              <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
            </svg>
            <span className="font-body text-[10px]">{dish.time}</span>
          </div>
          <p className={`font-title font-bold text-af-wood ${variant === "compact" ? "text-[17px]" : "text-[20px]"}`}>
            {formatPriceEUR(dish.price)}
          </p>
        </div>
      </div>
    </Link>
  );
}
