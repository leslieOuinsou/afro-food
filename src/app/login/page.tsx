'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('login');

  return (
    <div className="min-h-screen flex">
      {/* Section gauche - Formulaire */}
      <div className="w-full lg:w-3/5 flex flex-col justify-center px-8 py-12 bg-white">
        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('login')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'login'
                ? 'bg-gray-100 text-gray-800'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Connexion
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'signup'
                ? 'bg-gray-100 text-gray-800'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            S&apos;inscrire
          </button>
        </div>

        {/* Contenu du formulaire */}
        <div className="max-w-md">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Bienvenue!</h1>
          <p className="text-gray-600 mb-8">
            Connectez-vous à votre compte pour continuer.
          </p>

          {/* Formulaire de connexion */}
          {activeTab === 'login' ? (
            <>
              {/* Email ou téléphone */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email ou téléphone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Email ou téléphone"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Mot de passe"
                  />
                </div>
              </div>

              {/* Mot de passe oublié */}
              <div className="mb-6 text-right">
                <a href="#" className="text-orange-500 hover:text-orange-600 text-sm">
                  Mot de passe oublié?
                </a>
              </div>

              {/* Bouton Se connecter */}
              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors mb-6">
                Se connecter
              </button>

              {/* Séparateur OU */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OU</span>
                </div>
              </div>

              {/* Boutons de connexion sociale */}
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-3 px-6 hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="font-medium text-gray-700">Continuer avec Facebook</span>
                </button>
                <button className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-3 px-6 hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="font-medium text-gray-700">Continuer avec Google</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Formulaire d'inscription - à compléter si nécessaire */}
              <p className="text-gray-600">Formulaire d&apos;inscription à venir...</p>
            </>
          )}
        </div>
      </div>

      {/* Section droite - Image */}
      <div className="hidden lg:block lg:w-2/5 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80')",
          }}
        >
          <div className="absolute inset-0 bg-black/20"></div>
        </div>
      </div>

      {/* Made with en bas à gauche */}
      <div className="fixed bottom-4 left-4 flex items-center gap-2 text-sm text-gray-500">
        <span>Made with</span>
        <div className="w-4 h-4 bg-purple-600 rounded"></div>
      </div>
    </div>
  );
}

