'use client';

import { useEffect, useRef, useState } from 'react';
import { trackContact } from '@/lib/analytics';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { envoyerMessageContact } from '@/services/contact';

const TOAST_MS = 4000;

function LeftPatterns() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        className="absolute -left-16 top-10 h-[420px] w-[420px] opacity-[0.12] text-[var(--ochre)]"
        viewBox="0 0 400 400"
        fill="none"
      >
        <defs>
          <pattern id="contactKenteA" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M0 20h40" stroke="currentColor" strokeWidth="2" />
            <path d="M20 0v40" stroke="currentColor" strokeWidth="2" />
            <path d="M0 0l40 40M40 0L0 40" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
          </pattern>
        </defs>
        <rect width="400" height="400" fill="url(#contactKenteA)" />
      </svg>
      <svg
        className="absolute -bottom-24 left-1/4 h-[280px] w-[280px] opacity-[0.09] text-[var(--brick)]"
        viewBox="0 0 300 300"
        fill="none"
      >
        <defs>
          <pattern id="contactKenteB" x="0" y="0" width="56" height="56" patternUnits="userSpaceOnUse">
            <path d="M0 28h56" stroke="currentColor" strokeWidth="3" />
            <path d="M28 0v56" stroke="currentColor" strokeWidth="3" />
            <rect x="0" y="0" width="56" height="56" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          </pattern>
        </defs>
        <rect width="300" height="300" fill="url(#contactKenteB)" />
      </svg>
    </div>
  );
}

