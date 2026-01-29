'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function BlogPage() {
  const articles = [
    {
      id: 1,
      title: 'Les 10 plats africains incontournables à découvrir',
      excerpt: 'Découvrez les saveurs authentiques de l\'Afrique à travers ces plats traditionnels qui ont conquis le monde.',
      author: 'Chef Amara',
      date: '15 Janvier 2025',
      category: 'Cuisine',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80'
    },
    {
      id: 2,
      title: 'L\'histoire du Thieboudienne, le plat national du Sénégal',
      excerpt: 'Plongez dans l\'histoire riche et fascinante de ce plat emblématique de la cuisine sénégalaise.',
      author: 'Marie Diallo',
      date: '10 Janvier 2025',
      category: 'Histoire',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80'
    },
    {
      id: 3,
      title: 'Comment préparer le parfait Jollof Rice à la maison',
      excerpt: 'Apprenez les secrets d\'une recette authentique de Jollof Rice avec nos conseils de chef.',
      author: 'Chef Kofi',
      date: '5 Janvier 2025',
      category: 'Recettes',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80'
    },
    {
      id: 4,
      title: 'Les épices africaines et leurs bienfaits pour la santé',
      excerpt: 'Découvrez les propriétés médicinales et les bienfaits nutritionnels des épices utilisées dans la cuisine africaine.',
      author: 'Dr. Fatou',
      date: '1 Janvier 2025',
      category: 'Santé',
      image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12 text-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* En-tête */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Blog</h1>
              <p className="text-xl text-gray-600">
                Découvrez nos articles sur la cuisine africaine, les recettes et bien plus encore
              </p>
            </div>

            {/* Liste des articles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {articles.map((article) => (
                <article key={article.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 overflow-hidden">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                      <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full font-semibold">
                        {article.category}
                      </span>
                      <span>{article.date}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-3 hover:text-orange-500 transition-colors">
                      <Link href={`/blog/${article.id}`}>
                        {article.title}
                      </Link>
                    </h2>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {article.author.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">{article.author}</span>
                      </div>
                      <Link
                        href={`/blog/${article.id}`}
                        className="text-orange-500 font-semibold hover:text-orange-600 transition-colors"
                      >
                        Lire la suite →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Newsletter */}
            <section className="bg-orange-500 text-white rounded-lg shadow-md p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Restez informé</h2>
              <p className="text-xl mb-6">
                Abonnez-vous à notre newsletter pour recevoir nos derniers articles et recettes
              </p>
              <div className="max-w-md mx-auto flex gap-4">
                <input
                  type="email"
                  placeholder="Votre adresse email"
                  className="flex-1 px-4 py-3 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-white"
                />
                <button className="bg-white text-orange-500 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors">
                  S'abonner
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
