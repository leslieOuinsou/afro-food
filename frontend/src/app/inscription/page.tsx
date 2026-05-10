'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register, logout } from '@/services/auth';
import AuthSplitPanel from '@/components/AuthSplitPanel';
import AuthBackHome from '@/components/AuthBackHome';

const PAYS_OPTIONS = [
  { value: 'France', label: 'France' },
  { value: 'Belgique', label: 'Belgique' },
  { value: 'Suisse', label: 'Suisse' },
  { value: 'Canada', label: 'Canada' },
  { value: 'Luxembourg', label: 'Luxembourg' },
  { value: 'Autre', label: 'Autre' },
];

const REGIONS_AFRICAINES = [
  'Afrique de l’Ouest',
  'Afrique centrale',
  'Afrique du Nord',
  'Afrique de l’Est',
  'Afrique australe',
  'Cuisine fusion & diaspora',
];

const TYPES_PRODUITS = [
  'Plats cuisinés',
  'Épices & condiments',
  'Boissons',
  'Snacks & douceurs',
  'Produits frais',
  'Épicerie fine',
];

const ONBOARDING_KEY = 'afro_eats_inscription_preferences';

function validateName(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Ce champ est requis.';
  if (v.length < 2) return 'Au moins 2 caractères.';
  return null;
}

function validateEmail(value: string): string | null {
  const v = value.trim();
  if (!v) return 'L’e-mail est requis.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Format d’e-mail invalide.';
  return null;
}

function validatePhone(value: string): string | null {
  const v = value.trim();
  if (!v) return 'Le téléphone est requis.';
  if (!/^[+]?[(]?[\d\s\-()]{10,}$/.test(v)) return 'Numéro invalide (min. 10 chiffres).';
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
        Force :{' '}
        <span className={level <= 2 ? 'text-amber-700' : 'text-emerald-700'}>
          {label}
        </span>
      </p>
    </div>
  );
}

