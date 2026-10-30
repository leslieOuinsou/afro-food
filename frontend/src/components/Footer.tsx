'use client';

import { useLangue } from '@/context/I18nContext';
import { openCookieSettings } from '@/lib/consent';
import { trackNewsletter } from '@/lib/analytics';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import { subscribeNewsletter } from '@/services/newsletter';

const WOOD = '#2C1A0E';
const IVORY = '#FAF3E0';
const OCHRE = '#C2610F';

/** Catégories alignées sur les slugs API / fallback catalogue */
const CATALOGUE_CATEGORIES: { label: string; slug: string }[] = [
  { label: 'Plats principaux', slug: 'plats-principaux' },
  { label: 'Boissons', slug: 'boissons' },
  { label: 'Épices & condiments', slug: 'epices' },
  { label: 'Snacks & douceurs', slug: 'snacks' },
  { label: 'Desserts', slug: 'desserts' },
];

const SOCIAL = [
  {
    name: 'Facebook',
    href: 'https://www.facebook.com',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: 'Instagram',
    href: 'https://www.instagram.com',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    name: 'X (Twitter)',
    href: 'https://twitter.com',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: 'TikTok',
    href: 'https://www.tiktok.com',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
      </svg>
    ),
  },
];

function FooterGeoPattern() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.055]" aria-hidden>
      <svg className="h-full w-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="footerMudcloth" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M0 24h48M24 0v48" stroke={IVORY} strokeWidth="0.6" />
            <path d="M12 12l24 24M36 12L12 36" stroke={IVORY} strokeWidth="0.45" opacity="0.7" />
            <rect x="18" y="18" width="12" height="12" fill="none" stroke={OCHRE} strokeWidth="0.5" opacity="0.9" />
            <circle cx="24" cy="24" r="2.5" fill={OCHRE} opacity="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#footerMudcloth)" />
      </svg>
    </div>
  );
}

function PaymentMarks() {
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Moyens de paiement acceptés">
      <span className="flex h-7 items-center rounded border border-white/15 bg-white/5 px-2 font-ui text-[10px] font-bold uppercase tracking-wider text-[#FAF3E0]/90">
        Visa
      </span>
      <span className="flex h-7 items-center rounded border border-white/15 bg-white/5 px-2 font-ui text-[10px] font-bold uppercase tracking-wider text-[#FAF3E0]/90">
        Mastercard
      </span>
      <span className="flex h-7 items-center rounded border border-white/15 bg-white/5 px-1.5 font-ui text-[9px] font-bold uppercase tracking-wide text-[#FAF3E0]/90">
        CB
      </span>
      <span className="flex h-7 items-center rounded border border-white/15 bg-white/5 px-2 font-ui text-[10px] font-semibold text-[#FAF3E0]/85">
        PayPal
      </span>
    </div>
  );
}

function linkClassName() {
  return 'font-ui text-sm text-[#FAF3E0]/80 transition-colors hover:text-[#C2610F]';
}

