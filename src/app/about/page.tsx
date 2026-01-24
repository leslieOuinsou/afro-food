'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* En-tête */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">À Propos de Nous</h1>
              <p className="text-xl text-gray-600">
                Découvrez l'histoire et la mission d'Afro-Eats
              </p>
            </div>

            {/* Section Notre Histoire */}
            <section className="bg-white rounded-lg shadow-md p-8 mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Notre Histoire</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Afro-Eats est né d'une passion pour les saveurs authentiques de l'Afrique. 
                  Fondé en 2024, notre mission est de rendre accessible la riche cuisine africaine 
                  à tous, en préservant les recettes traditionnelles transmises de génération en génération.
                </p>
                <p>
                  Nous croyons que la nourriture est bien plus qu'un simple repas - c'est un voyage 
                  culturel, une expérience qui rapproche les gens et célèbre la diversité. Chaque plat 
                  que nous servons raconte une histoire, celle de nos ancêtres, de nos traditions et de 
                  notre amour pour la cuisine.
                </p>
              </div>
            </section>

            {/* Section Notre Mission */}
            <section className="bg-white rounded-lg shadow-md p-8 mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Notre Mission</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Notre mission est simple : offrir des plats africains authentiques, préparés avec 
                  des ingrédients frais et de qualité, livrés directement à votre porte. Nous nous 
                  engageons à :
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Préserver l'authenticité des recettes traditionnelles africaines</li>
                  <li>Utiliser uniquement des ingrédients frais et de qualité supérieure</li>
                  <li>Offrir un service de livraison rapide et fiable</li>
                  <li>Promouvoir la diversité culturelle à travers la cuisine</li>
                  <li>Créer une expérience culinaire mémorable pour chaque client</li>
                </ul>
              </div>
            </section>

            {/* Section Nos Valeurs */}
            <section className="bg-white rounded-lg shadow-md p-8 mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Nos Valeurs</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Qualité</h3>
                  <p className="text-gray-600">
                    Nous sélectionnons rigoureusement chaque ingrédient pour garantir la meilleure qualité.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Authenticité</h3>
                  <p className="text-gray-600">
                    Nous respectons les recettes traditionnelles pour une expérience authentique.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Passion</h3>
                  <p className="text-gray-600">
                    Notre amour pour la cuisine africaine se reflète dans chaque plat que nous préparons.
                  </p>
                </div>
              </div>
            </section>

            {/* Section Contact */}
            <section className="bg-orange-500 text-white rounded-lg shadow-md p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Rejoignez-nous dans cette aventure culinaire</h2>
              <p className="text-xl mb-6">
                Découvrez les saveurs authentiques de l'Afrique, une commande à la fois.
              </p>
              <a
                href="/menu"
                className="inline-block bg-white text-orange-500 font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Découvrir notre menu
              </a>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
