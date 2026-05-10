import { platImagesCommons as img } from './platImagesCommons';

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
    image: img.alloco,
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
    image: img.jusBissap,
    categorie: 'Boissons'
  },
  {
    id: 16,
    nom: 'Jus de baobab',
    description: 'Jus onctueux à base de pulpe de baobab, riche en vitamine C, naturellement doux et rafraîchissant.',
    prix: '4,50 €',
    image: img.baobabFruit,
    categorie: 'Boissons'
  },
  {
    id: 17,
    nom: 'Jus de pastèque',
    description: 'Jus frais et léger, sucré et désaltérant, idéal pour accompagner un repas épicé.',
    prix: '4,00 €',
    image: img.pasteque,
    categorie: 'Boissons'
  },
  {
    id: 18,
    nom: 'Jus d’ananas',
    description: 'Jus d’ananas pressé, parfumé et acidulé, une boisson tropicale pleine de soleil.',
    prix: '4,50 €',
    image: img.ananas,
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
  },
  // Catalogue Bénin (extension)
  {
    id: 19,
    nom: 'Amiwo sauce poisson',
    description:
      'Pâte de maïs rouge (amiwo) avec sauce mijotée au poisson et légumes — classique des tables béninoises.',
    prix: '16,50 €',
    image: img.ghanaJollofPoulet,
    categorie: 'Plats Principaux'
  },
  {
    id: 20,
    nom: 'Placali sauce gombo',
    description:
      'Manioc fermenté et sauce gombo au poisson ou à la viande, onctueuse comme à Cotonou.',
    prix: '15,90 €',
    image: img.bankuOkra,
    categorie: 'Plats Principaux'
  },
  {
    id: 21,
    nom: 'Igname pilée sauce agla',
    description: 'Igname pilée avec sauce à la noix de palme, riche et parfumée.',
    prix: '17,50 €',
    image: img.poundedYamEgusi,
    categorie: 'Plats Principaux'
  },
  {
    id: 22,
    nom: 'Sauce crincrin au poisson fumé',
    description: 'Feuilles de manioc mijotées avec poisson fumé et épices.',
    prix: '16,00 €',
    image: img.okroBushmeat,
    categorie: 'Spécialités Africaines'
  },
  {
    id: 23,
    nom: 'Soupe pistache au bœuf',
    description: 'Soupe épaisse à la pâte d’arachide avec bœuf et légumes.',
    prix: '15,50 €',
    image: img.egusiPoundedYam,
    categorie: 'Plats Principaux'
  },
  {
    id: 24,
    nom: 'Poulet bicyclette',
    description: 'Poulet mariné aux épices locales et grillé au feu de bois.',
    prix: '14,50 €',
    image: img.pouletGrilleBurkina,
    categorie: 'Plats Principaux'
  },
  {
    id: 25,
    nom: 'Foutou igname sauce graine',
    description: 'Foutou d’igname avec sauce graine (égusi) au poisson ou à la viande.',
    prix: '17,00 €',
    image: img.platesEgusiYam,
    categorie: 'Spécialités Africaines'
  },
  {
    id: 26,
    nom: 'Wagassi grillé',
    description: 'Fromage local grillé, ferme et salé, souvent avec alloco ou pâte.',
    prix: '9,50 €',
    image: img.cheese,
    categorie: 'Accompagnements'
  },
  {
    id: 27,
    nom: 'Dokonu',
    description: 'Maïs fermenté cuit à la vapeur dans des feuilles (gowé).',
    prix: '6,00 €',
    image: img.kenkey,
    categorie: 'Accompagnements'
  },
  {
    id: 28,
    nom: 'Ablo',
    description: 'Gâteau de maïs fermenté vapeur, moelleux et parfumé.',
    prix: '5,50 €',
    image: img.cornbread,
    categorie: 'Accompagnements'
  },
  {
    id: 29,
    nom: 'Kuli-kuli',
    description: 'Croquettes croustillantes à l’arachide torréfiée.',
    prix: '4,50 €',
    image: img.peanuts,
    categorie: 'Accompagnements'
  },
  {
    id: 30,
    nom: 'Salade d’avocat aux crevettes',
    description: 'Entrée fraîche : avocat, crevettes et citron vert.',
    prix: '9,00 €',
    image: img.avocadoSalad,
    categorie: 'Entrées'
  },
  {
    id: 31,
    nom: 'Gâteau de mil',
    description: 'Dessert à base de farine de mil, sucré et parfumé.',
    prix: '5,00 €',
    image: img.milletGrains,
    categorie: 'Desserts'
  },
  {
    id: 32,
    nom: 'Tchapalo',
    description: 'Bière de mil fermentée, à consommer avec modération.',
    prix: '3,50 €',
    image: img.beerGlass,
    categorie: 'Boissons'
  },
  {
    id: 33,
    nom: 'Légumes sautés & attiéké',
    description: 'Attiéké avec légumes de saison sautés — plat végétalien généreux.',
    prix: '12,50 €',
    image: img.gardenSalad,
    categorie: 'Vegan'
  },
  {
    id: 34,
    nom: 'Thieboudienne',
    description: 'Riz au poisson et légumes (ceebu jën), plat emblématique du Sénégal.',
    prix: '18,00 €',
    image: img.thiebouDjeun,
    categorie: 'Spécialités Africaines'
  },
  {
    id: 35,
    nom: 'Attiéké poisson braisé',
    description: 'Poisson grillé et accompagnements, comme en Côte d’Ivoire et au Bénin.',
    prix: '16,50 €',
    image: img.tilapiaGrille,
    categorie: 'Plats Principaux'
  },
  {
    id: 36,
    nom: 'Vin de palme',
    description: 'Boisson traditionnelle à base de sève de palmier fermentée.',
    prix: '4,00 €',
    image: img.palmWine,
    categorie: 'Boissons'
  }
];