function toggleInList(list: string[], item: string): string[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

const STEPS = [
  { n: 1, label: 'Compte' },
  { n: 2, label: 'Préférences' },
  { n: 3, label: 'Profil' },
];

export default function InscriptionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [chargement, setChargement] = useState(false);
  const [erreurGlobal, setErreurGlobal] = useState('');

  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmationMotDePasse, setConfirmationMotDePasse] = useState('');

  const [pays, setPays] = useState('France');
  const [regions, setRegions] = useState<string[]>([]);
  const [typesProduits, setTypesProduits] = useState<string[]>([]);

  const [accepteCGU, setAccepteCGU] = useState(false);

  const [err, setErr] = useState<Record<string, string | undefined>>({});

  const clearField = useCallback((key: string) => {
    setErr((e) => {
      const n = { ...e };
      delete n[key];
      return n;
    });
  }, []);

  const validateStep1 = useCallback((): boolean => {
    const next: Record<string, string> = {};
    const e1 = validateName(prenom);
    const e2 = validateName(nom);
    const e3 = validateEmail(email);
    const e4 = validatePhone(telephone);
    const e5 = validatePassword(motDePasse);
    if (e1) next.prenom = e1;
    if (e2) next.nom = e2;
    if (e3) next.email = e3;
    if (e4) next.telephone = e4;
    if (e5) next.motDePasse = e5;
    if (motDePasse !== confirmationMotDePasse) {
      next.confirmationMotDePasse = 'Les mots de passe ne correspondent pas.';
    }
    setErr((prev) => ({ ...prev, ...next }));
    return Object.keys(next).length === 0;
  }, [prenom, nom, email, telephone, motDePasse, confirmationMotDePasse]);

  const validateStep2 = useCallback((): boolean => {
    const next: Record<string, string> = {};
    if (!pays.trim()) next.pays = 'Indiquez un pays.';
    if (regions.length === 0) next.regions = 'Sélectionnez au moins une région.';
    if (typesProduits.length === 0) next.typesProduits = 'Choisissez au moins un type de produit.';
    setErr((prev) => ({ ...prev, ...next }));
    return Object.keys(next).length === 0;
  }, [pays, regions.length, typesProduits.length]);

  const validateStep3 = useCallback((): boolean => {
    const next: Record<string, string> = {};
    if (!accepteCGU) next.cgu = 'Vous devez accepter les conditions générales.';
    setErr((prev) => ({ ...prev, ...next }));
    return !next.cgu;
  }, [accepteCGU]);

  const goNext = () => {
    setErreurGlobal('');
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const goBack = () => {
    setErreurGlobal('');
    setStep((s) => Math.max(1, s - 1));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreurGlobal('');
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    if (!validateStep2()) {
      setStep(2);
      return;
    }
    if (!validateStep3()) {
      setStep(3);
      return;
    }

    setChargement(true);
    try {
      const res = await register({
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.trim().toLowerCase(),
        telephone: telephone.trim(),
        motDePasse,
        confirmationMotDePasse,
        accepteCGU,
      });
      if (res.success) {
        try {
          localStorage.setItem(
            ONBOARDING_KEY,
            JSON.stringify({
              pays,
              regionsAfricaines: regions,
              typesProduits,
              savedAt: new Date().toISOString(),
            })
          );
        } catch {
          /* ignore */
        }
        await logout();
        router.push('/login?inscription=ok');
        router.refresh();
        return;
      }
      setErreurGlobal(res.message || 'Une erreur est survenue.');
    } catch (err) {
      setErreurGlobal(err instanceof Error ? err.message : 'Erreur d’inscription.');
    } finally {
      setChargement(false);
    }
  }

  const inputClass = (field: string) =>
    `w-full rounded-2xl border bg-white px-4 py-3 font-ui text-sm text-[#2C1A0E] outline-none transition placeholder:text-[#2C1A0E]/35 focus:ring-2 ${
      err[field]
        ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
        : 'border-[#2C1A0E]/12 focus:border-[#C2610F]/50 focus:ring-[#C2610F]/20'
    }`;

  const fieldError = (field: string) =>
    err[field] ? (
      <p className="mt-1.5 font-ui text-xs font-medium text-red-700" role="alert">
        {err[field]}
      </p>
    ) : null;

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF3E0] lg:flex-row">
      <AuthSplitPanel
        idPrefix="inscription"
        quoteDesktop="« Rejoignez une communauté qui célèbre les terroirs, sans jamais trahir les saveurs. »"
        mobileQuote="« Votre compte, vos terroirs. »"
      />

      <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-lg">
          <AuthBackHome />
          <div className="mb-8">
            <h1 className="font-title text-3xl tracking-tight text-[#2C1A0E] sm:text-4xl">Créer un compte</h1>
            <p className="mt-2 font-ui text-sm text-[#2C1A0E]/65">
              Quelques étapes pour rejoindre Afro-food — commandes, favoris et préférences.
            </p>
          </div>

          {/* Stepper */}
          <nav aria-label="Étapes d’inscription" className="mb-8">
            <ol className="flex items-center justify-between gap-2">
              {STEPS.map((s, i) => (
                <li key={s.n} className="flex flex-1 items-center gap-2">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 font-ui text-sm font-bold transition ${
                      step > s.n
                        ? 'border-[#8B3A2A] bg-[#8B3A2A] text-[#FAF3E0]'
                        : step === s.n
                          ? 'border-[#C2610F] bg-[#C2610F] text-white'
                          : 'border-[#2C1A0E]/15 bg-white text-[#2C1A0E]/40'
                    }`}
                  >
                    {step > s.n ? '✓' : s.n}
                  </div>
                  <span
                    className={`hidden font-ui text-xs font-semibold uppercase tracking-wide sm:block ${
                      step >= s.n ? 'text-[#2C1A0E]' : 'text-[#2C1A0E]/40'
                    }`}
                  >
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 ? (
                    <div
                      className={`mx-1 hidden h-0.5 flex-1 sm:block ${step > s.n ? 'bg-[#8B3A2A]/50' : 'bg-[#2C1A0E]/10'}`}
                      aria-hidden
                    />
                  ) : null}
                </li>
              ))}
            </ol>
          </nav>

          <form onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()} noValidate>
            {erreurGlobal ? (
              <div
                role="alert"
                className="mb-6 rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 font-ui text-sm text-red-900"
              >
                {erreurGlobal}
              </div>
            ) : null}

            {step === 1 && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="ins-prenom" className="mb-1.5 block font-ui text-sm font-semibold text-[#2C1A0E]">
                      Prénom
                    </label>
                    <input
                      id="ins-prenom"
                      value={prenom}
                      onChange={(e) => {
                        const v = e.target.value;
                        setPrenom(v);
                        setErr((prev) => ({ ...prev, prenom: validateName(v) || undefined }));
                      }}
                      onBlur={() =>
                        setErr((prev) => ({ ...prev, prenom: validateName(prenom) || undefined }))
                      }
                      className={inputClass('prenom')}
                      autoComplete="given-name"
                      placeholder="Aminata"
                    />
                    {fieldError('prenom')}
                  </div>
                  <div>
                    <label htmlFor="ins-nom" className="mb-1.5 block font-ui text-sm font-semibold text-[#2C1A0E]">
                      Nom
                    </label>
                    <input
                      id="ins-nom"
                      value={nom}
                      onChange={(e) => {
                        const v = e.target.value;
                        setNom(v);
                        setErr((prev) => ({ ...prev, nom: validateName(v) || undefined }));
                      }}
                      onBlur={() => setErr((prev) => ({ ...prev, nom: validateName(nom) || undefined }))}
                      className={inputClass('nom')}
                      autoComplete="family-name"
                      placeholder="Koné"
                    />
                    {fieldError('nom')}
                  </div>
                </div>

                <div>
                  <label htmlFor="ins-email" className="mb-1.5 block font-ui text-sm font-semibold text-[#2C1A0E]">
                    E-mail
                  </label>
                  <input
                    id="ins-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEmail(v);
                      setErr((prev) => ({ ...prev, email: validateEmail(v) || undefined }));
                    }}
                    onBlur={() =>
                      setErr((prev) => ({ ...prev, email: validateEmail(email) || undefined }))
                    }
                    className={inputClass('email')}
                    autoComplete="email"
                    placeholder="vous@exemple.com"
                  />
                  {fieldError('email')}
                </div>

                <div>
                  <label htmlFor="ins-tel" className="mb-1.5 block font-ui text-sm font-semibold text-[#2C1A0E]">
                    Téléphone
                  </label>
                  <input
                    id="ins-tel"
                    type="tel"
                    value={telephone}
                    onChange={(e) => {
                      const v = e.target.value;
                      setTelephone(v);
                      setErr((prev) => ({ ...prev, telephone: validatePhone(v) || undefined }));
                    }}
                    onBlur={() =>
                      setErr((prev) => ({ ...prev, telephone: validatePhone(telephone) || undefined }))
                    }
                    className={inputClass('telephone')}
                    autoComplete="tel"
                    placeholder="+33 6 12 34 56 78"
                  />
                  {fieldError('telephone')}
                </div>

                <div>
                  <label htmlFor="ins-mp" className="mb-1.5 block font-ui text-sm font-semibold text-[#2C1A0E]">
                    Mot de passe
                  </label>
                  <input
                    id="ins-mp"
                    type="password"
                    value={motDePasse}
                    onChange={(e) => {
                      const v = e.target.value;
                      setMotDePasse(v);
                      setErr((prev) => ({
                        ...prev,
                        motDePasse: validatePassword(v) || undefined,
                        confirmationMotDePasse:
                          confirmationMotDePasse && v !== confirmationMotDePasse
                            ? 'Les mots de passe ne correspondent pas.'
                            : undefined,
                      }));
                    }}
                    onBlur={() =>
                      setErr((prev) => ({
                        ...prev,
                        motDePasse: validatePassword(motDePasse) || undefined,
                      }))
                    }
                    className={inputClass('motDePasse')}
                    autoComplete="new-password"
                    placeholder="••••••••"
                  />
                  {fieldError('motDePasse')}
                  <PasswordStrengthMeter password={motDePasse} />
                </div>

                <div>
                  <label htmlFor="ins-mp2" className="mb-1.5 block font-ui text-sm font-semibold text-[#2C1A0E]">
                    Confirmer le mot de passe
                  </label>
                  <input
                    id="ins-mp2"
                    type="password"
                    value={confirmationMotDePasse}
                    onChange={(e) => {
                      const v = e.target.value;
                      setConfirmationMotDePasse(v);
                      setErr((prev) => ({
                        ...prev,
                        confirmationMotDePasse:
                          v && motDePasse !== v ? 'Les mots de passe ne correspondent pas.' : undefined,
                      }));
                    }}
                    onBlur={() =>
                      setErr((prev) => ({
                        ...prev,
                        confirmationMotDePasse:
                          confirmationMotDePasse && motDePasse !== confirmationMotDePasse
                            ? 'Les mots de passe ne correspondent pas.'
                            : undefined,
                      }))
                    }
                    className={inputClass('confirmationMotDePasse')}
                    autoComplete="new-password"
                    placeholder="••••••••"
                  />
                  {fieldError('confirmationMotDePasse')}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="ins-pays" className="mb-1.5 block font-ui text-sm font-semibold text-[#2C1A0E]">
                    Pays
                  </label>
                  <select
                    id="ins-pays"
                    value={pays}
                    onChange={(e) => {
                      setPays(e.target.value);
                      clearField('pays');
                    }}
                    className={inputClass('pays')}
                  >
                    {PAYS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  {fieldError('pays')}
                </div>

                <div>
                  <p className="mb-2 font-ui text-sm font-semibold text-[#2C1A0E]">Régions africaines préférées</p>
                  <div className="flex flex-wrap gap-2">
                    {REGIONS_AFRICAINES.map((r) => {
                      const active = regions.includes(r);
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            setRegions((prev) => toggleInList(prev, r));
                            clearField('regions');
                          }}
                          className={`rounded-full border px-3 py-1.5 font-ui text-xs font-semibold transition ${
                            active
                              ? 'border-[#8B3A2A] bg-[#8B3A2A]/15 text-[#2C1A0E]'
                              : 'border-[#2C1A0E]/12 bg-white text-[#2C1A0E]/80 hover:border-[#C2610F]/40'
                          }`}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                  {fieldError('regions')}
                </div>

                <div>
                  <p className="mb-2 font-ui text-sm font-semibold text-[#2C1A0E]">Types de produits</p>
                  <div className="flex flex-wrap gap-2">
                    {TYPES_PRODUITS.map((t) => {
                      const active = typesProduits.includes(t);
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setTypesProduits((prev) => toggleInList(prev, t));
                            clearField('typesProduits');
                          }}
                          className={`rounded-full border px-3 py-1.5 font-ui text-xs font-semibold transition ${
                            active
                              ? 'border-[#C2610F] bg-[#C2610F]/12 text-[#2C1A0E]'
                              : 'border-[#2C1A0E]/12 bg-white text-[#2C1A0E]/80 hover:border-[#C2610F]/40'
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                  {fieldError('typesProduits')}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#2C1A0E]/10 bg-white/80 p-4">
                  <input
                    type="checkbox"
                    checked={accepteCGU}
                    onChange={(e) => {
                      setAccepteCGU(e.target.checked);
                      clearField('cgu');
                    }}
                    className="mt-2 h-4 w-4 shrink-0 rounded border-[#2C1A0E]/25 text-[#C2610F] focus:ring-[#C2610F]/30"
                  />
                  <span className="font-ui text-sm text-[#2C1A0E]/85">
                    J’accepte les{' '}
                    <Link
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[#C2610F] underline decoration-[#C2610F]/35 underline-offset-2"
                    >
                      conditions générales d’utilisation
                    </Link>{' '}
                    et la politique de confidentialité.
                  </span>
                </label>
                {fieldError('cgu')}
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="order-2 rounded-full border border-[#2C1A0E]/15 bg-white px-6 py-3 font-ui text-sm font-semibold text-[#2C1A0E] transition hover:bg-[#FFF7EA] sm:order-1"
                >
                  Retour
                </button>
              ) : (
                <span className="hidden sm:block sm:w-24" />
              )}
              {step < 3 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="order-1 rounded-full bg-[#C2610F] px-8 py-3 font-ui text-sm font-semibold text-white shadow-[0_12px_32px_rgba(194,97,15,.28)] transition hover:bg-[#a6500c] sm:order-2 sm:ml-auto"
                >
                  Suivant
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={chargement}
                  className="order-1 rounded-full bg-[#C2610F] px-8 py-3 font-ui text-sm font-semibold text-white shadow-[0_12px_32px_rgba(194,97,15,.28)] transition hover:bg-[#a6500c] disabled:cursor-not-allowed disabled:opacity-55 sm:order-2 sm:ml-auto"
                >
                  {chargement ? 'Inscription…' : 'Créer mon compte'}
                </button>
              )}
            </div>
          </form>

          <p className="mt-10 text-center font-ui text-sm text-[#2C1A0E]/65">
            Déjà un compte ?{' '}
            <Link
              href="/login"
              className="font-semibold text-[#C2610F] underline decoration-[#C2610F]/35 underline-offset-2 hover:decoration-[#C2610F]"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
