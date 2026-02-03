'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const articles: Record<string, {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  image: string;
}> = {
  '1': {
    id: 1,
    title: 'Les 10 plats africains incontournables à découvrir',
    excerpt: 'Découvrez les saveurs authentiques de l\'Afrique à travers ces plats traditionnels qui ont conquis le monde.',
    content: 'La cuisine africaine regorge de trésors culinaires. Du Jollof Rice ouest-africain au Thieboudienne sénégalais, en passant par le Ndolé camerounais et le Mafé, chaque plat raconte une histoire. Ces recettes, transmises de génération en génération, sont aujourd\'hui appréciées bien au-delà du continent. Découvrez notre sélection des 10 plats africains incontournables à déguster au moins une fois dans sa vie.',
    author: 'Chef Amara',
    date: '15 Janvier 2025',
    category: 'Cuisine',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80'
  },
  '2': {
    id: 2,
    title: 'L\'histoire du Thieboudienne, le plat national du Sénégal',
    excerpt: 'Plongez dans l\'histoire riche et fascinante de ce plat emblématique de la cuisine sénégalaise.',
    content: 'Le Thieboudienne, ou ceebu jën en wolof, est bien plus qu\'un simple plat de riz au poisson. C\'est un symbole de partage et de convivialité au Sénégal. Né à Saint-Louis au XIXe siècle, ce plat a conquis tout le pays et au-delà. Riz brisé, poisson, légumes et sauce tomate épicée se marient pour un résultat savoureux et nourrissant.',
    author: 'Marie Diallo',
    date: '10 Janvier 2025',
    category: 'Histoire',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80'
  },
  '3': {
    id: 3,
    title: 'Comment préparer le parfait Jollof Rice à la maison',
    excerpt: 'Apprenez les secrets d\'une recette authentique de Jollof Rice avec nos conseils de chef.',
    content: 'Le Jollof Rice divise le Nigeria, le Ghana et le Sénégal : chacun revendique la meilleure version. La base reste la même : riz cuit dans une sauce tomate épicée avec oignons, poivrons et épices. Le secret ? Laisser le riz « brûler » légèrement au fond de la marmite pour le socarrat, et ne pas lésiner sur le bouillon et les épices.',
    author: 'Chef Kofi',
    date: '5 Janvier 2025',
    category: 'Recettes',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80'
  },
  '4': {
    id: 4,
    title: 'Les épices africaines et leurs bienfaits pour la santé',
    excerpt: 'Découvrez les propriétés médicinales et les bienfaits nutritionnels des épices utilisées dans la cuisine africaine.',
    content: 'Le piment, le gingembre, le soumbala, le nététou et bien d\'autres épices sont au cœur de la cuisine africaine. Au-delà du goût, nombre d\'entre elles ont des vertus digestives, anti-inflammatoires ou antioxydantes. Découvrez comment les intégrer à votre alimentation pour allier plaisir et santé.',
    author: 'Dr. Fatou',
    date: '1 Janvier 2025',
    category: 'Santé',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80'
  }
};

export default function BlogArticlePage() {
  const params = useParams();
  const id = params?.id as string;
  const article = id ? articles[id] : null;

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-gray-50 py-12 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Article introuvable</h1>
            <Link href="/blog" className="text-orange-500 hover:underline">Retour au blog</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12 text-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Link href="/blog" className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 mb-8">
              ← Retour au blog
            </Link>
            <article className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-64 md:h-80 overflow-hidden">
                <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-8">
                <span className="inline-block bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-semibold mb-4">
                  {article.category}
                </span>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">{article.title}</h1>
                <div className="flex items-center gap-4 text-gray-600 mb-6">
                  <span>{article.date}</span>
                  <span>•</span>
                  <span>{article.author}</span>
                </div>
                <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">{article.content}</p>
              </div>
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
