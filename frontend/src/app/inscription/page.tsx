'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register } from '@/services/auth';

export default function InscriptionPage() {
  const router = useRouter();
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    motDePasse: '',
    confirmationMotDePasse: '',
    accepteCGU: false,
    adresse: '',
    ville: '',
    codePostal: '',
    pays: 'France',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur('');
    if (form.motDePasse !== form.confirmationMotDePasse) {
      setErreur('Les mots de passe ne correspondent pas.');
      return;
    }
    if (!form.accepteCGU) {
      setErreur('Vous devez accepter les conditions générales d\'utilisation.');
      return;
    }
    setChargement(true);
    try {
      const res = await register({
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        email: form.email.trim().toLowerCase(),
        telephone: form.telephone.trim(),
        motDePasse: form.motDePasse,
        confirmationMotDePasse: form.confirmationMotDePasse,
        accepteCGU: form.accepteCGU,
        ...(form.adresse.trim() && form.ville.trim() && form.codePostal.trim()
          ? {
              adresse: {
                adresse: form.adresse.trim(),
                ville: form.ville.trim(),
                codePostal: form.codePostal.trim(),
                pays: form.pays || 'France',
              },
            }
          : undefined),
      });
      if (res.success) {
        router.push('/menu');
        router.refresh();
        return;
      }
      setErreur(res.message || 'Une erreur est survenue.');
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur de connexion.');
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <img src="/logo-afro-eats.png" alt="Afro-Eats" className="h-12 mx-auto" />
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">Créer un compte</h1>
          <p className="mt-1 text-sm text-neutral-500">Inscrivez-vous pour commander et gérer vos préférences.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-neutral-100 dark:bg-neutral-800/50 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">
          {erreur && (
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
              {erreur}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="nom" className="block text-sm font-medium text-[var(--foreground)] mb-1">Nom</label>
              <input
                id="nom"
                name="nom"
                type="text"
                value={form.nom}
                onChange={handleChange}
                required
                minLength={2}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-[var(--foreground)]"
                placeholder="Dupont"
              />
            </div>
            <div>
              <label htmlFor="prenom" className="block text-sm font-medium text-[var(--foreground)] mb-1">Prénom</label>
              <input
                id="prenom"
                name="prenom"
                type="text"
                value={form.prenom}
                onChange={handleChange}
                required
                minLength={2}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-[var(--foreground)]"
                placeholder="Marie"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)] mb-1">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-[var(--foreground)]"
              placeholder="vous@exemple.com"
            />
          </div>

          <div>
            <label htmlFor="telephone" className="block text-sm font-medium text-[var(--foreground)] mb-1">Téléphone</label>
            <input
              id="telephone"
              name="telephone"
              type="tel"
              value={form.telephone}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-[var(--foreground)]"
              placeholder="06 12 34 56 78"
            />
          </div>

          <div>
            <label htmlFor="motDePasse" className="block text-sm font-medium text-[var(--foreground)] mb-1">Mot de passe</label>
            <input
              id="motDePasse"
              name="motDePasse"
              type="password"
              value={form.motDePasse}
              onChange={handleChange}
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-[var(--foreground)]"
              placeholder="••••••••"
            />
            <p className="mt-0.5 text-xs text-neutral-500">Minimum 6 caractères.</p>
          </div>

          <div>
            <label htmlFor="confirmationMotDePasse" className="block text-sm font-medium text-[var(--foreground)] mb-1">Confirmer le mot de passe</label>
            <input
              id="confirmationMotDePasse"
              name="confirmationMotDePasse"
              type="password"
              value={form.confirmationMotDePasse}
              onChange={handleChange}
              required
              autoComplete="new-password"
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-[var(--foreground)]"
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-3 pt-1">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Adresse de livraison (optionnel)</p>
            <div>
              <input
                name="adresse"
                type="text"
                value={form.adresse}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-[var(--foreground)]"
                placeholder="Numéro et rue"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                name="codePostal"
                type="text"
                value={form.codePostal}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-[var(--foreground)]"
                placeholder="CP"
              />
              <input
                name="ville"
                type="text"
                value={form.ville}
                onChange={handleChange}
                className="col-span-2 w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-[var(--foreground)]"
                placeholder="Ville"
              />
            </div>
          </div>

          <div className="flex items-start gap-2">
            <input
              id="accepteCGU"
              name="accepteCGU"
              type="checkbox"
              checked={form.accepteCGU}
              onChange={handleChange}
              required
              className="mt-1 rounded border-neutral-300 text-orange-500 focus:ring-orange-500"
            />
            <label htmlFor="accepteCGU" className="text-sm text-[var(--foreground)]">
              J&apos;accepte les{' '}
              <Link href="/terms" className="text-orange-500 hover:underline" target="_blank" rel="noopener noreferrer">
                conditions générales d&apos;utilisation
              </Link>
              .
            </label>
          </div>

          <button
            type="submit"
            disabled={chargement}
            className="w-full py-2.5 px-4 rounded-lg font-medium bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {chargement ? 'Inscription…' : 'S\'inscrire'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Vous avez déjà un compte ?{' '}
          <Link href="/login" className="text-orange-500 hover:underline">Se connecter</Link>
          {' · '}
          <Link href="/" className="text-orange-500 hover:underline">Accueil</Link>
        </p>
      </div>
    </div>
  );
}
