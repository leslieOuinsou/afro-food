'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { getSignature, resetSignature, saveSignature, type SignatureActive } from '@/services/signature';

const LARGEUR = 600;
const HAUTEUR = 200;
const ENCRE = '#1B2A5C';

export default function AdminSignaturePage() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const dessin = useRef({ actif: false, x: 0, y: 0 });
  const [vide, setVide] = useState(true);
  const [nom, setNom] = useState('');
  const [fonction, setFonction] = useState('');
  const [active, setActive] = useState<SignatureActive>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'erreur'; texte: string } | null>(null);
  const [occupe, setOccupe] = useState(false);

  const effacer = useCallback(() => {
    const c = canvas.current;
    c?.getContext('2d')?.clearRect(0, 0, LARGEUR, HAUTEUR);
    setVide(true);
  }, []);

  const charger = useCallback(async () => {
    const res = await getSignature();
    if (res.success) {
      setActive(res.data ?? null);
      if (res.data) {
        setNom(res.data.nom);
        setFonction(res.data.fonction);
      }
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void charger();
  }, [charger]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * LARGEUR, y: ((e.clientY - r.top) / r.height) * HAUTEUR };
  };

  const debut = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = point(e);
    dessin.current = { actif: true, x: p.x, y: p.y };
    const ctx = e.currentTarget.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = ENCRE;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
    ctx.fill();
    setVide(false);
  };

  const trace = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dessin.current.actif) return;
    const ctx = e.currentTarget.getContext('2d');
    if (!ctx) return;
    const p = point(e);
    ctx.strokeStyle = ENCRE;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(dessin.current.x, dessin.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    dessin.current.x = p.x;
    dessin.current.y = p.y;
  };

  const fin = () => {
    dessin.current.actif = false;
  };

  /** Importe une image (photo de signature sur papier blanc) : fond blanc rendu transparent, encre recolorée. */
  const importer = (fichier?: File) => {
    if (!fichier) return;
    const url = URL.createObjectURL(fichier);
    const img = new Image();
    img.onload = () => {
      const c = canvas.current;
      const ctx = c?.getContext('2d', { willReadFrequently: true });
      if (!c || !ctx) return;
      ctx.clearRect(0, 0, LARGEUR, HAUTEUR);
      const ratio = Math.min(LARGEUR / img.naturalWidth, HAUTEUR / img.naturalHeight);
      const w = img.naturalWidth * ratio;
      const h = img.naturalHeight * ratio;
      ctx.drawImage(img, (LARGEUR - w) / 2, (HAUTEUR - h) / 2, w, h);
      const data = ctx.getImageData(0, 0, LARGEUR, HAUTEUR);
      for (let i = 0; i < data.data.length; i += 4) {
        const [r, g, b, a] = [data.data[i], data.data[i + 1], data.data[i + 2], data.data[i + 3]];
        const clair = (r + g + b) / 3;
        // plus le pixel est clair, plus il devient transparent
        const alpha = a === 0 ? 0 : Math.max(0, Math.min(255, Math.round((235 - clair) * 3.2)));
        data.data[i] = 27;
        data.data[i + 1] = 42;
        data.data[i + 2] = 92;
        data.data[i + 3] = Math.min(alpha, a);
      }
      ctx.putImageData(data, 0, 0);
      URL.revokeObjectURL(url);
      setVide(false);
    };
    img.onerror = () => setMessage({ type: 'erreur', texte: 'Image illisible.' });
    img.src = url;
  };

  const enregistrer = async () => {
    const c = canvas.current;
    if (!c || vide) return;
    setOccupe(true);
    setMessage(null);
    const res = await saveSignature(c.toDataURL('image/png'), nom.trim(), fonction.trim());
    setOccupe(false);
    if (!res.success) {
      setMessage({ type: 'erreur', texte: res.message || 'Enregistrement impossible.' });
      return;
    }
    setMessage({ type: 'ok', texte: 'Signature enregistrée. Elle apparaîtra sur les prochains justificatifs.' });
    await charger();
  };

  const retablir = async () => {
    if (!window.confirm('Revenir à la signature par défaut sur les prochains justificatifs ?')) return;
    const res = await resetSignature();
    if (!res.success) setMessage({ type: 'erreur', texte: res.message || 'Action impossible.' });
    else {
      setActive(null);
      setMessage({ type: 'ok', texte: 'Signature par défaut rétablie.' });
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-gray-900">Signature des justificatifs</h1>
        <p className="text-sm text-gray-600">
          Dessinez votre signature (souris, doigt ou stylet) ou importez une photo. Elle sera apposée sur les justificatifs de
          paiement émis à partir de maintenant. Les justificatifs déjà émis ne changent pas.
        </p>
        {message && (
          <p className={`mt-4 rounded-lg p-3 text-sm ${message.type === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>
            {message.texte}
          </p>
        )}

        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-2">
              <canvas
                ref={canvas}
                width={LARGEUR}
                height={HAUTEUR}
                className="w-full touch-none rounded-lg bg-[linear-gradient(transparent_calc(100%-1px),#E8DCC4_0)] bg-[length:100%_66%] cursor-crosshair"
                style={{ aspectRatio: `${LARGEUR}/${HAUTEUR}` }}
                onPointerDown={debut}
                onPointerMove={trace}
                onPointerUp={fin}
                onPointerLeave={fin}
                aria-label="Zone de signature"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={effacer} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold">
                Effacer
              </button>
              <label className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold">
                Importer une image
                <input type="file" accept="image/*" className="hidden" onChange={(e) => importer(e.target.files?.[0])} />
              </label>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-gray-800">
                Nom du signataire
                <input
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex. Leslie Ouinsou"
                  maxLength={60}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal"
                />
              </label>
              <label className="text-sm font-semibold text-gray-800">
                Fonction
                <input
                  value={fonction}
                  onChange={(e) => setFonction(e.target.value)}
                  placeholder="Ex. Gérante"
                  maxLength={60}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal"
                />
              </label>
            </div>

            <button
              onClick={() => void enregistrer()}
              disabled={vide || nom.trim().length < 2 || occupe}
              className="mt-5 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
            >
              {occupe ? 'Enregistrement…' : 'Enregistrer cette signature'}
            </button>
          </div>

          <aside className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Signature en vigueur</p>
            {active ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={active.image} alt="Signature active" className="mt-3 h-24 w-full rounded-lg bg-[#FFFDF8] object-contain p-2" />
                <p className="mt-2 text-sm font-semibold text-gray-900">{active.nom}</p>
                <p className="text-xs text-gray-500">{active.fonction}</p>
                <button onClick={() => void retablir()} className="mt-3 text-xs font-semibold text-red-700 underline">
                  Revenir à la signature par défaut
                </button>
              </>
            ) : (
              <p className="mt-3 text-sm text-gray-600">Signature par défaut (« Service Paiements — Afro-food »).</p>
            )}
          </aside>
        </div>
      </div>
    </AdminLayout>
  );
}
