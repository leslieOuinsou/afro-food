"use client";

import type { ChangeEvent } from "react";

export type MenuCategoryId =
  | "tous"
  | "ouest"
  | "centrale"
  | "est"
  | "street"
  | "vegetarien";

export type MenuSortId = "default" | "price" | "rating" | "time";

const CATEGORIES: { id: MenuCategoryId; label: string }[] = [
  { id: "tous", label: "Tous les plats" },
  { id: "ouest", label: "Afrique de l'Ouest" },
  { id: "centrale", label: "Afrique Centrale" },
  { id: "est", label: "Afrique de l'Est" },
  { id: "street", label: "Street food" },
  { id: "vegetarien", label: "Végétarien" },
];

const SORT_OPTIONS: { id: MenuSortId; label: string }[] = [
  { id: "default", label: "Par défaut" },
  { id: "price", label: "Prix croissant" },
  { id: "rating", label: "Mieux notés" },
  { id: "time", label: "Plus rapide" },
];

type FilterBarProps = {
  activeCategory: MenuCategoryId;
  onCategoryChange: (id: MenuCategoryId) => void;
  sortBy: MenuSortId;
  onSortChange: (id: MenuSortId) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  resultCount: number;
};

export function FilterBar({
  activeCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  searchQuery,
  onSearchChange,
  resultCount,
}: FilterBarProps) {
  return (
    <div className="border-b border-earth-200/80 bg-af-ivory/95 py-3 shadow-[0_4px_24px_rgba(30,13,2,0.06)] backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((c) => {
            const active = activeCategory === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onCategoryChange(c.id)}
                className={`rounded-full px-4 py-2 font-ui text-xs font-semibold transition-colors ${
                  active
                    ? "bg-af-wood text-af-ivory"
                    : "bg-earth-100 text-af-mud hover:bg-[#edcfa0]"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-col gap-3 sm:max-w-md sm:flex-row sm:items-center">
            <label className="sr-only" htmlFor="menu-sort">
              Trier les plats
            </label>
            <select
              id="menu-sort"
              value={sortBy}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                onSortChange(e.target.value as MenuSortId)
              }
              className="font-ui w-full rounded-xl border border-earth-200 bg-white px-3 py-2.5 text-xs font-medium text-af-wood outline-none ring-af-ocre/0 transition focus:border-af-ocre/50 focus:ring-2 focus:ring-af-ocre/20 sm:w-56"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>

            <div className="relative w-full flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-af-mud/70">
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M11 19a8 8 0 100-16 8 8 0 000 16zm10 2l-4.35-4.35"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Rechercher un plat, une origine…"
                className="font-ui w-full rounded-full border border-[#edcfa0] bg-white py-2.5 pl-10 pr-4 text-sm text-af-wood placeholder:text-af-mud/50 outline-none ring-af-ocre/0 transition focus:border-af-ocre/45 focus:ring-2 focus:ring-af-ocre/15"
              />
            </div>
          </div>

          <p className="font-ui shrink-0 text-[11px] font-medium text-af-mud">
            {resultCount} plat{resultCount > 1 ? "s" : ""} disponible{resultCount > 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
