'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { forgotPassword, resetPassword } from '@/services/auth';

function validateEmail(value: string): string | null {
  const v = value.trim();
  if (!v) return 'L’e-mail est requis.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Format d’e-mail invalide.';
  return null;
}

function validatePassword(value: string): string | null {
  if (!value) return 'Le mot de passe est requis.';
  if (value.length < 8) return 'Au moins 8 caractères.';
  return null;
}

function getPasswordStrength(password: string): { level: 0 | 1 | 2 | 3 | 4; label: string } {
  if (!password) return { level: 0, label: '' };
  let pts = 0;
  if (password.length >= 8) pts += 1;
  if (password.length >= 12) pts += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) pts += 1;
  if (/\d/.test(password)) pts += 1;
  if (/[^a-zA-Z0-9]/.test(password)) pts += 1;
  const raw = Math.min(4, Math.max(1, Math.ceil((pts / 5) * 4)));
  const level = raw as 0 | 1 | 2 | 3 | 4;
  const labels: Record<number, string> = { 1: 'Faible', 2: 'Moyen', 3: 'Bon', 4: 'Fort' };
  return { level, label: labels[level] ?? 'Faible' };
}

function PasswordStrengthMeter({ password }: { password: string }) {
  const { level, label } = getPasswordStrength(password);
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1" aria-hidden>
        {[1, 2, 3, 4].map((i) => {
          const on = i <= level;
          const tone = !on ? 'bg-[#2C1A0E]/12' : level <= 2 ? 'bg-amber-500' : 'bg-emerald-600';
          return <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${tone}`} />;
        })}
      </div>
      <p className="font-ui text-xs font-medium text-[#2C1A0E]/60">
        Force : <span className={level <= 2 ? 'text-amber-700' : 'text-emerald-700'}>{label}</span>
      </p>
    </div>
  );
}

function MailIllustration() {
  return (
    <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-[2rem] border-2 border-[#C2610F]/25 bg-gradient-to-br from-[#C2610F]/12 to-[#8B3A2A]/10 shadow-[0_20px_50px_rgba(44,26,14,.08)]">
      <svg className="h-24 w-24 text-[#C2610F]" viewBox="0 0 120 120" fill="none" aria-hidden>
        <rect x="12" y="32" width="96" height="64" rx="10" stroke="currentColor" strokeWidth="2.5" />
        <path d="M12 42l48 36 48-36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="60" cy="58" r="8" fill="#2C1A0E" opacity="0.15" />
        <path d="M44 88h32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      </svg>
    </div>
  );
}

const STORAGE_TOKEN_KEY = 'afro_eats_reset_flow_token';

function MotDePasseOublieContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [erreurGlobal, setErreurGlobal] = useState('');
  const [chargement, setChargement] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const syncTokenFromUrl = useCallback(() => {
    const t = searchParams.get('token');
    if (t) {
      setToken(t);
      setStep(3);
    }
  }, [searchParams]);

  useEffect(() => {
    syncTokenFromUrl();
  }, [syncTokenFromUrl]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = sessionStorage.getItem(STORAGE_TOKEN_KEY);
      if (stored && !searchParams.get('token')) setToken(stored);
    } catch {
      /* ignore */
    }
  }, [searchParams]);

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    setErreurGlobal('');
    const err = validateEmail(email);
    setEmailError(err);
    if (err) return;

    setChargement(true);
    try {
      const res = await forgotPassword(email);
      const devToken = res.data?.resetToken;
      if (devToken) {
        try {
          sessionStorage.setItem(STORAGE_TOKEN_KEY, devToken);
          setToken(devToken);
        } catch {
          /* ignore */
        }
      }
      if (!res.success) {
        setErreurGlobal(
          res.message || 'Le service de réinitialisation est temporairement indisponible. Réessayez.'
        );
        return;
      }
    } catch (err) {
      setErreurGlobal(err instanceof Error ? err.message : 'Erreur réseau. Réessayez.');
      return;
    } finally {
      setChargement(false);
    }
    setStep(2);
  }

  async function handleResend() {
    setChargement(true);
    setErreurGlobal('');
    try {
      const res = await forgotPassword(email);
      if (!res.success) {
        setErreurGlobal(res.message || 'Impossible de renvoyer l’e-mail maintenant.');
      }
    } catch (err) {
      setErreurGlobal(err instanceof Error ? err.message : 'Erreur réseau. Réessayez.');
    } finally {
      setChargement(false);
    }
  }

  function goToStep3() {
    setStep(3);
  }

  async function handleNewPassword(e: React.FormEvent) {
    e.preventDefault();
    setErreurGlobal('');
    const errP = validatePassword(motDePasse);
    setPwdError(errP);
    let errC: string | null = null;
    if (motDePasse !== confirmation) errC = 'Les mots de passe ne correspondent pas.';
    setConfirmError(errC);
    if (errP || errC) return;

    const t = token || searchParams.get('token');
    if (!t) {
      setErreurGlobal('Lien de réinitialisation invalide ou expiré. Recommencez depuis l’étape 1.');
      return;
    }

    setChargement(true);
    try {
      const res = await resetPassword(t, motDePasse, confirmation);
      if (res.success) {
        try {
          sessionStorage.removeItem(STORAGE_TOKEN_KEY);
        } catch {
          /* ignore */
        }
        router.push('/login?reset=ok');
        router.refresh();
        return;
      }
      setErreurGlobal(
        res.message ||
          'Le service de réinitialisation n’est pas disponible pour le moment. Réessayez plus tard ou contactez le support.'
      );
    } catch (err) {
      setErreurGlobal(err instanceof Error ? err.message : 'Erreur inattendue.');
    } finally {
      setChargement(false);
    }
  }

  const inputBase =
    'w-full rounded-2xl border bg-white px-4 py-3 font-ui text-sm text-[#2C1A0E] outline-none transition placeholder:text-[#2C1A0E]/35 focus:ring-2 border-[#2C1A0E]/12 focus:border-[#C2610F]/50 focus:ring-[#C2610F]/20';
  const inputError = 'border-red-400 focus:border-red-500 focus:ring-red-200';

  const backLink = (
    <Link
      href="/login"
      className="inline-flex items-center gap-2 font-ui text-sm font-semibold text-[#2C1A0E]/75 transition hover:text-[#C2610F]"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Retour à la connexion
    </Link>
  );

  return (
    <div className="min-h-screen bg-[#FAF3E0] px-6 py-10 text-[#2C1A0E] sm:py-14">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8">{backLink}</div>

        <div className="mb-6 flex items-center justify-center">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 font-ui text-xs font-bold transition ${
                  step > n
                    ? 'border-[#8B3A2A] bg-[#8B3A2A] text-[#FAF3E0]'
                    : step === n
                      ? 'border-[#C2610F] bg-[#C2610F] text-white'
                      : 'border-[#2C1A0E]/12 bg-white text-[#2C1A0E]/35'
                }`}
              >
                {step > n ? '✓' : n}
              </div>
              {n < 3 ? (
                <div
                  className={`mx-1.5 h-0.5 w-8 sm:mx-2 sm:w-12 ${step > n ? 'bg-[#8B3A2A]/50' : 'bg-[#2C1A0E]/10'}`}
                  aria-hidden
                />
              ) : null}
            </div>
          ))}
        </div>

        <h1 className="font-title text-center text-3xl tracking-tight sm:text-4xl">Mot de passe oublié</h1>
        <p className="mt-2 text-center font-ui text-sm text-[#2C1A0E]/65">
          {step === 1 && 'Indiquez l’e-mail associé à votre compte.'}
          {step === 2 && 'Vérifiez votre boîte de réception.'}
          {step === 3 && 'Choisissez un nouveau mot de passe sécurisé.'}
        </p>

        <div className="mt-10 overflow-hidden">
          <div
            className="flex w-[300%] transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ transform: `translateX(-${(step - 1) * (100 / 3)}%)` }}
          >
            {/* Étape 1 */}
            <div className="w-1/3 min-w-0 shrink-0 px-1">
              <form onSubmit={handleSendEmail} className="space-y-5" noValidate>
                {erreurGlobal ? (
                  <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-ui text-sm text-red-900">
                    {erreurGlobal}
                  </div>
                ) : null}
                <div>
                  <label htmlFor="reset-email" className="mb-1.5 block font-ui text-sm font-semibold">
                    E-mail
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError(validateEmail(e.target.value) || null);
                    }}
                    onBlur={() => setEmailError(validateEmail(email))}
                    aria-invalid={!!emailError}
                    className={`${inputBase} ${emailError ? inputError : ''}`}
                    placeholder="vous@exemple.com"
                  />
                  {emailError ? (
                    <p className="mt-1.5 font-ui text-xs font-medium text-red-700" role="alert">
                      {emailError}
                    </p>
                  ) : null}
                </div>
                <button
                  type="submit"
                  disabled={chargement}
                  className="w-full rounded-full bg-[#C2610F] py-3.5 font-ui text-sm font-semibold text-white shadow-[0_12px_32px_rgba(194,97,15,.28)] transition hover:bg-[#a6500c] disabled:opacity-55"
                >
                  {chargement ? 'Envoi…' : 'Envoyer le lien'}
                </button>
              </form>
            </div>

            {/* Étape 2 */}
            <div className="w-1/3 min-w-0 shrink-0 px-1">
              <div className="space-y-6 text-center">
                <MailIllustration />
                <div>
                  <p className="font-ui text-sm leading-relaxed text-[#2C1A0E]/85">
                    Si un compte existe pour <strong className="text-[#2C1A0E]">{email || 'cette adresse'}</strong>, vous
                    recevrez un e-mail avec un lien pour réinitialiser votre mot de passe.
                  </p>
                  <p className="mt-3 font-ui text-xs text-[#2C1A0E]/50">
                    Pensez à vérifier vos courriers indésirables.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={chargement}
                  className="font-ui text-sm font-semibold text-[#C2610F] underline decoration-[#C2610F]/40 underline-offset-4 hover:decoration-[#C2610F] disabled:opacity-50"
                >
                  {chargement ? 'Envoi…' : 'Renvoyer l’e-mail'}
                </button>
                <div className="border-t border-[#2C1A0E]/10 pt-6">
                  <p className="mb-3 font-ui text-xs text-[#2C1A0E]/55">
                    Vous avez déjà cliqué sur le lien reçu par e-mail ?
                  </p>
                  <button
                    type="button"
                    onClick={goToStep3}
                    className="w-full rounded-full border-2 border-[#2C1A0E]/12 bg-white py-3 font-ui text-sm font-semibold text-[#2C1A0E] transition hover:border-[#C2610F]/35 hover:bg-[#FFF7EA]"
                  >
                    Définir un nouveau mot de passe
                  </button>
                </div>
              </div>
            </div>

            {/* Étape 3 */}
            <div className="w-1/3 min-w-0 shrink-0 px-1">
              <form onSubmit={handleNewPassword} className="space-y-5" noValidate>
                {erreurGlobal ? (
                  <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-ui text-sm text-red-900">
                    {erreurGlobal}
                  </div>
                ) : null}
                <div>
                  <label htmlFor="reset-mp" className="mb-1.5 block font-ui text-sm font-semibold">
                    Nouveau mot de passe
                  </label>
                  <input
                    id="reset-mp"
                    type="password"
                    autoComplete="new-password"
                    value={motDePasse}
                    onChange={(e) => {
                      const v = e.target.value;
                      setMotDePasse(v);
                      setPwdError(validatePassword(v) || null);
                      setConfirmError(
                        confirmation && v !== confirmation ? 'Les mots de passe ne correspondent pas.' : null
                      );
                    }}
                    className={`${inputBase} ${pwdError ? inputError : ''}`}
                    placeholder="••••••••"
                  />
                  {pwdError ? (
                    <p className="mt-1.5 font-ui text-xs font-medium text-red-700" role="alert">
                      {pwdError}
                    </p>
                  ) : null}
                  <PasswordStrengthMeter password={motDePasse} />
                </div>
                <div>
                  <label htmlFor="reset-mp2" className="mb-1.5 block font-ui text-sm font-semibold">
                    Confirmer le mot de passe
                  </label>
                  <input
                    id="reset-mp2"
                    type="password"
                    autoComplete="new-password"
                    value={confirmation}
                    onChange={(e) => {
                      const v = e.target.value;
                      setConfirmation(v);
                      setConfirmError(v && motDePasse !== v ? 'Les mots de passe ne correspondent pas.' : null);
                    }}
                    className={`${inputBase} ${confirmError ? inputError : ''}`}
                    placeholder="••••••••"
                  />
                  {confirmError ? (
                    <p className="mt-1.5 font-ui text-xs font-medium text-red-700" role="alert">
                      {confirmError}
                    </p>
                  ) : null}
                </div>
                <button
                  type="submit"
                  disabled={chargement}
                  className="w-full rounded-full bg-[#C2610F] py-3.5 font-ui text-sm font-semibold text-white shadow-[0_12px_32px_rgba(194,97,15,.28)] transition hover:bg-[#a6500c] disabled:opacity-55"
                >
                  {chargement ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-center border-t border-[#2C1A0E]/10 pt-8">{backLink}</div>
      </div>
    </div>
  );
}

export default function MotDePasseOubliePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAF3E0]">
          <p className="font-ui text-[#2C1A0E]/70">Chargement…</p>
        </div>
      }
    >
      <MotDePasseOublieContent />
    </Suspense>
  );
}
