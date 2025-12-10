'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const orderItems = [
  {
    id: 1,
    nom: 'Poulet Yassa',
    quantite: 1,
    prix: 15.50,
    image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80'
  },
  {
    id: 2,
    nom: 'Thiéboudienne',
    quantite: 2,
    prix: 12.00,
    image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80'
  },
  {
    id: 3,
    nom: 'Attiéké Poisson',
    quantite: 1,
    prix: 14.75,
    image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80'
  }
];

const sousTotal = orderItems.reduce((total, item) => total + (item.prix * item.quantite), 0);
const fraisLivraison = 5.00;
const total = sousTotal + fraisLivraison;

export default function FinaliserCommandePage() {
  const [deliveryOption, setDeliveryOption] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('credit-card');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-800 mb-8">Finaliser la commande</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Colonne gauche - Formulaire */}
            <div className="lg:col-span-2 space-y-8">
              {/* Détails de livraison */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Détails de livraison</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom Complet
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        defaultValue="John Doe"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        defaultValue="123 Rue Principale"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ville
                    </label>
                    <input
                      type="text"
                      defaultValue="Paris"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Code Postal
                    </label>
                    <input
                      type="text"
                      defaultValue="75001"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <input
                        type="tel"
                        defaultValue="+33 6 12 34 56 78"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        type="email"
                        defaultValue="john.doe@example.com"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Options de livraison */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Options de livraison</h2>
                <div className="space-y-4">
                  <label
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      deliveryOption === 'standard'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery"
                      value="standard"
                      checked={deliveryOption === 'standard'}
                      onChange={(e) => setDeliveryOption(e.target.value)}
                      className="w-5 h-5 text-orange-500 focus:ring-orange-500"
                    />
                    <div className="ml-4 flex-grow">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-800">Standard</span>
                        <span className="font-semibold text-gray-800">5.00 €</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Arrive en 3-5 jours ouvrables</p>
                    </div>
                  </label>
                  <label
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      deliveryOption === 'express'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery"
                      value="express"
                      checked={deliveryOption === 'express'}
                      onChange={(e) => setDeliveryOption(e.target.value)}
                      className="w-5 h-5 text-orange-500 focus:ring-orange-500"
                    />
                    <div className="ml-4 flex-grow">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-800">Express</span>
                        <span className="font-semibold text-gray-800">8.00 €</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Arrive en 1-2 jours ouvrables</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Méthode de paiement */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Méthode de paiement</h2>
                <div className="space-y-4">
                  <label
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === 'credit-card'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="credit-card"
                      checked={paymentMethod === 'credit-card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5 text-orange-500 focus:ring-orange-500"
                    />
                    <div className="ml-4 flex items-center gap-3">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span className="font-semibold text-gray-800">Carte de crédit</span>
                    </div>
                  </label>
                  <label
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === 'mobile-money'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="mobile-money"
                      checked={paymentMethod === 'mobile-money'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5 text-orange-500 focus:ring-orange-500"
                    />
                    <div className="ml-4 flex items-center gap-3">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="font-semibold text-gray-800">Mobile Money</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Colonne droite - Récapitulatif */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Récapitulatif de commande</h2>

                {/* Liste des articles */}
                <div className="space-y-4 mb-6">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.nom}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-semibold text-gray-800">{item.nom}</h3>
                        <p className="text-sm text-gray-600">Quantité: {item.quantite}</p>
                        <p className="text-sm font-semibold text-gray-800 mt-1">
                          {(item.prix * item.quantite).toFixed(2)} €
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Résumé des coûts */}
                <div className="border-t border-gray-200 pt-4 space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Sous-total</span>
                    <span>{sousTotal.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Frais de livraison</span>
                    <span>{fraisLivraison.toFixed(2)} €</span>
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-gray-800">Total</span>
                    <span className="text-2xl font-bold text-gray-800">
                      {total.toFixed(2)} €
                    </span>
                  </div>
                </div>

                {/* Bouton Payer */}
                <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-lg">
                  Payer et Commander
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

