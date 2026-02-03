'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';

export default function Header() {
  const pathname = usePathname();
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantite, 0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinkClass = (active: boolean) =>
    `flex items-center gap-2 transition-colors font-medium ${
      active ? 'text-orange-500' : 'text-gray-800 hover:text-orange-500'
    }`;

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between relative">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3" onClick={closeMenu}>
          <div className="w-12 h-12 flex items-center justify-center">
            <img 
              src="/logo-afro-eats.png" 
              alt="Afro-Eats Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-2xl font-bold text-gray-800">Afro-Eats</span>
        </Link>

        {/* Toggle button (mobile) */}
        <button
          type="button"
          className="md:hidden p-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
          aria-label="Ouvrir le menu"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-expanded={isMenuOpen}
          aria-controls="primary-navigation"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Navigation Links */}
        <div
          className={`${
            isMenuOpen ? 'flex' : 'hidden'
          } absolute left-0 right-0 top-[72px] mx-4 rounded-2xl bg-white shadow-lg border border-gray-100 flex-col gap-4 px-6 py-6 md:static md:mx-0 md:flex md:flex-row md:items-center md:gap-6 md:shadow-none md:border-0`}
          id="primary-navigation"
        >
          <Link 
            href="/" 
            className={navLinkClass(pathname === '/')}
            onClick={closeMenu}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
          </Link>
          <Link 
            href="/menu" 
            className={navLinkClass(pathname === '/menu')}
            onClick={closeMenu}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Menu
          </Link>
          <Link 
            href="/panier" 
            className={navLinkClass(pathname === '/panier')}
            aria-label={`Panier${cartCount > 0 ? `, ${cartCount} article${cartCount > 1 ? 's' : ''}` : ''}`}
            onClick={closeMenu}
          >
            <span className="relative inline-flex">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span
                  className="absolute -top-2.5 -right-2.5 min-w-[1.25rem] h-5 px-1 flex items-center justify-center bg-orange-500 text-white text-xs font-bold rounded-full ring-2 ring-white"
                  aria-hidden
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </span>
            Panier
          </Link>
          <Link 
            href="/contact" 
            className={navLinkClass(pathname === '/contact')}
            onClick={closeMenu}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Contact
          </Link>
        </div>
      </nav>
    </header>
  );
}