export default function Footer() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const { langue: lang, changerLangue } = useLangue();
  const [busy, setBusy] = useState(false);

  const onNewsletterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.info('Indiquez une adresse e-mail pour vous inscrire.', 'Newsletter');
      return;
    }
    setBusy(true);
    try {
      const res = await subscribeNewsletter(trimmed);
      if (res.success) {
        trackNewsletter('footer');
        setEmail('');
        toast.success(res.message || 'Vous êtes inscrit·e à notre lettre d’information.', 'Merci !');
      } else {
        toast.info(res.message || 'Inscription impossible pour le moment.', 'Newsletter');
      }
    } catch {
      toast.info('Inscription impossible pour le moment.', 'Newsletter');
    } finally {
      setBusy(false);
    }
  };

  const year = new Date().getFullYear();

  return (
    <footer
      className="relative overflow-hidden text-[#FAF3E0]"
      style={{ backgroundColor: WOOD }}
    >
      <FooterGeoPattern />

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 pb-6 pt-8 lg:px-12 lg:pb-8 lg:pt-10">
        {/* Newsletter */}
        <div className="mb-6 flex flex-col gap-3 border-b border-white/10 pb-6 lg:mb-8 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <div className="max-w-xl">
            <h2 className="font-title text-xl tracking-tight text-[#FAF3E0] md:text-[1.45rem]">Restez dans la boucle</h2>
            <p className="mt-1.5 font-ui text-sm leading-snug text-[#FAF3E0]/70">
              Recettes, nouveautés et offres — une fois par semaine, pas plus.
            </p>
          </div>
          <form
            onSubmit={onNewsletterSubmit}
            className="flex w-full max-w-lg flex-col gap-2 sm:flex-row sm:items-stretch"
          >
            <label htmlFor="footer-newsletter-email" className="sr-only">
              Adresse e-mail
            </label>
            <input
              id="footer-newsletter-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-10 flex-1 rounded-full border border-white/15 bg-white/5 px-4 font-ui text-sm text-[#FAF3E0] placeholder:text-[#FAF3E0]/35 outline-none ring-[#C2610F]/0 transition focus:border-[#C2610F]/50 focus:ring-2 focus:ring-[#C2610F]/25"
            />
            <button
              type="submit"
              disabled={busy}
              className="min-h-10 shrink-0 rounded-full bg-[#C2610F] px-6 font-ui text-sm font-semibold text-white shadow-[0_8px_24px_rgba(194,97,15,.35)] transition hover:bg-[#a6500c] disabled:opacity-60"
            >
              {busy ? '…' : "S'inscrire"}
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* À propos */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-[#FAF3E0]/10 p-1 ring-1 ring-white/10">
                <Image
                  src="/logo-afro-eats.png"
                  alt="Afro-food"
                  width={44}
                  height={44}
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <p className="font-title text-lg tracking-tight text-[#FAF3E0]">Afro-food</p>
                <p className="font-ui text-xs text-[#FAF3E0]/55">Marketplace culinaire</p>
              </div>
            </div>
            <p className="mt-3 font-ui text-sm leading-snug text-[#FAF3E0]/72">
              Une marketplace qui met en avant les saveurs africaines, les producteurs et les cuisines de chez nous.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SOCIAL.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/5 text-[#FAF3E0]/85 transition hover:border-[#C2610F]/40 hover:bg-[#C2610F]/15 hover:text-[#C2610F]"
                  aria-label={s.name}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Catalogue */}
          <div>
            <h3 className="font-title text-base tracking-tight text-[#FAF3E0]">Catalogue</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/catalogue" className={linkClassName()}>
                  Tout le catalogue
                </Link>
              </li>
              {CATALOGUE_CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <Link href={`/catalogue?categorie=${encodeURIComponent(c.slug)}`} className={linkClassName()}>
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Aide */}
          <div>
            <h3 className="font-title text-base tracking-tight text-[#FAF3E0]">Aide</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/faq" className={linkClassName()}>
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/recettes" className={linkClassName()}>
                  Recettes
                </Link>
              </li>
              <li>
                <Link href="/parrainage" className={linkClassName()}>
                  Parrainage
                </Link>
              </li>
              <li>
                <Link href="/abonnements" className={linkClassName()}>
                  Box abonnement
                </Link>
              </li>
              <li>
                <Link href="/groupe" className={linkClassName()}>
                  Commande de groupe
                </Link>
              </li>
              <li>
                <Link href="/contact" className={linkClassName()}>
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/terms" className={linkClassName()}>
                  Conditions générales (CGV)
                </Link>
              </li>
              <li>
                <Link href="/privacy" className={linkClassName()}>
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link href="/cookies" className={linkClassName()}>
                  Politique de cookies
                </Link>
              </li>
              <li>
                <button type="button" onClick={openCookieSettings} className={linkClassName()}>
                  Gérer les cookies
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bande basse */}
        <div className="mt-7 flex flex-col gap-4 border-t border-white/10 pt-5 md:flex-row md:items-center md:justify-between md:gap-5">
          <p className="font-ui text-xs text-[#FAF3E0]/55">
            © {year} Afro-food. Tous droits réservés.
          </p>

          <PaymentMarks />

          <div className="flex items-center gap-2 md:ml-auto">
            <label htmlFor="footer-lang" className="sr-only">
              Langue
            </label>
            <span className="font-ui text-xs text-[#FAF3E0]/45">Langue</span>
            <select
              id="footer-lang"
              value={lang}
              onChange={(e) => changerLangue(e.target.value === 'en' ? 'en' : 'fr')}
              className="rounded-full border border-white/15 bg-white/5 py-1.5 pl-3 pr-8 font-ui text-xs text-[#FAF3E0] outline-none ring-[#C2610F]/0 transition focus:border-[#C2610F]/45 focus:ring-2 focus:ring-[#C2610F]/20"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>
    </footer>
  );
}
