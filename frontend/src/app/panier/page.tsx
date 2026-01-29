'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

const fraisLivraison = 5.00;

export default function PanierPage() {
  const { items: cartItems, updateQuantity, removeItem } = useCart();

  const sousTotal = cartItems.reduce(
    (total, item) => total + item.prixUnitaire * item.quantite,
    0
  );
  const total = sousTotal + fraisLivraison;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12 text-gray-900">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-800 mb-8">Votre Panier</h1>

          {cartItems.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-xl text-gray-600 mb-6">Votre panier est vide.</p>
              <Link
                href="/menu"
                className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Voir le menu
              </Link>
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Colonne gauche - Articles du panier */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => {
                const totalItem = item.prixUnitaire * item.quantite;
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg shadow-md p-6 flex items-center gap-6"
                  >
                    {/* Image ronde */}
                    <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.nom}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Informations du produit */}
                    <div className="flex-grow">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {item.nom}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {item.prixUnitaire.toFixed(2)} € / unité
                      </p>

                      {/* Sélecteur de quantité */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantite - 1)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            −
                          </button>
                          <span className="px-4 py-2 text-gray-800 font-medium">
                            {item.quantite}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantite + 1)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            +
                          </button>
                        </div>

                        <span className="text-lg font-bold text-gray-800">
                          {totalItem.toFixed(2)} €
                        </span>
                      </div>
                    </div>

                    {/* Bouton supprimer */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-2"
                      aria-label="Supprimer"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Colonne droite - Récapitulatif */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Récapitulatif de la commande
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Sous-total</span>
                    <span>{sousTotal.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Frais de livraison</span>
                    <span>{fraisLivraison.toFixed(2)} €</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-800">Total</span>
                    <span className="text-xl font-bold text-gray-800">
                      {total.toFixed(2)} €
                    </span>
                  </div>
                </div>

                <button type="button" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-lg">
                  Commander
                </button>
              </div>
            </div>
          </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

