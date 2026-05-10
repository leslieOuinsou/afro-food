import Link from 'next/link';

type AuthSplitPanelProps = {
  /** Préfixe unique pour les ids SVG (évite collisions si plusieurs panneaux) */
  idPrefix?: string;
  /** Citation principale (desktop) */
  quoteDesktop: string;
  attribution?: string;
  /** Citation courte (mobile) */
  mobileQuote?: string;
};

export default function AuthSplitPanel({
  idPrefix = 'auth',
  quoteDesktop,
  attribution = '— Afro-food Market',
  mobileQuote = '« Les saveurs qui voyagent. »',
}: AuthSplitPanelProps) {
  const a = `${idPrefix}KenteA`;
  const b = `${idPrefix}KenteB`;
  const m = `${idPrefix}KenteM`;

  return (
    <>
      <div className="hidden lg:block lg:w-[min(44%,520px)] lg:shrink-0">
        <div className="relative flex min-h-[220px] flex-1 flex-col justify-between overflow-hidden bg-[#2C1A0E] px-10 py-12 text-[#FAF3E0] lg:min-h-screen lg:px-12 lg:py-16">
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.12]">
            <svg className="absolute -left-16 top-8 h-72 w-72 text-[#C2610F]" viewBox="0 0 400 400" fill="none">
              <defs>
                <pattern id={a} x="0" y="0" width="56" height="56" patternUnits="userSpaceOnUse">
                  <path d="M0 28h56M28 0v56" stroke="currentColor" strokeWidth="2.5" />
                  <path d="M0 0l56 56M56 0L0 56" stroke="currentColor" strokeWidth="1.5" opacity="0.85" />
                  <rect x="0" y="0" width="56" height="56" stroke="currentColor" strokeWidth="1" opacity="0.5" fill="none" />
                </pattern>
              </defs>
              <rect width="400" height="400" fill={`url(#${a})`} />
            </svg>
            <svg
              className="absolute -bottom-10 -right-10 h-96 w-96 text-[#8B3A2A]"
              viewBox="0 0 400 400"
              fill="none"
            >
              <defs>
                <pattern id={b} x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
                  <path d="M24 0v48M0 24h48" stroke="currentColor" strokeWidth="2" />
                  <circle cx="24" cy="24" r="6" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.7" />
                  <path d="M8 8l32 32M32 8L8 32" stroke="currentColor" strokeWidth="1" opacity="0.55" />
                </pattern>
              </defs>
              <rect width="400" height="400" fill={`url(#${b})`} />
            </svg>
          </div>

          <div className="relative z-[1]">
            <Link
              href="/"
              className="inline-flex items-center gap-3 opacity-90 transition hover:opacity-100"
              title="Retour à l’accueil"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAF3E0]/10 ring-1 ring-[#FAF3E0]/15">
                <img src="/logo-afro-eats.png" alt="Afro-food" className="h-8 w-8 object-contain" />
              </div>
              <span className="font-ui text-sm font-semibold tracking-wide text-[#FAF3E0]/90">Afro-food</span>
            </Link>
          </div>

          <blockquote className="relative z-[1] max-w-md">
            <p className="font-title text-2xl leading-snug tracking-tight text-[#FAF3E0] sm:text-3xl lg:text-[2rem] lg:leading-[1.2]">
              {quoteDesktop}
            </p>
            <footer className="mt-6 font-ui text-sm text-[#FAF3E0]/55">{attribution}</footer>
          </blockquote>

          <p className="relative z-[1] font-ui text-xs text-[#FAF3E0]/40">© {new Date().getFullYear()} Afro-food</p>
        </div>
      </div>

      <div className="lg:hidden">
        <div className="relative overflow-hidden bg-[#2C1A0E] px-6 py-8">
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.1]">
            <svg className="absolute -right-8 top-0 h-48 w-48 text-[#C2610F]" viewBox="0 0 200 200" fill="none">
              <defs>
                <pattern id={m} x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M0 16h32M16 0v32" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M0 0l32 32M32 0L0 32" stroke="currentColor" strokeWidth="1" opacity="0.6" />
                </pattern>
              </defs>
              <rect width="200" height="200" fill={`url(#${m})`} />
            </svg>
          </div>
          <div className="relative z-[1] mb-5">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 opacity-95 transition hover:opacity-100"
              title="Retour à l’accueil"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF3E0]/10 ring-1 ring-[#FAF3E0]/15">
                <img src="/logo-afro-eats.png" alt="" className="h-7 w-7 object-contain" />
              </div>
              <span className="font-ui text-sm font-semibold text-[#FAF3E0]/90">Accueil</span>
            </Link>
          </div>
          <p className="relative z-[1] font-title text-xl leading-snug text-[#FAF3E0]">{mobileQuote}</p>
        </div>
      </div>
    </>
  );
}
