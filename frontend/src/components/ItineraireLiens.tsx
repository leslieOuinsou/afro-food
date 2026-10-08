'use client';

/** Boutons d'itinéraire vers l'adresse du client : Google Maps, Waze et Plans (iPhone). */
export default function ItineraireLiens({ adresse }: { adresse: string }) {
  const q = encodeURIComponent(adresse);
  const lien = 'rounded-full border border-[var(--wood)]/20 bg-white px-3 py-1.5 text-xs font-semibold text-[var(--wood)] hover:bg-[var(--ivory)]';
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2" aria-label="Itinéraire vers le client">
      <span className="text-xs text-[var(--wood)]/60">Itinéraire :</span>
      <a className={lien} href={`https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=driving`} target="_blank" rel="noopener noreferrer">
        Google Maps
      </a>
      <a className={lien} href={`https://waze.com/ul?q=${q}&navigate=yes`} target="_blank" rel="noopener noreferrer">
        Waze
      </a>
      <a className={lien} href={`https://maps.apple.com/?daddr=${q}&dirflg=d`} target="_blank" rel="noopener noreferrer">
        Plans
      </a>
    </div>
  );
}
