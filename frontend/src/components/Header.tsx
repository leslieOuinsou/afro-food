'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';

export default function Header() {
  const pathname = usePathname();
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.quantite, 0);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-12 h-12 flex items-center justify-center">
            <img 
              src="/logo-afro-eats.png" 
              alt="Afro-Eats Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-2xl font-bold text-gray-800">Afro-Eats</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-6">
          <Link 
            href="/" 
            className={`flex items-center gap-2 transition-colors font-medium ${
              pathname === '/' ? 'text-orange-500' : 'text-gray-800 hover:text-orange-500'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Home
          </Link>
          <Link 
            href="/menu" 
            className={`flex items-center gap-2 transition-colors font-medium ${
              pathname === '/menu' ? 'text-orange-500' : 'text-gray-800 hover:text-orange-500'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Menu
          </Link>
          <Link 
            href="/panier" 
            className={`flex items-center gap-2 transition-colors font-medium ${
              pathname === '/panier' ? 'text-orange-500' : 'text-gray-800 hover:text-orange-500'
            }`}
            aria-label={`Panier${cartCount > 0 ? `, ${cartCount} article${cartCount > 1 ? 's' : ''}` : ''}`}
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
            className={`flex items-center gap-2 transition-colors font-medium ${
              pathname === '/contact' ? 'text-orange-500' : 'text-gray-800 hover:text-orange-500'
            }`}
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

