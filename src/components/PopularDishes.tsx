import PlatCard from './PlatCard';

const plats = [
  {
    nom: "Riz Jollof et Poulet",
    description: "Riz jollof parfumé avec poulet grillé et légumes",
    prix: "15.99 €",
    image: "https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80"
  },
  {
    nom: "Fufu et Soupe Egusi",
    description: "Fufu accompagné d'une soupe egusi riche et savoureuse",
    prix: "17.50 €",
    image: "https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80"
  },
  {
    nom: "Dibi Agneau",
    description: "Agneau grillé avec frites et rondelles d'oignon",
    prix: "19.00 €",
    image: "https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80"
  },
  {
    nom: "Thieboudienne",
    description: "Poisson, riz et légumes dans une sauce tomate riche",
    prix: "16.75 €",
    image: "https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80"
  },
  {
    nom: "Brochettes de Suya",
    description: "Brochettes de bœuf épicées grillées avec tomates et oignons",
    prix: "12.00 €",
    image: "https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80"
  },
  {
    nom: "Eba et Soupe Okro",
    description: "Eba avec soupe okro et poisson",
    prix: "18.25 €",
    image: "https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80"
  }
];

export default function PopularDishes() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">
          Nos Plats Populaires
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plats.map((plat, index) => (
            <PlatCard key={index} {...plat} />
          ))}
        </div>
      </div>
    </section>
  );
}

