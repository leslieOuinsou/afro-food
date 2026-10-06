'use client';

import { useEffect, useRef } from 'react';
import type { Map as LeafletMap, Marker, Polyline, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { trackLiveTrackingRecenter, trackLiveTrackingView } from '@/lib/analytics';

type Position = { lat: number; lng: number; date: string };

type Props = {
  /** Dernière position connue du livreur (mise à jour toutes les quelques secondes). */
  position: Position | null;
  /** Adresse de livraison, géocodée une fois pour afficher la destination. */
  adresse?: string | null;
};

const ICONE_LIVREUR = `<div style="font-size:30px;line-height:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35));transform:translate(-50%,-50%)">🛵</div>`;
const ICONE_DESTINATION = `<div style="font-size:30px;line-height:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35));transform:translate(-50%,-100%)">🏠</div>`;

/** Déplace un marqueur en douceur d'une position à l'autre (≈1 s). */
function animerMarqueur(marqueur: Marker, vers: [number, number], duree = 1000) {
  const depart = marqueur.getLatLng();
  const t0 = performance.now();
  const pas = (t: number) => {
    const k = Math.min(1, (t - t0) / duree);
    const ease = k * (2 - k);
    marqueur.setLatLng([depart.lat + (vers[0] - depart.lat) * ease, depart.lng + (vers[1] - depart.lng) * ease]);
    if (k < 1) requestAnimationFrame(pas);
  };
  requestAnimationFrame(pas);
}

/**
 * Carte de suivi : le scooter se déplace en direct, laisse une trace et la carte le suit.
 * La carte est créée une seule fois (pas de rechargement à chaque position).
 */
export default function SuiviLivreurMap({ position, adresse }: Props) {
  const conteneur = useRef<HTMLDivElement>(null);
  const carte = useRef<LeafletMap | null>(null);
  const livreur = useRef<Marker | null>(null);
  const destination = useRef<Marker | null>(null);
  const trace = useRef<Polyline | null>(null);
  const points = useRef<[number, number][]>([]);
  const leaflet = useRef<typeof import('leaflet') | null>(null);
  const suivi = useRef(true); // la carte suit le livreur tant que le client ne la déplace pas
  const derniere = useRef<string | null>(null);
  const positionRef = useRef<Position | null>(position);
  positionRef.current = position;

  // Création de la carte (une fois)
  useEffect(() => {
    let annule = false;
    (async () => {
      const L = await import('leaflet');
      if (annule || !conteneur.current || carte.current) return;
      leaflet.current = L;
      const depart: LatLngExpression = positionRef.current
        ? [positionRef.current.lat, positionRef.current.lng]
        : [48.8566, 2.3522];
      const m = L.map(conteneur.current, { zoomControl: true, attributionControl: true }).setView(depart, 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(m);
      trace.current = L.polyline([], { color: '#C2610F', weight: 5, opacity: 0.75 }).addTo(m);
      // Le client reprend la main en déplaçant la carte ; le bouton « Recentrer » reprend le suivi
      m.on('dragstart', () => {
        suivi.current = false;
      });
      carte.current = m;
      setTimeout(() => m.invalidateSize(), 0);
      // Applique la position déjà reçue
      majPosition();
    })();
    return () => {
      annule = true;
      carte.current?.remove();
      carte.current = null;
      livreur.current = null;
      destination.current = null;
      trace.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function majPosition() {
    const L = leaflet.current;
    const m = carte.current;
    const p = positionRef.current;
    if (!L || !m || !p) return;
    const cible: [number, number] = [p.lat, p.lng];
    if (!livreur.current) {
      livreur.current = L.marker(cible, {
        icon: L.divIcon({ html: ICONE_LIVREUR, className: '', iconSize: [0, 0] }),
        zIndexOffset: 1000,
      }).addTo(m);
    } else {
      animerMarqueur(livreur.current, cible);
    }
    const dernierPoint = points.current[points.current.length - 1];
    if (!dernierPoint || dernierPoint[0] !== cible[0] || dernierPoint[1] !== cible[1]) {
      points.current.push(cible);
      trace.current?.setLatLngs(points.current);
    }
    if (suivi.current) {
      if (destination.current) {
        const d = destination.current.getLatLng();
        m.fitBounds([cible, [d.lat, d.lng]], { padding: [50, 50], maxZoom: 17, animate: true });
      } else m.panTo(cible, { animate: true, duration: 1 });
    }
  }

  // Nouvelle position
  useEffect(() => {
    if (!position || position.date === derniere.current) return;
    if (derniere.current === null) trackLiveTrackingView(); // 1re position affichée au client
    derniere.current = position.date;
    majPosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  // Destination (adresse du client), géocodée une seule fois
  useEffect(() => {
    if (!adresse) return;
    let annule = false;
    (async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(adresse)}`,
          { headers: { Accept: 'application/json' } }
        );
        const data = (await res.json()) as Array<{ lat: string; lon: string }>;
        if (annule || !data[0]) return;
        // Attend que la carte existe
        for (let i = 0; i < 20 && !carte.current; i += 1) await new Promise((r) => setTimeout(r, 150));
        const L = leaflet.current;
        const m = carte.current;
        if (annule || !L || !m) return;
        destination.current = L.marker([Number(data[0].lat), Number(data[0].lon)], {
          icon: L.divIcon({ html: ICONE_DESTINATION, className: '', iconSize: [0, 0] }),
        })
          .addTo(m)
          .bindTooltip('Votre adresse');
        majPosition();
      } catch {
        /* sans destination, la carte suit simplement le livreur */
      }
    })();
    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adresse]);

  return (
    <div className="relative">
      <div ref={conteneur} className="h-80 w-full overflow-hidden rounded-2xl border border-[var(--wood)]/10" />
      <button
        type="button"
        onClick={() => {
          suivi.current = true;
          trackLiveTrackingRecenter();
          majPosition();
        }}
        className="absolute bottom-3 left-3 z-[500] rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--wood)] shadow ring-1 ring-black/10 hover:bg-[var(--ivory)]"
      >
        Recentrer sur le livreur
      </button>
    </div>
  );
}
