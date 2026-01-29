'use client';

import PlatCard from './PlatCard';
import { useCart } from '@/context/CartContext';

const plats = [
  { id: 'popular-jollof', nom: "Riz Jollof et Poulet", description: "Riz jollof parfumé avec poulet grillé et légumes", prix: "15.99 €", prixUnitaire: 15.99, image: "/images/plats/1769702264382_Jollof_rice_au_poulet.jpg" },
  { id: 'popular-fufu', nom: "Fufu et Soupe Egusi", description: "Fufu accompagné d'une soupe egusi riche et savoureuse", prix: "17.50 €", prixUnitaire: 17.5, image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80" },
  { id: 'popular-dibi', nom: "Dibi Agneau", description: "Agneau grillé avec frites et rondelles d'oignon", prix: "19.00 €", prixUnitaire: 19, image: "/images/plats/1769698319103_image__3_.jpg" },
  { id: 'popular-thieb', nom: "Thieboudienne", description: "Poisson, riz et légumes dans une sauce tomate riche", prix: "16.75 €", prixUnitaire: 16.75, image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80" },
  { id: 'popular-suya', nom: "Brochettes de Suya", description: "Brochettes de bœuf épicées grillées avec tomates et oignons", prix: "12.00 €", prixUnitaire: 12, image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80" },
  { id: 'popular-eba', nom: "Eba et Soupe Okro", description: "Eba avec soupe okro et poisson", prix: "18.25 €", prixUnitaire: 18.25, image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80" }
];

export default function PopularDishes() {
  const { addItem } = useCart();
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">
          Nos Plats Populaires
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plats.map((plat) => (
            <PlatCard
              key={plat.id}
              nom={plat.nom}
              description={plat.description}
              prix={plat.prix}
              image={plat.image}
              onAddToCart={() => addItem({ id: plat.id, nom: plat.nom, prixUnitaire: plat.prixUnitaire, image: plat.image })}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

