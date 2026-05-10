'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function CareersPage() {
  const positions = [
    {
      title: 'Chef Cuisinier',
      department: 'Cuisine',
      location: 'Paris, France',
      type: 'Temps plein',
      description: 'Nous recherchons un chef cuisinier expérimenté pour préparer nos plats africains authentiques.'
    },
    {
      title: 'Livreur',
      department: 'Livraison',
      location: 'Paris, France',
      type: 'Temps plein / Temps partiel',
      description: 'Rejoignez notre équipe de livraison pour apporter nos délicieux plats à nos clients.'
    },
    {
      title: 'Développeur Full Stack',
      department: 'Technologie',
      location: 'Remote / Paris',
      type: 'Temps plein',
      description: 'Aidez-nous à améliorer notre plateforme en ligne et notre application mobile.'
    },
    {
      title: 'Responsable Marketing',
      department: 'Marketing',
      location: 'Paris, France',
      type: 'Temps plein',
      description: 'Développez notre présence en ligne et créez des campagnes marketing innovantes.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12 text-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* En-tête */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Carrières</h1>
              <p className="text-xl text-gray-600">
                Rejoignez l'équipe Afro-food et faites partie de notre aventure culinaire
              </p>
            </div>

            {/* Section Pourquoi nous rejoindre */}
            <section className="bg-white rounded-lg shadow-md p-8 mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Pourquoi nous rejoindre ?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Équipe dynamique</h3>
                    <p className="text-gray-600">
                      Travaillez avec une équipe passionnée et multiculturelle
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Croissance</h3>
                    <p className="text-gray-600">
                      Opportunités d'évolution et de développement professionnel
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Horaires flexibles</h3>
                    <p className="text-gray-600">
                      Équilibre entre vie professionnelle et personnelle
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Avantages</h3>
                    <p className="text-gray-600">
                      Repas gratuits, assurance santé et autres avantages attractifs
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section Postes ouverts */}
            <section className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Postes ouverts</h2>
              <div className="space-y-4">
                {positions.map((position, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">{position.title}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {position.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {position.department}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {position.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4">{position.description}</p>
                    <button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors">
                      Postuler maintenant
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Section Candidature spontanée */}
            <section className="bg-orange-500 text-white rounded-lg shadow-md p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Candidature spontanée</h2>
              <p className="text-xl mb-6">
                Vous ne trouvez pas le poste qui vous correspond ? Envoyez-nous votre candidature !
              </p>
              <button className="bg-white text-orange-500 font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors">
                Envoyer une candidature
              </button>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
