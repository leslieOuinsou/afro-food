'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PlatCard from '@/components/PlatCard';
import { fetchPlats } from '@/services/plats';
import type { Plat } from '@/services/plats';
import { useCart } from '@/context/CartContext';

const categories = [
  'Tous',
  'Plats Principaux',
  'Accompagnements',
  'Boissons',
  'Desserts',
  'Spécialités Africaines',
  'Végétarien'
];

// Plats de secours si l'API n'est pas disponible ou la base est vide
const platsFallback = [
  { id: '1', nom: 'Jollof Rice au Poulet', description: 'Riz savoureux à la sauce tomate épicée, poulet grillé et légumes.', prix: '15,50 €', prixUnitaire: 15.5, image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80', categorie: 'Plats Principaux' },
  { id: '2', nom: 'Mafé de Bœuf', description: 'Ragoût de bœuf à la sauce arachide, légumes et riz.', prix: '17,00 €', prixUnitaire: 17, image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80', categorie: 'Plats Principaux' },
  { id: '3', nom: 'Alloco', description: 'Plantains frits, croustillants et fondants.', prix: '6,50 €', prixUnitaire: 6.5, image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80', categorie: 'Accompagnements' },
  { id: '4', nom: 'Jus de Bissap', description: 'Boisson à base de fleurs d\'hibiscus, douce et acidulée.', prix: '4,00 €', prixUnitaire: 4, image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80', categorie: 'Boissons' },
  { id: '5', nom: 'Gâteau de Patate Douce', description: 'Dessert à la patate douce et cannelle.', prix: '7,00 €', prixUnitaire: 7, image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80', categorie: 'Desserts' },
  { id: '6', nom: 'Attiéké Poisson', description: 'Couscous de manioc fermenté, poisson frit et crudités.', prix: '16,00 €', prixUnitaire: 16, image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80', categorie: 'Spécialités Africaines' },
  { id: '7', nom: 'Poulet Yassa', description: 'Poulet mariné citron-moutarde, oignons caramélisés et riz.', prix: '16,50 €', prixUnitaire: 16.5, image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80', categorie: 'Spécialités Africaines' },
  { id: '8', nom: 'Salade de Fruits Exotiques', description: 'Sélection de fruits tropicaux de saison.', prix: '5,50 €', prixUnitaire: 5.5, image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80', categorie: 'Desserts' }
];

type PlatAffichage = {
  id: string;
  nom: string;
  description: string;
  prix: string;
  prixUnitaire: number;
  image: string;
  categorie: string;
};

function formatPrix(prix: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(prix);
}

const categorieBackendToDisplay: Record<string, string> = {
  'plats-principaux': 'Plats Principaux',
  'accompagnements': 'Accompagnements',
  'boissons': 'Boissons',
  'desserts': 'Desserts',
  'specialites-africaines': 'Spécialités Africaines',
  'vegetarien': 'Végétarien',
  'entrees': 'Entrées',
  'vegan': 'Végétarien'
};

function platApiToAffichage(p: Plat): PlatAffichage {
  const prix = p.prixPromo && p.prixPromo > 0 ? p.prixPromo : p.prix;
  const cat = p.categorie || 'plats-principaux';
  return {
    id: p._id,
    nom: p.nom,
    description: p.description,
    prix: formatPrix(prix),
    prixUnitaire: prix,
    image: p.images?.principale || 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80',
    categorie: categorieBackendToDisplay[cat] || cat
  };
}

export default function MenuPage() {
  const { addItem } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [plats, setPlats] = useState<PlatAffichage[]>(platsFallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPlats({ limite: 50 })
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data && Array.isArray((res.data as { plats?: Plat[] }).plats)) {
          const list = (res.data as { plats: Plat[] }).plats;
          if (list.length > 0) {
            setPlats(list.map(platApiToAffichage));
          }
        }
      })
      .catch(() => {
        if (!cancelled) setPlats(platsFallback);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const filteredPlats = selectedCategory === 'Tous'
    ? plats
    : plats.filter((plat) => plat.categorie === selectedCategory);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 text-gray-900">
        <div className="container mx-auto px-4 py-12">
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

          <section>
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Notre Menu Complet</h2>
            {loading ? (
              <div className="text-center py-12 text-gray-600">Chargement du menu...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPlats.map((plat) => (
                  <PlatCard
                    key={plat.id}
                    nom={plat.nom}
                    description={plat.description}
                    prix={plat.prix}
                    image={plat.image}
                    onAddToCart={() =>
                      addItem({
                        id: plat.id,
                        nom: plat.nom,
                        prixUnitaire: plat.prixUnitaire,
                        image: plat.image
                      })
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
