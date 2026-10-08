'use client';

import { useState } from 'react';

/** Partage d'un plat : menu natif du téléphone si disponible, sinon WhatsApp, Facebook et copie du lien. */
export default function PartagerPlat({ titre, url }: { titre: string; url: string }) {
  const [copie, setCopie] = useState(false);
  const texte = `${titre} — à commander chez Afro-food`;
  const lien = 'rounded-full border border-[var(--wood)]/20 bg-white px-3 py-1.5 text-xs font-semibold text-[var(--wood)] hover:bg-[var(--ivory)]';

  const partagerNatif = async () => {
    try {
      await navigator.share({ title: titre, text: texte, url });
    } catch {
      /* partage annulé */
    }
  };
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      window.prompt('Copiez ce lien :', url);
    }
  };

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Partager ce plat">
      <span className="text-xs text-[var(--wood)]/60">Partager :</span>
      {typeof navigator !== 'undefined' && 'share' in navigator && (
        <button type="button" className={lien} onClick={() => void partagerNatif()}>
          Partager…
        </button>
      )}
      <a className={lien} href={`https://wa.me/?text=${encodeURIComponent(`${texte} ${url}`)}`} target="_blank" rel="noopener noreferrer">
        WhatsApp
      </a>
      <a className={lien} href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer">
        Facebook
      </a>
      <button type="button" className={lien} onClick={() => void copier()}>
        {copie ? 'Lien copié ✓' : 'Copier le lien'}
      </button>
    </div>
  );
}
