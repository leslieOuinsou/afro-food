'use client';

import { useLangue } from '@/context/I18nContext';

/** Bascule FR / EN. Le sélecteur lui-même n'est jamais traduit. */
export default function LangueSwitcher({ className = '' }: { className?: string }) {
  const { langue, changerLangue } = useLangue();
  const bouton = (l: 'fr' | 'en', label: string) => (
    <button
      type="button"
      onClick={() => changerLangue(l)}
      aria-pressed={langue === l}
      aria-label={l === 'fr' ? 'Français' : 'English'}
      className={`px-2.5 py-1 text-xs font-semibold transition ${
        langue === l ? 'bg-[var(--ochre)] text-white' : 'bg-white/70 text-[var(--wood)] hover:bg-white'
      }`}
    >
      {label}
    </button>
  );
  return (
    <div translate="no" className={`notranslate inline-flex overflow-hidden rounded-full border border-[var(--wood)]/15 ${className}`}>
      {bouton('fr', 'FR')}
      {bouton('en', 'EN')}
    </div>
  );
}
