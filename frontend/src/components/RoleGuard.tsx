'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { isAuthenticated } from '@/services/auth';

/** Accueil de chaque rôle après connexion. */
export function accueilPourRole(role?: string): string {
  if (role === 'admin') return '/admin-dashboard';
  if (role === 'livreur') return '/livreur';
  return '/catalogue';
}

// Pages accessibles en plus de l'espace du rôle (connexion, mentions légales, suivi d'une commande)
const COMMUNES = ['/login', '/mot-de-passe-oublie', '/cookies', '/privacy', '/terms', '/refund', '/commande/'];

const ESPACES: Record<string, string[]> = {
  admin: ['/admin-', '/commande-admin'],
  livreur: ['/livreur'],
};

/** true si `pathname` fait partie de l'espace du rôle (ou des pages communes). */
export function cheminAutorise(role: string | undefined, pathname: string): boolean {
  const espace = role ? ESPACES[role] : undefined;
  if (!espace) return true; // client / visiteur : site public
  return [...espace, ...COMMUNES].some((p) => pathname === p.replace(/\/$/, '') || pathname.startsWith(p));
}

/**
 * Sépare les espaces : un admin ne voit que sa gestion, un livreur que ses livraisons.
 * Les clients et visiteurs gardent le site complet.
 */
export default function RoleGuard() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const zoneAdmin = ESPACES.admin.some((p) => pathname.startsWith(p));
    if (!user) {
      // Un jeton existe : le profil est en cours de chargement, on attend
      if (isAuthenticated()) return;
      // Visiteur non connecté devant une page admin : connexion puis retour sur la page demandée
      if (zoneAdmin) router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (zoneAdmin && user.role !== 'admin') {
      // Client ou livreur sur une page admin : retour dans son propre espace
      router.replace(accueilPourRole(user.role));
      return;
    }
    if (!cheminAutorise(user.role, pathname)) router.replace(accueilPourRole(user.role));
  }, [loading, user, pathname, router]);

  return null;
}
