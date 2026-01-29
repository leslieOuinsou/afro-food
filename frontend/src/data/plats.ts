export interface Plat {
  id: number;
  nom: string;
  description: string;
  prix: string;
  image: string;
  categorie: string;
}

export const plats: Plat[] = [
  // Plats Camerounais
  {
    id: 1,
    nom: 'Ndolé aux Crevettes',
    description: 'Plat national camerounais : feuilles de ndolé cuites avec crevettes, arachides et accompagné de plantains.',
    prix: '18,50 €',
    image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80',
    categorie: 'Plats Principaux'
  },
  {
    id: 2,
    nom: 'Poulet DG',
    description: 'Poulet sauté avec plantains, légumes frais et épices camerounaises, servi avec du riz.',
    prix: '17,00 €',
    image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80',
    categorie: 'Plats Principaux'
  },
  {
    id: 3,
    nom: 'Koki aux Haricots',
    description: 'Purée de haricots cuits à la vapeur dans des feuilles, spécialité camerounaise.',
    prix: '12,00 €',
    image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80',
    categorie: 'Spécialités Africaines'
  },
  {
    id: 4,
    nom: 'Poisson Braisé',
    description: 'Poisson entier grillé aux épices camerounaises, servi avec du riz et de la sauce.',
    prix: '19,00 €',
    image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80',
    categorie: 'Plats Principaux'
  },
  {
    id: 5,
    nom: 'Eru',
    description: 'Ragoût de feuilles d\'eru avec viande ou poisson, accompagné de fufu ou de plantains.',
    prix: '16,50 €',
    image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80',
    categorie: 'Spécialités Africaines'
  },
  {
    id: 6,
    nom: 'Bâton de Manioc',
    description: 'Bâton de manioc fermenté, accompagnement traditionnel camerounais.',
    prix: '5,00 €',
    image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80',
    categorie: 'Accompagnements'
  },
  // Plats Béninois
  {
    id: 7,
    nom: 'Pâte avec Sauce Arachide',
    description: 'Bouillie de maïs servie avec une sauce d\'arachide riche et onctueuse, spécialité béninoise.',
    prix: '14,50 €',
    image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80',
    categorie: 'Plats Principaux'
  },
  {
    id: 8,
    nom: 'Dindon aux Épinards',
    description: 'Dindon cuisiné avec des épinards et des épices béninoises, accompagné de riz.',
    prix: '18,00 €',
    image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80',
    categorie: 'Plats Principaux'
  },
  {
    id: 9,
    nom: 'Akassa',
    description: 'Pâte de maïs fermenté, base traditionnelle béninoise servie avec différentes sauces.',
    prix: '10,00 €',
    image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80',
    categorie: 'Accompagnements'
  },
  {
    id: 10,
    nom: 'Alloco',
    description: 'Plantains frits croustillants, délicieux accompagnement typique du Bénin.',
    prix: '6,50 €',
    image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80',
    categorie: 'Accompagnements'
  },
  {
    id: 11,
    nom: 'Sauce Claire au Poisson',
    description: 'Sauce tomate simple et savoureuse avec poisson, accompagnée de riz ou de pâte.',
    prix: '15,50 €',
    image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80',
    categorie: 'Plats Principaux'
  },
  {
    id: 12,
    nom: 'Poisson Fumé Béninois',
    description: 'Poisson fumé traditionnel préparé à la façon béninoise, servi avec sauce et accompagnements.',
    prix: '17,50 €',
    image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80',
    categorie: 'Spécialités Africaines'
  },
  {
    id: 13,
    nom: 'Jus de Bissap',
    description: 'Boisson rafraîchissante à base de fleurs d\'hibiscus, douce et légèrement acidulée.',
    prix: '4,00 €',
    image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80',
    categorie: 'Boissons'
  },
  {
    id: 14,
    nom: 'Beignets de Haricots',
    description: 'Beignets de haricots frits, délicieux en-cas végétarien du Bénin.',
    prix: '8,00 €',
    image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80',
    categorie: 'Végétarien'
  },
  {
    id: 15,
    nom: 'Salade de Fruits Tropicaux',
    description: 'Sélection fraîche et colorée de fruits tropicaux de saison, légère et délicieuse.',
    prix: '5,50 €',
    image: 'https://images.unsplash.com/photo-1585937421612-0a0c0b0b0b0b?w=400&q=80',
    categorie: 'Desserts'
  }
];
