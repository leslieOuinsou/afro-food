'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import NotificationBell from '@/components/NotificationBell';
import { VendorStatusBar } from '@/components/VendorStatusBar';
import { FAVORITES_STORAGE_KEY, FAVORITES_UPDATED_EVENT } from '@/lib/favoritesStorage';
import type { User } from '@/services/auth';

function readFavoritesCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

function initials(u: User): string {
  const p = (u.prenom || '').trim();
  const n = (u.nom || '').trim();
  const a = p.charAt(0);
  const b = n.charAt(0) || p.charAt(1);
  const s = (a + b).toUpperCase();
  return s || 'AE';
}

function SearchIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.35-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

const centerLinks: { href: string; label: string }[] = [
  { href: '/catalogue', label: 'Menu' },
  { href: '/about', label: 'Histoire' },
  { href: '/contact', label: 'Contact' },
];

const livreurMenuItems: { href: string; label: string }[] = [
  { href: '/livreur', label: 'Mes livraisons' },
];

const vendorMenuItems: { href: string; label: string }[] = [
  { href: '/admin-dashboard', label: 'Tableau de bord' },
  { href: '/commande-admin', label: 'Commandes clients' },
  { href: '/admin-plats', label: 'Gestion des plats' },
  { href: '/admin-promos', label: 'Codes promo' },
  { href: '/admin-messagerie', label: 'Messagerie' },
  { href: '/admin-parametres', label: 'Paramètres' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isVendor: estGestionnaire, logout } = useAuth();
  const isLivreur = user?.role === 'livreur';
  // Admin et livreur ont un espace dédié (menu et bouton à la place de l'espace client)
  const isVendor = estGestionnaire || isLivreur;
  const menuItems = isLivreur ? livreurMenuItems : vendorMenuItems;
  const lienEspace = isLivreur ? { href: '/livreur', label: 'Mes livraisons' } : { href: '/admin-dashboard', label: 'Dashboard' };
  // L'admin gère les plats depuis son espace : pas de lien vers le catalogue client
  // Admin et livreur : pas de navigation client (menu, recherche, favoris, panier)
  const liensCentre = isVendor ? [] : centerLinks;
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantite, 0);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [favCount, setFavCount] = useState(0);

  const userMenuRef = useRef<HTMLDivElement>(null);

  const syncFavorites = useCallback(() => {
    setFavCount(readFavoritesCount());
  }, []);

  useEffect(() => {
    syncFavorites();
    const onFav = () => syncFavorites();
    window.addEventListener(FAVORITES_UPDATED_EVENT, onFav);
    window.addEventListener('storage', onFav);
    return () => {
      window.removeEventListener(FAVORITES_UPDATED_EVENT, onFav);
      window.removeEventListener('storage', onFav);
    };
  }, [syncFavorites]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!userMenuRef.current?.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (drawerOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  const closeDrawer = () => setDrawerOpen(false);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    closeDrawer();
    router.push(isVendor ? '/login' : '/');
    router.refresh();
  };

  const linkClass = (href: string) => {
    const active = pathname === href || (href !== '/' && pathname.startsWith(href));
    return `text-sm font-semibold tracking-wide transition ${
      active ? 'text-af-ocre' : 'text-af-mud hover:text-af-ocre'
    }`;
  };

  const showGuestAuth = !loading && !user;
  const showAccountMenu = !loading && !!user;

  const iconBtnClass =
    'flex h-10 w-10 items-center justify-center rounded-xl text-af-wood/90 transition hover:bg-earth-100 hover:text-af-ocre';

  return (
    <>
      <div className="sticky top-0 z-[100]">
        <VendorStatusBar />
        <header
          className={`font-ui border-b border-earth-200/90 bg-af-ivory text-af-wood transition-shadow duration-300 ${
            scrolled ? 'shadow-[0_8px_28px_rgba(30,13,2,0.08)]' : 'shadow-none'
          }`}
        >
          <div className="relative mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 lg:px-8">
            <Link
              href={isVendor ? lienEspace.href : '/'}
              className="flex shrink-0 items-center gap-2.5"
              onClick={closeDrawer}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-af-wood/5 ring-1 ring-af-wood/10">
                <img
                  src="/logo-afro-eats.png"
                  alt="Afro-food"
                  className="h-8 w-8 object-contain"
                />
              </div>
              <span className="font-title text-xl font-bold tracking-tight text-af-wood sm:text-[1.65rem]">
                Afro-food
              </span>
            </Link>

            <nav className="hidden items-center gap-10 md:flex" aria-label="Navigation principale">
              {liensCentre.map((l) => (
                <Link key={l.href} href={l.href} className={linkClass(l.href)}>
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="hidden items-center gap-1 md:flex">
              {!isVendor && (
              <>
              <Link href="/recherche" className={iconBtnClass} aria-label="Rechercher" title="Recherche">
                <SearchIcon />
              </Link>
              <Link
                href="/dashboard?tab=favoris"
                className={`relative ${iconBtnClass}`}
                aria-label={`Favoris${favCount > 0 ? `, ${favCount}` : ''}`}
              >
                <HeartIcon />
                {favCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-af-ocre px-1 text-[10px] font-bold text-af-ivory ring-2 ring-af-ivory">
                    {favCount > 99 ? '99+' : favCount}
                  </span>
                )}
              </Link>
              {user?.role === 'client' && <NotificationBell role="client" />}
              <Link
                href="/panier"
                className={`relative ${iconBtnClass}`}
                aria-label={`Panier${cartCount > 0 ? `, ${cartCount} articles` : ''}`}
              >
                <CartIcon />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-af-ocre px-1 text-[10px] font-bold text-af-ivory ring-2 ring-af-ivory">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
              </>
              )}

              {loading && (
                <div className="ml-1 flex items-center gap-2">
                  <div className="h-9 w-24 animate-pulse rounded-full bg-earth-100" />
                  <div className="h-9 w-24 animate-pulse rounded-full bg-earth-100" />
                </div>
              )}

              {showGuestAuth && (
                <div className="ml-2 flex items-center gap-2">
                  <Link
                    href="/login"
                    className="font-ui rounded-full border border-earth-200 bg-white px-5 py-2 text-sm font-semibold text-af-wood shadow-sm transition hover:border-af-ocre/40 hover:bg-earth-100"
                  >
                    Se connecter
                  </Link>
                  <Link
                    href="/inscription"
                    className="font-ui rounded-full bg-af-wood px-5 py-2 text-sm font-semibold text-af-ivory shadow-sm transition hover:bg-af-wood/90"
                  >
                    S&apos;inscrire
                  </Link>
                </div>
              )}

              {showAccountMenu && user && (
                <>
                  {isVendor && (
                    <Link
                      href={lienEspace.href}
                      className="font-ui ml-2 rounded-full border border-af-ocre/35 bg-af-ocre/10 px-4 py-2 text-sm font-bold text-af-ocre transition hover:bg-af-ocre/15"
                    >
                      {lienEspace.label}
                    </Link>
                  )}
                  <div className="relative ml-1" ref={userMenuRef}>
                    <button
                      type="button"
                      onClick={() => setUserMenuOpen((o) => !o)}
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold uppercase ring-2 ring-offset-2 ring-offset-af-ivory transition ${
                        isVendor
                          ? 'bg-af-saffron text-af-wood ring-af-ocre/35'
                          : 'bg-af-wood text-af-ivory ring-af-wood/20'
                      }`}
                      aria-expanded={userMenuOpen}
                      aria-haspopup="menu"
                      aria-label="Menu compte"
                    >
                      {initials(user)}
                    </button>
                    {userMenuOpen && (
                      <div
                        role="menu"
                        className="absolute right-0 top-12 z-[110] min-w-[220px] overflow-hidden rounded-2xl border border-earth-200 bg-white py-2 shadow-xl ring-1 ring-af-wood/5"
                      >
                        {isVendor ? (
                          <>
                            {!isLivreur && (
                              <Link
                                role="menuitem"
                                href="/livreur"
                                className="block px-4 py-2.5 text-sm font-medium text-af-wood hover:bg-earth-100"
                                onClick={() => setUserMenuOpen(false)}
                              >
                                Espace livreur
                              </Link>
                            )}
                            {menuItems.map((item) => (
                              <Link
                                key={item.href}
                                role="menuitem"
                                href={item.href}
                                className="block px-4 py-2.5 text-sm font-medium text-af-wood hover:bg-earth-100"
                                onClick={() => setUserMenuOpen(false)}
                              >
                                {item.label}
                              </Link>
                            ))}
                            <div className="my-1 border-t border-earth-100" />
                            <button
                              type="button"
                              role="menuitem"
                              className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-700 hover:bg-red-50"
                              onClick={handleLogout}
                            >
                              Déconnexion
                            </button>
                          </>
                        ) : (
                          <>
                            <Link
                              role="menuitem"
                              href="/dashboard?tab=profil"
                              className="block px-4 py-2.5 text-sm font-medium text-af-wood hover:bg-earth-100"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              Profil
                            </Link>
                            <Link
                              role="menuitem"
                              href="/dashboard?tab=commandes"
                              className="block px-4 py-2.5 text-sm font-medium text-af-wood hover:bg-earth-100"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              Commandes
                            </Link>
                            {user?.role === 'livreur' && (
                              <Link
                                role="menuitem"
                                href="/livreur"
                                className="block px-4 py-2.5 text-sm font-medium text-af-wood hover:bg-earth-100"
                                onClick={() => setUserMenuOpen(false)}
                              >
                                Espace livreur
                              </Link>
                            )}
                            <Link
                              role="menuitem"
                              href="/dashboard?tab=favoris"
                              className="block px-4 py-2.5 text-sm font-medium text-af-wood hover:bg-earth-100"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              Favoris
                            </Link>
                            <Link
                              role="menuitem"
                              href="/dashboard?tab=profil"
                              className="block px-4 py-2.5 text-sm font-medium text-af-wood hover:bg-earth-100"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              Adresses
                            </Link>
                            <button
                              type="button"
                              role="menuitem"
                              className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-700 hover:bg-red-50"
                              onClick={handleLogout}
                            >
                              Déconnexion
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 md:hidden">
              {user?.role === 'client' && <NotificationBell role="client" />}
              {!isVendor && (
              <Link href="/panier" className={`relative ${iconBtnClass}`} aria-label="Panier">
                <CartIcon />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-af-ocre px-0.5 text-[9px] font-bold text-af-ivory">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
              )}
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-earth-200 text-af-wood hover:bg-earth-100"
                aria-label={drawerOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                aria-expanded={drawerOpen}
                onClick={() => setDrawerOpen((v) => !v)}
              >
                {drawerOpen ? (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </header>
      </div>

      <div
        className={`fixed inset-0 z-[105] overflow-hidden md:hidden ${drawerOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!drawerOpen}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-af-wood/40 transition-opacity duration-300 ${
            drawerOpen ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label="Fermer le menu"
          onClick={closeDrawer}
        />
        <aside
          className={`absolute right-0 top-0 flex h-full w-[min(100%,20rem)] flex-col border-l border-earth-200 bg-af-ivory shadow-2xl transition-transform duration-300 ease-out ${
            drawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          id="mobile-drawer"
        >
          <div className="flex items-center justify-between border-b border-earth-200 px-4 py-4">
            <span className="font-ui font-semibold text-af-wood">Menu</span>
            <button
              type="button"
              className="rounded-lg p-2 text-af-wood hover:bg-earth-100"
              onClick={closeDrawer}
              aria-label="Fermer"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4" aria-label="Menu mobile">
            {liensCentre.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-xl px-4 py-3 text-base font-semibold ${linkClass(l.href)}`}
                onClick={closeDrawer}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/recherche"
              className="mt-2 flex items-center gap-3 rounded-xl px-4 py-3 text-af-mud hover:bg-earth-100"
              onClick={closeDrawer}
            >
              <SearchIcon />
              Recherche
            </Link>
            <Link
              href="/dashboard?tab=favoris"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-af-mud hover:bg-earth-100"
              onClick={closeDrawer}
            >
              <HeartIcon />
              Favoris
              {favCount > 0 && (
                <span className="ml-auto rounded-full bg-af-ocre px-2 py-0.5 text-xs font-bold text-af-ivory">
                  {favCount}
                </span>
              )}
            </Link>

            {showGuestAuth && (
              <div className="mt-4 flex flex-col gap-2 border-t border-earth-200 pt-4">
                <Link
                  href="/login"
                  className="rounded-full border border-earth-200 bg-white py-3 text-center text-sm font-semibold text-af-wood"
                  onClick={closeDrawer}
                >
                  Se connecter
                </Link>
                <Link
                  href="/inscription"
                  className="rounded-full bg-af-wood py-3 text-center text-sm font-semibold text-af-ivory"
                  onClick={closeDrawer}
                >
                  S&apos;inscrire
                </Link>
              </div>
            )}

            {showAccountMenu && user && (
              <div className="mt-4 flex flex-col gap-1 border-t border-earth-200 pt-4">
                {isVendor && (
                  <Link
                    href={lienEspace.href}
                    className="rounded-xl px-4 py-3 text-sm font-bold text-af-ocre hover:bg-earth-100"
                    onClick={closeDrawer}
                  >
                    {lienEspace.label}
                  </Link>
                )}
                {isVendor
                  ? menuItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="rounded-xl px-4 py-3 text-sm font-medium text-af-wood hover:bg-earth-100"
                        onClick={closeDrawer}
                      >
                        {item.label}
                      </Link>
                    ))
                  : (
                      <>
                        <Link
                          href="/dashboard?tab=profil"
                          className="rounded-xl px-4 py-3 text-sm font-medium text-af-wood hover:bg-earth-100"
                          onClick={closeDrawer}
                        >
                          Profil
                        </Link>
                        <Link
                          href="/dashboard?tab=commandes"
                          className="rounded-xl px-4 py-3 text-sm font-medium text-af-wood hover:bg-earth-100"
                          onClick={closeDrawer}
                        >
                          Commandes
                        </Link>
                        <Link
                          href="/dashboard?tab=favoris"
                          className="rounded-xl px-4 py-3 text-sm font-medium text-af-wood hover:bg-earth-100"
                          onClick={closeDrawer}
                        >
                          Favoris
                        </Link>
                        <Link
                          href="/dashboard?tab=profil"
                          className="rounded-xl px-4 py-3 text-sm font-medium text-af-wood hover:bg-earth-100"
                          onClick={closeDrawer}
                        >
                          Adresses
                        </Link>
                      </>
                    )}
                <button
                  type="button"
                  className="mt-2 w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-red-700 hover:bg-red-50"
                  onClick={() => {
                    closeDrawer();
                    handleLogout();
                  }}
                >
                  Déconnexion
                </button>
              </div>
            )}
          </nav>
        </aside>
      </div>
    </>
  );
}
