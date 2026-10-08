'use client';

import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

type Props = { onResult: (texte: string) => void; onClose: () => void };

/** Scanner de QR code : caméra en direct, ou import d'une image (capture d'écran du justificatif). */
export default function QrScanner({ onResult, onClose }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [message, setMessage] = useState('Démarrage de la caméra…');

  useEffect(() => {
    let flux: MediaStream | null = null;
    let raf = 0;
    let fini = false;

    const boucle = () => {
      const v = video.current;
      const c = canvas.current;
      if (fini || !v || !c) return;
      if (v.readyState === v.HAVE_ENOUGH_DATA) {
        c.width = v.videoWidth;
        c.height = v.videoHeight;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(v, 0, 0, c.width, c.height);
          const img = ctx.getImageData(0, 0, c.width, c.height);
          const r = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
          if (r?.data) {
            fini = true;
            onResult(r.data);
            return;
          }
        }
      }
      raf = requestAnimationFrame(boucle);
    };

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment' } })
      .then((s) => {
        if (fini) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        flux = s;
        if (video.current) {
          video.current.srcObject = s;
          void video.current.play();
        }
        setMessage('Placez le QR code du justificatif devant la caméra.');
        raf = requestAnimationFrame(boucle);
      })
      .catch(() => setMessage('Caméra indisponible ou refusée. Importez plutôt une image du QR code.'));

    return () => {
      fini = true;
      cancelAnimationFrame(raf);
      flux?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const depuisImage = (fichier?: File) => {
    if (!fichier) return;
    const url = URL.createObjectURL(fichier);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      const data = ctx?.getImageData(0, 0, c.width, c.height);
      const r = data ? jsQR(data.data, data.width, data.height) : null;
      URL.revokeObjectURL(url);
      if (r?.data) onResult(r.data);
      else setMessage('Aucun QR code lisible sur cette image. Réessayez avec une image plus nette.');
    };
    img.onerror = () => setMessage('Image illisible.');
    img.src = url;
  };

  return (
    <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <video ref={video} className="aspect-video w-full rounded-md bg-black object-cover" muted playsInline />
      <canvas ref={canvas} className="hidden" />
      <p className="mt-2 text-xs text-gray-700">{message}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <label className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold">
          Importer une image du QR code
          <input type="file" accept="image/*" className="hidden" onChange={(e) => depuisImage(e.target.files?.[0])} />
        </label>
        <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold">
          Fermer le scanner
        </button>
      </div>
    </div>
  );
}
