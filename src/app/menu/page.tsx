'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PlatCard from '@/components/PlatCard';

const categories = [
  'Tous',
  'Plats Principaux',
  'Accompagnements',
  'Boissons',
  'Desserts',
  'Spécialités Africaines',
  'Végétarien'
];

const plats = [
  {
    id: 1,
    nom: 'Jollof Rice au Poulet',
    description: 'Savory rice cooked in a spicy tomato sauce, served with grilled chicken and fresh vegetables.',
    prix: '15,50 €',
    image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80',
    categorie: 'Plats Principaux'
  },
  {
    id: 2,
    nom: 'Mafé de Bœuf',
    description: 'Creamy beef stew with peanut sauce, accompanied by root vegetables and white rice.',
    prix: '17,00 €',
    image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80',
    categorie: 'Plats Principaux'
  },
  {
    id: 3,
    nom: 'Alloco',
    description: 'Fried plantains, crispy on the outside and soft on the inside, perfect as a side.',
    prix: '6,50 €',
    image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80',
    categorie: 'Accompagnements'
  },
  {
    id: 4,
    nom: 'Jus de Bissap',
    description: 'Refreshing drink made from hibiscus flowers, sweet and slightly tart.',
    prix: '4,00 €',
    image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80',
    categorie: 'Boissons'
  },
  {
    id: 5,
    nom: 'Gâteau de Patate Douce',
    description: 'Sweet and spicy dessert, made with sweet potato and cinnamon, a comforting delight.',
    prix: '7,00 €',
    image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80',
    categorie: 'Desserts'
  },
  {
    id: 6,
    nom: 'Attiéké Poisson',
    description: 'Light and fluffy fermented cassava couscous, served with crispy fried fish and crudités.',
    prix: '16,00 €',
    image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80',
    categorie: 'Spécialités Africaines'
  },
  {
    id: 7,
    nom: 'Haricots Noirs à la Tomate',
    description: 'Black beans cooked in a rich spicy tomato sauce, perfect for vegetarians.',
    prix: '12,50 €',
    image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80',
    categorie: 'Végétarien'
  },
  {
    id: 8,
    nom: 'Poulet Yassa',
    description: 'Chicken marinated in lemon and mustard, simmered with caramelized onions and served with rice.',
    prix: '16,50 €',
    image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80',
    categorie: 'Spécialités Africaines'
  },
  {
    id: 9,
    nom: 'Salade de Fruits Exotiques',
    description: 'A fresh and colorful selection of seasonal tropical fruits, light and delicious.',
    prix: '5,50 €',
    image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80',
    categorie: 'Desserts'
  }
];

export default function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState('Tous');

  const filteredPlats = selectedCategory === 'Tous' 
    ? plats 
    : plats.filter(plat => plat.categorie === selectedCategory);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          {/* Section Catégories de Plats */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Catégories de Plats</h2>
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </section>

          {/* Section Notre Menu Complet */}
          <section>
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Notre Menu Complet</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPlats.map((plat) => (
                <PlatCard
                  key={plat.id}
                  nom={plat.nom}
                  description={plat.description}
                  prix={plat.prix}
                  image={plat.image}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

