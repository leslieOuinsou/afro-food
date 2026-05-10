import { platImagesCommons as img } from './platImagesCommons';

export type SearchProduct = {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  origin: string;
};

export const SEARCH_PRODUCTS: SearchProduct[] = [
  {
    id: 'p-jollof',
    name: 'Jollof rice au poulet',
    price: 15.5,
    image: img.ghanaJollofPoulet,
    category: 'Plats',
    origin: 'Nigeria',
  },
  {
    id: 'p-bissap',
    name: 'Jus de Bissap',
    price: 3.5,
    image: img.jusBissap,
    category: 'Boissons',
    origin: 'Sénégal',
  },
  {
    id: 'p-baobab',
    name: 'Jus de baobab',
    price: 4.5,
    image: img.baobabFruit,
    category: 'Boissons',
    origin: 'Sénégal',
  },
  {
    id: 'p-pasteque',
    name: 'Jus de pastèque',
    price: 4,
    image: img.pasteque,
    category: 'Boissons',
    origin: 'Côte d’Ivoire',
  },
  {
    id: 'p-ananas',
    name: 'Jus d’ananas',
    price: 4.5,
    image: img.ananas,
    category: 'Boissons',
    origin: 'Bénin',
  },
  {
    id: 'p-dibi',
    name: 'Dibi agneau',
    price: 19,
    image: img.pouletGrilleBurkina,
    category: 'Plats',
    origin: 'Sénégal',
  },
  {
    id: 'p-suya',
    name: 'Mélange Suya',
    price: 6.9,
    image: img.peanuts,
    category: 'Épices',
    origin: 'Cameroun',
  },
  {
    id: 'p-mafe',
    name: 'Mafé de bœuf',
    price: 17,
    image: img.domoda,
    category: 'Plats',
    origin: 'Mali',
  },
  {
    id: 'p-attieke',
    name: 'Attiéké poisson',
    price: 16,
    image: img.tilapiaGrille,
    category: 'Plats',
    origin: 'Côte d’Ivoire',
  },
  {
    id: 'p-amiwo',
    name: 'Amiwo sauce poisson',
    price: 16.5,
    image: img.ghanaJollofPoulet,
    category: 'Plats',
    origin: 'Bénin',
  },
  {
    id: 'p-placali',
    name: 'Placali sauce gombo',
    price: 15.9,
    image: img.bankuOkra,
    category: 'Plats',
    origin: 'Bénin',
  },
  {
    id: 'p-poulet-bicyclette',
    name: 'Poulet bicyclette',
    price: 14.5,
    image: img.pouletGrilleBurkina,
    category: 'Plats',
    origin: 'Bénin',
  },
  {
    id: 'p-crincrin',
    name: 'Sauce crincrin au poisson fumé',
    price: 16,
    image: img.okroBushmeat,
    category: 'Plats',
    origin: 'Bénin',
  },
  {
    id: 'p-wagassi',
    name: 'Wagassi grillé',
    price: 9.5,
    image: img.cheese,
    category: 'Accompagnements',
    origin: 'Bénin',
  },
  {
    id: 'p-tchapalo',
    name: 'Tchapalo',
    price: 3.5,
    image: img.beerGlass,
    category: 'Boissons',
    origin: 'Bénin',
  },
  {
    id: 'p-thieb',
    name: 'Thieboudienne',
    price: 18,
    image: img.thiebouDjeun,
    category: 'Plats',
    origin: 'Sénégal',
  },
  {
    id: 'p-vin-palme',
    name: 'Vin de palme',
    price: 4,
    image: img.palmWine,
    category: 'Boissons',
    origin: 'Bénin',
  },
];
