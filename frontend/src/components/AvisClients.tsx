'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

type AvisPublic = { note: number; commentaire: string; date: string; auteur: string };
type Payload = { moyenne: number | null; total: number; avis: AvisPublic[] };

const dateCourte = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

function Etoiles({ note, taille = 'text-lg' }: { note: number; taille?: string }) {
  return (
    <span className={`${taille} leading-none`} role="img" aria-label={`${note} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= note ? 'text-[#E9A23B]' : 'text-[var(--wood)]/20'}>
          ★
        </span>
      ))}
    </span>
  );
}

/** Note moyenne et derniers commentaires clients (section publique du catalogue). */
export default function AvisClients() {
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    let annule = false;
    void apiGet<Payload>('/api/avis-publics?limite=6').then((res) => {
      if (!annule && res.success && res.data) setData(res.data);
    });
    return () => {
      annule = true;
    };
  }, []);

  // Rien à montrer tant qu'aucun client n'a noté
  if (!data || data.total === 0 || data.moyenne == null) return null;

  return (
    <section aria-labelledby="avis-titre" className="mx-auto w-full max-w-6xl px-4 py-14">
      <div className="text-center">
        <p className="font-ui text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ochre)]">Ils nous font confiance</p>
        <h2 id="avis-titre" className="font-title mt-2 text-3xl text-[var(--wood)] sm:text-4xl">
          L&apos;avis de nos clients
        </h2>
        <div className="mt-4 flex flex-col items-center gap-1">
          <p className="font-title text-5xl text-[var(--wood)]">
            {String(data.moyenne).replace('.', ',')}
            <span className="text-2xl text-[var(--wood)]/40"> / 5</span>
          </p>
          <Etoiles note={Math.round(data.moyenne)} taille="text-2xl" />
          <p className="text-sm text-[var(--wood)]/60">
            Sur {data.total} avis client{data.total > 1 ? 's' : ''} après livraison
          </p>
        </div>
      </div>

      {data.avis.length > 0 && (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.avis.map((a, i) => (
            <li
              key={`${a.date}-${i}`}
              className="flex flex-col rounded-[24px] border border-[var(--wood)]/10 bg-white/70 p-6 shadow-sm"
            >
              <Etoiles note={a.note} />
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-[var(--wood)]/85">
                « {a.commentaire} »
              </blockquote>
              <p className="mt-4 text-sm font-semibold text-[var(--wood)]">{a.auteur}</p>
              <p className="text-xs text-[var(--wood)]/55">{dateCourte(a.date)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
