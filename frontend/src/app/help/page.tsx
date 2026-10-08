'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function HelpPage() {
  const helpTopics = [
    {
      icon: '🛒',
      title: 'Passer une commande',
      description: 'Apprenez comment commander vos plats préférés en quelques clics',
      link: '/faq'
    },
    {
      icon: '🚚',
      title: 'Suivre ma livraison',
      description: 'Découvrez comment suivre votre commande en temps réel',
      link: '/faq'
    },
    {
      icon: '💳',
      title: 'Modes de paiement',
      description: 'Tous les moyens de paiement acceptés et comment les utiliser',
      link: '/faq'
    },
    {
      icon: '↩️',
      title: 'Retours et remboursements',
      description: 'Politique de retour et procédure de remboursement',
      link: '/refund'
    },
    {
      icon: '👤',
      title: 'Gérer mon compte',
      description: 'Créer un compte, modifier vos informations, réinitialiser votre mot de passe',
      link: '/faq'
    },
    {
      icon: '🍽️',
      title: 'Allergènes et régimes spéciaux',
      description: 'Informations sur les allergènes et options végétariennes/véganes',
      link: '/faq'
    }
  ];

  const quickLinks = [
    { text: 'Questions fréquentes', href: '/faq' },
    { text: 'Nous contacter', href: '/contact' },
    { text: 'Conditions générales', href: '/terms' },
    { text: 'Politique de confidentialité', href: '/privacy' }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12 text-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* En-tête */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Centre d&apos;aide</h1>
              <p className="text-xl text-gray-600">
                Trouvez l&apos;aide dont vous avez besoin rapidement et facilement
              </p>
            </div>

            {/* Barre de recherche */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher dans le centre d'aide..."
                  className="w-full px-6 py-4 pl-12 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg text-gray-900 bg-white"
                />
                <svg
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Sujets d'aide */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {helpTopics.map((topic, index) => (
                <Link
                  key={index}
                  href={topic.link}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow group"
                >
                  <div className="text-4xl mb-4">{topic.icon}</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-orange-500 transition-colors">
                    {topic.title}
                  </h3>
                  <p className="text-gray-600">{topic.description}</p>
                </Link>
              ))}
            </div>

            {/* Liens rapides */}
            <section className="bg-white rounded-lg shadow-md p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Liens rapides</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickLinks.map((link, index) => (
                  <Link
                    key={index}
                    href={link.href}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
                  >
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-gray-800 font-medium">{link.text}</span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Contact */}
            <section className="bg-orange-500 text-white rounded-lg shadow-md p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Besoin d&apos;aide supplémentaire ?</h2>
              <p className="text-xl mb-6">
                Notre équipe de support est disponible 7j/7 pour vous aider
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/contact"
                  className="bg-white text-orange-500 font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Contacter le support
                </a>
                <a
                  href="tel:+33123456789"
                  className="bg-transparent border-2 border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white hover:text-orange-500 transition-colors"
                >
                  Appeler : 01 23 45 67 89
                </a>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
