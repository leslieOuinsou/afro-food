import Link from 'next/link';

export default function AuthBackHome() {
  return (
    <Link
      href="/"
      className="group mb-6 inline-flex items-center gap-2 font-ui text-sm font-semibold text-[#2C1A0E]/65 transition hover:text-[#C2610F]"
    >
      <span
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#2C1A0E]/12 bg-white text-[#2C1A0E]/50 transition group-hover:border-[#C2610F]/35 group-hover:text-[#C2610F]"
        aria-hidden
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </span>
      Retour à l’accueil
    </Link>
  );
}