export default function ContactPage() {
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [sujet, setSujet] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setToast(null);
      toastTimer.current = null;
    }, TOAST_MS);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!nom.trim() || !email.trim() || !sujet.trim() || !message.trim()) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    const res = await envoyerMessageContact({
      nom: nom.trim(),
      email: email.trim(),
      sujet: sujet.trim(),
      message: message.trim(),
    });
    setLoading(false);
    if (res.success) {
      trackContact();
      showToast('Message envoyé — nous vous répondons très bientôt.');
      setNom('');
      setEmail('');
      setSujet('');
      setMessage('');
    } else {
      setError(res.message || "Erreur lors de l'envoi. Vérifiez que le serveur est démarré.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-af-ivory text-af-wood [color-scheme:light]">
      <Header />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-24 left-1/2 z-[120] flex max-w-md -translate-x-1/2 items-center gap-3 rounded-2xl border border-af-ocre/40 bg-af-wood px-5 py-4 text-sm font-semibold text-af-ivory shadow-[0_16px_40px_rgba(0,0,0,.35)]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-af-ocre text-af-ivory">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <span>{toast}</span>
        </div>
      )}

      <main className="flex-grow">
        <div className="mx-auto grid max-w-[1200px] gap-0 lg:grid-cols-12 lg:min-h-[calc(100vh-4rem)]">
          {/* Colonne gauche — éditorial + infos + motifs */}
          <div className="relative overflow-hidden border-b border-af-wood/10 bg-[#fff7ea] lg:col-span-5 lg:border-b-0 lg:border-r">
            <LeftPatterns />
            <div className="relative z-[1] px-6 py-14 lg:flex lg:min-h-full lg:flex-col lg:justify-between lg:px-10 lg:py-16">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-af-bordeaux">Parlons ensemble</p>
                <h1 className="font-title mt-4 text-4xl leading-[0.98] tracking-tight text-af-wood sm:text-5xl">
                  Une question, une
                  <span className="text-af-ocre"> envie</span>
                  , un projet
                </h1>
                <div className="mt-8 space-y-4 text-base leading-relaxed text-af-earth">
                  <p>
                    Que vous soyez client, curieux ou producteur, nous aimons les échanges sincères. Racontez-nous
                    votre besoin : notre équipe lit chaque message avec attention.
                  </p>
                  <p>
                    Les saveurs africaines méritent le même soin que les histoires qu’elles portent — nous vous
                    répondons sous 48 h ouvrées en général.
                  </p>
                </div>
              </div>

              <div className="mt-12 space-y-8 lg:mt-16">
                <div className="rounded-[24px] border border-af-wood/15 bg-white p-6 shadow-sm">
                  <h2 className="font-title text-xl text-af-wood">Coordonnées</h2>
                  <ul className="mt-5 space-y-4 text-sm text-af-wood">
                    <li className="flex gap-3">
                      <span className="mt-0.5 text-af-ocre" aria-hidden>
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </span>
                      <a href="mailto:ouinsoul5@gmail.com" className="font-medium text-af-wood underline-offset-2 hover:text-af-ocre hover:underline">
                        ouinsoul5@gmail.com
                      </a>
                    </li>
                    <li className="flex gap-3">
                      <span className="mt-0.5 text-af-ocre" aria-hidden>
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </span>
                      <a href="tel:+33766234575" className="font-medium text-af-wood hover:text-af-ocre hover:underline">
                        07 66 23 45 75
                      </a>
                    </li>
                    <li className="flex gap-3 border-t border-af-wood/10 pt-4">
                      <span className="mt-0.5 text-af-bordeaux" aria-hidden>
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </span>
                      <span className="text-af-wood">24 avenue Aristide Briand, 33700 Mérignac</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-[24px] border border-af-wood/15 bg-earth-100/80 p-6">
                  <h2 className="font-title text-xl text-af-wood">Horaires</h2>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-af-mud">Lun. – Ven.</dt>
                      <dd className="font-semibold text-af-wood">9h – 18h</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-af-wood/10 pt-3">
                      <dt className="text-af-mud">Samedi</dt>
                      <dd className="font-semibold text-af-wood">10h – 14h</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-af-wood/10 pt-3">
                      <dt className="text-af-mud">Dimanche</dt>
                      <dd className="font-semibold text-af-bordeaux">Fermé</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne droite — formulaire */}
          <div className="bg-af-ivory px-6 py-14 lg:col-span-7 lg:px-12 lg:py-16">
            <div className="mx-auto max-w-[520px]">
              <h2 className="font-title text-3xl text-af-wood lg:text-4xl">Écrivez-nous</h2>
              <p className="mt-2 text-sm text-af-mud">
                Tous les champs sont obligatoires. Réponse sous 48 h ouvrées en moyenne.
              </p>

              {error && (
                <div
                  role="alert"
                  className="mt-6 rounded-2xl border border-af-bordeaux/35 bg-af-bordeaux/10 px-4 py-3 text-sm text-af-wood"
                >
                  {error}
                </div>
              )}

              <form className="mt-8 space-y-5 font-ui" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="contact-nom" className="text-xs font-semibold uppercase tracking-wide text-af-mud">
                    Nom
                  </label>
                  <input
                    id="contact-nom"
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    autoComplete="name"
                    className="mt-2 w-full rounded-2xl border border-af-wood/20 bg-white px-4 py-3 text-af-wood placeholder:text-af-mud/55 outline-none transition focus:border-af-ocre/50 focus:ring-2 focus:ring-af-ocre/20"
                    placeholder="Votre nom"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="text-xs font-semibold uppercase tracking-wide text-af-mud">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="mt-2 w-full rounded-2xl border border-af-wood/20 bg-white px-4 py-3 text-af-wood placeholder:text-af-mud/55 outline-none transition focus:border-af-ocre/50 focus:ring-2 focus:ring-af-ocre/20"
                    placeholder="vous@email.com"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="contact-sujet" className="text-xs font-semibold uppercase tracking-wide text-af-mud">
                    Sujet
                  </label>
                  <input
                    id="contact-sujet"
                    type="text"
                    value={sujet}
                    onChange={(e) => setSujet(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-af-wood/20 bg-white px-4 py-3 text-af-wood placeholder:text-af-mud/55 outline-none transition focus:border-af-ocre/50 focus:ring-2 focus:ring-af-ocre/20"
                    placeholder="Objet de votre message"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="text-xs font-semibold uppercase tracking-wide text-af-mud">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="mt-2 w-full resize-y rounded-2xl border border-af-wood/20 bg-white px-4 py-3 text-af-wood placeholder:text-af-mud/55 outline-none transition focus:border-af-ocre/50 focus:ring-2 focus:ring-af-ocre/20"
                    placeholder="Votre message…"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-af-ocre py-4 text-sm font-semibold text-af-ivory shadow-[0_14px_40px_rgba(212,101,26,.25)] transition hover:bg-[#b85716] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Envoi en cours…' : 'Envoyer le message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
