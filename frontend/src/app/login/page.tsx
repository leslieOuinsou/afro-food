'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/services/auth';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/admin-dashboard';

  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur('');
    setChargement(true);
    try {
      const res = await login(email.trim(), motDePasse);
      if (res.success) {
        router.push(redirect);
        router.refresh();
        return;
      }
      setErreur(res.message || 'Email ou mot de passe incorrect.');
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur de connexion.');
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <img src="/logo-afro-eats.png" alt="Afro-Eats" className="h-12 mx-auto" />
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">Connexion admin</h1>
          <p className="mt-1 text-sm text-neutral-500">Utilisez votre compte pour accéder à l’administration.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-neutral-100 dark:bg-neutral-800/50 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">
          {erreur && (
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
              {erreur}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-[var(--foreground)]"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label htmlFor="motDePasse" className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Mot de passe
            </label>
            <input
              id="motDePasse"
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-[var(--foreground)]"
            />
          </div>
          <button
            type="submit"
            disabled={chargement}
            className="w-full py-2.5 px-4 rounded-lg font-medium bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {chargement ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          <Link href="/" className="text-orange-500 hover:underline">Retour à l’accueil</Link>
        </p>
      </div>
    </div>
  );
}
