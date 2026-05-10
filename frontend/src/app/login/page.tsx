'use client';

import { Suspense, useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { login, TOKEN_KEY } from '@/services/auth';
import { useToast } from '@/context/ToastContext';
import AuthSplitPanel from '@/components/AuthSplitPanel';
import AuthBackHome from '@/components/AuthBackHome';

function validateEmail(value: string): string | null {
  const v = value.trim();
  if (!v) return 'L’adresse e-mail est requise.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Format d’e-mail invalide.';
  return null;
}

function validatePassword(value: string): string | null {
  if (!value) return 'Le mot de passe est requis.';
  if (value.length < 8) return 'Au moins 8 caractères.';
  return null;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const redirect = searchParams.get('redirect') || '/';
  const apresInscription = searchParams.get('inscription') === 'ok';
  const apresResetMotDePasse = searchParams.get('reset') === 'ok';

  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [remember, setRemember] = useState(true);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [erreurGlobal, setErreurGlobal] = useState('');
  const [chargement, setChargement] = useState(false);

  const runEmailValidation = useCallback((value: string) => {
    setEmailError(validateEmail(value));
  }, []);

  const runPasswordValidation = useCallback((value: string) => {
    setPasswordError(validatePassword(value));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreurGlobal('');
    const errE = validateEmail(email);
    const errP = validatePassword(motDePasse);
    setEmailError(errE);
    setPasswordError(errP);
    if (errE || errP) return;

    setChargement(true);
    try {
      const res = await login(email.trim(), motDePasse);
      if (res.success && res.data?.token) {
        if (!remember) {
          try {
            localStorage.removeItem(TOKEN_KEY);
            sessionStorage.setItem(TOKEN_KEY, res.data.token);
          } catch {
            /* ignore */
          }
        }
        router.push(redirect);
        router.refresh();
        return;
      }
      setErreurGlobal(res.message || 'E-mail ou mot de passe incorrect.');
    } catch (err) {
      setErreurGlobal(err instanceof Error ? err.message : 'Erreur de connexion.');
    } finally {
      setChargement(false);
    }
  }

  function handleGoogleClick() {
    toast.info(
      'La connexion Google sera disponible prochainement. Utilisez e-mail et mot de passe pour l’instant.',
      'Bientôt disponible'
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF3E0] lg:flex-row">
      <AuthSplitPanel
        idPrefix="login"
        quoteDesktop="« Les marchés racontent des histoires — chaque plat est une invitation au voyage. »"
        mobileQuote="« Les saveurs qui voyagent. »"
      />

      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          <AuthBackHome />
          <div className="mb-8 lg:mb-10">
            <h1 className="font-title text-3xl tracking-tight text-[#2C1A0E] sm:text-4xl">Connexion</h1>
            <p className="mt-2 font-ui text-sm text-[#2C1A0E]/65">
              Accédez à votre compte Afro-food — commandes, favoris et préférences.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {apresInscription && (
              <div
                role="status"
                className="rounded-2xl border border-[#C2610F]/30 bg-[#C2610F]/10 px-4 py-3 font-ui text-sm text-[#2C1A0E]"
              >
                Inscription réussie. Vous pouvez vous connecter.
              </div>
            )}

            {apresResetMotDePasse && (
              <div
                role="status"
                className="rounded-2xl border border-[#8B3A2A]/25 bg-[#8B3A2A]/10 px-4 py-3 font-ui text-sm text-[#2C1A0E]"
              >
                Mot de passe mis à jour. Connectez-vous avec votre nouveau mot de passe.
              </div>
            )}

            {erreurGlobal ? (
              <div
                role="alert"
                className="rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 font-ui text-sm text-red-900"
              >
                {erreurGlobal}
              </div>
            ) : null}

            <div>
              <label htmlFor="login-email" className="mb-1.5 block font-ui text-sm font-semibold text-[#2C1A0E]">
                E-mail
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) runEmailValidation(e.target.value);
                }}
                onBlur={() => runEmailValidation(email)}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? 'login-email-error' : undefined}
                className={`w-full rounded-2xl border bg-white px-4 py-3 font-ui text-sm text-[#2C1A0E] outline-none transition placeholder:text-[#2C1A0E]/35 focus:ring-2 ${
                  emailError
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                    : 'border-[#2C1A0E]/12 focus:border-[#C2610F]/50 focus:ring-[#C2610F]/20'
                }`}
                placeholder="vous@exemple.com"
              />
              {emailError ? (
                <p id="login-email-error" className="mt-1.5 font-ui text-xs font-medium text-red-700" role="alert">
                  {emailError}
                </p>
              ) : null}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label htmlFor="login-password" className="font-ui text-sm font-semibold text-[#2C1A0E]">
                  Mot de passe
                </label>
                <Link
                  href="/mot-de-passe-oublie"
                  className="font-ui text-xs font-semibold text-[#C2610F] underline decoration-[#C2610F]/35 underline-offset-2 hover:decoration-[#C2610F]"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={motDePasse}
                onChange={(e) => {
                  setMotDePasse(e.target.value);
                  if (passwordError) runPasswordValidation(e.target.value);
                }}
                onBlur={() => runPasswordValidation(motDePasse)}
                aria-invalid={!!passwordError}
                aria-describedby={passwordError ? 'login-password-error' : undefined}
                className={`w-full rounded-2xl border bg-white px-4 py-3 font-ui text-sm text-[#2C1A0E] outline-none transition placeholder:text-[#2C1A0E]/35 focus:ring-2 ${
                  passwordError
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                    : 'border-[#2C1A0E]/12 focus:border-[#C2610F]/50 focus:ring-[#C2610F]/20'
                }`}
                placeholder="••••••••"
              />
              {passwordError ? (
                <p id="login-password-error" className="mt-1.5 font-ui text-xs font-medium text-red-700" role="alert">
                  {passwordError}
                </p>
              ) : null}
            </div>

            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-[#2C1A0E]/25 text-[#C2610F] focus:ring-[#C2610F]/30"
              />
              <span className="font-ui text-sm text-[#2C1A0E]/80">Se souvenir de moi</span>
            </label>

            <button
              type="submit"
              disabled={chargement}
              className="w-full rounded-full bg-[#C2610F] py-3.5 font-ui text-sm font-semibold text-white shadow-[0_12px_32px_rgba(194,97,15,.28)] transition hover:bg-[#a6500c] disabled:cursor-not-allowed disabled:opacity-55"
            >
              {chargement ? 'Connexion…' : 'Connexion'}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t border-[#2C1A0E]/12" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#FAF3E0] px-3 font-ui text-xs font-semibold uppercase tracking-wider text-[#2C1A0E]/45">
                ou
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleClick}
            className="flex w-full items-center justify-center gap-3 rounded-full border-2 border-[#2C1A0E]/12 bg-white py-3 font-ui text-sm font-semibold text-[#2C1A0E] shadow-sm transition hover:border-[#2C1A0E]/20 hover:bg-[#FFF7EA]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuer avec Google
          </button>

          <p className="mt-10 text-center font-ui text-sm text-[#2C1A0E]/65">
            Pas encore de compte ?{' '}
            <Link
              href="/inscription"
              className="font-semibold text-[#C2610F] underline decoration-[#C2610F]/35 underline-offset-2 hover:decoration-[#C2610F]"
            >
              Créer un compte
            </Link>
          </p>

          <p className="mt-4 text-center font-ui text-xs text-[#2C1A0E]/45">
            En vous connectant, vous acceptez nos{' '}
            <Link href="/terms" className="text-[#C2610F] underline underline-offset-2 hover:text-[#a6500c]">
              conditions
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAF3E0]">
          <p className="font-ui text-[#2C1A0E]/70">Chargement…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
