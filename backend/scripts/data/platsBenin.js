/**
 * Plats représentatifs du Bénin et d’Afrique de l’Ouest pour le catalogue Afro-food.
 * Images : Wikimedia Commons (photographies réelles de plats), URL directes upload.wikimedia.org.
 * Réutilisé par seedPlats.js et addPlatsBenin.js
 */

/** @type {Record<string, string>} */
export const imagesCommons = {
  ghanaJollofPoulet:
    'https://upload.wikimedia.org/wikipedia/commons/f/fa/Ghana_Jollof_Rice_with_Chicken.jpg',
  jollofRiz: 'https://upload.wikimedia.org/wikipedia/commons/1/14/Jollof_rice.jpg',
  bankuOkra: 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Banku_and_Okra_Soup.jpg',
  egusiPoundedYam:
    'https://upload.wikimedia.org/wikipedia/commons/3/3a/Egusi_soup_with_pounded_yam_and_assorted_meats.jpg',
  poundedYamEgusi:
    'https://upload.wikimedia.org/wikipedia/commons/8/81/Pounded_Yam_and_Egusi_Soup.jpg',
  platesEgusiYam:
    'https://upload.wikimedia.org/wikipedia/commons/c/c1/Plates_of_Egusi_Soup_with_vegetables_and_wrapped_Pounded_Yam.jpg',
  poundedYamOkro:
    'https://upload.wikimedia.org/wikipedia/commons/8/8e/Pounded_Yam_and_Okro_Soup.jpg',
  okroBushmeat:
    'https://upload.wikimedia.org/wikipedia/commons/c/c4/Okro_Soup_with_bushmeat.jpg',
  pouletGrilleBurkina:
    'https://upload.wikimedia.org/wikipedia/commons/f/ff/Poulet_grill%C3%A9%21.JPG',
  tilapiaGrille:
    'https://upload.wikimedia.org/wikipedia/commons/b/b9/Grilled_Tilapia_Ghana.JPG',
  smokedFish: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Smoked_fish.jpg',
  alloco: "https://upload.wikimedia.org/wikipedia/commons/9/9a/Un_plat_d%27alloco_Fried_Plantains.JPG",
  jusBissap: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Jus_de_bissap.jpg',
  baobabFruit: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Baobab_fruit.jpg',
  pasteque: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Watermelon_cross_BNC.jpg',
  ananas: 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Pineapple_fruit.jpg',
  cheese: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Cheese_cubes.jpg',
  kenkey: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Kenkey.jpg',
  cornbread: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/Cornbread.jpg',
  peanuts: 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Roasted_peanuts.jpg',
  avocadoSalad: 'https://upload.wikimedia.org/wikipedia/commons/6/66/Avocado_salad.jpg',
  milletGrains: 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Millet_grains.jpg',
  beerGlass: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/Beer_in_glass.jpg',
  gardenSalad: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Garden_salad.jpg',
  thiebouDjeun: 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Thiebou_Djeun.jpg',
  palmWine: 'https://upload.wikimedia.org/wikipedia/commons/8/85/Palm_wine.jpg',
};

export const platsBenin = [
  {
    nom: 'Amiwo sauce poisson',
    slug: 'amiwo-sauce-poisson',
    description:
      'Pâte de maïs rouge (amiwo) servie avec une sauce mijotée au poisson frais et aux légumes. Un classique des foyers béninois.',
    prix: 16.5,
    categorie: 'plats-principaux',
    origineAfricaine: { pays: 'benin', region: 'Sud', traditionnel: true },
    images: { principale: imagesCommons.ghanaJollofPoulet },
    disponible: true,
  },
  {
    nom: 'Placali sauce gombo',
    slug: 'placali-sauce-gombo',
    description:
      'Placali (manioc fermenté) avec sauce gombo au poisson ou à la viande, onctueuse et légèrement gluante comme on l’aime à Cotonou.',
    prix: 15.9,
    categorie: 'plats-principaux',
    origineAfricaine: { pays: 'benin', traditionnel: true },
    images: { principale: imagesCommons.bankuOkra },
    disponible: true,
  },
  {
    nom: 'Igname pilée sauce agla',
    slug: 'igname-pilee-sauce-agla',
    description:
      'Igname pilée accompagnée d’une sauce à base de noix de palme (agla), riche et parfumée, souvent servie avec viande ou poisson.',
    prix: 17.5,
    categorie: 'plats-principaux',
    origineAfricaine: { pays: 'benin', traditionnel: true },
    images: { principale: imagesCommons.poundedYamEgusi },
    disponible: true,
  },
  {
    nom: 'Sauce crincrin au poisson fumé',
    slug: 'sauce-crincrin-poisson-fume',
    description:
      'Feuilles de manioc (crincrin) mijotées avec poisson fumé et épices — saveur profonde et fumée typique du terroir béninois.',
    prix: 16.0,
    categorie: 'specialites-africaines',
    origineAfricaine: { pays: 'benin', traditionnel: true },
    images: { principale: imagesCommons.okroBushmeat },
    disponible: true,
  },
  {
    nom: 'Soupe pistache au bœuf',
    slug: 'soupe-pistache-boeuf',
    description:
      'Soupe épaisse à la pâte d’arachide (pistache) avec bœuf et légumes, réconfortante et nourrissante.',
    prix: 15.5,
    categorie: 'plats-principaux',
    origineAfricaine: { pays: 'benin', traditionnel: true },
    images: { principale: imagesCommons.egusiPoundedYam },
    disponible: true,
  },
  {
    nom: 'Poulet bicyclette',
    slug: 'poulet-bicyclette',
    description:
      'Poulet entier mariné aux épices locales et grillé au feu de bois, croustillant au dehors et moelleux à l’intérieur.',
    prix: 14.5,
    categorie: 'plats-principaux',
    origineAfricaine: { pays: 'benin', traditionnel: true },
    images: { principale: imagesCommons.pouletGrilleBurkina },
    disponible: true,
  },
  {
    nom: 'Foutou igname sauce graine',
    slug: 'foutou-igname-sauce-graine',
    description:
      'Foutou d’igname pilé servi avec une sauce graine (égusi) au poisson ou à la viande, plat de célébration très apprécié.',
    prix: 17.0,
    categorie: 'specialites-africaines',
    origineAfricaine: { pays: 'benin', traditionnel: true },
    images: { principale: imagesCommons.platesEgusiYam },
    disponible: true,
  },
  {
    nom: 'Wagassi grillé',
    slug: 'wagassi-grille',
    description:
      'Fromage local (wagassi) grillé ou poêlé, ferme et salé, souvent servi avec alloco ou pâte.',
    prix: 9.5,
    categorie: 'accompagnements',
    origineAfricaine: { pays: 'benin', traditionnel: true },
    images: { principale: imagesCommons.cheese },
    disponible: true,
  },
  {
    nom: 'Dokonu',
    slug: 'dokonu',
    description:
      'Pâte de maïs fermenté cuite à la vapeur dans des feuilles (gowé), douce et légèrement acidulée.',
    prix: 6.0,
    categorie: 'accompagnements',
    origineAfricaine: { pays: 'benin', traditionnel: true },
    images: { principale: imagesCommons.kenkey },
    disponible: true,
  },
  {
    nom: 'Ablo',
    slug: 'ablo',
    description:
      'Gâteau de maïs fermenté cuit à la vapeur, moelleux et parfumé, idéal avec une sauce ou en collation.',
    prix: 5.5,
    categorie: 'accompagnements',
    origineAfricaine: { pays: 'benin', traditionnel: true },
    images: { principale: imagesCommons.cornbread },
    disponible: true,
  },
  {
    nom: 'Kuli-kuli',
    slug: 'kuli-kuli',
    description:
      'Croquettes croustillantes à base d’arachide torréfiée, en-cas salé très populaire au Bénin et au Nigeria.',
    prix: 4.5,
    categorie: 'accompagnements',
    origineAfricaine: { pays: 'benin', traditionnel: true },
    images: { principale: imagesCommons.peanuts },
    disponible: true,
  },
  {
    nom: 'Salade d’avocat aux crevettes',
    slug: 'salade-avocat-crevettes',
    description:
      'Entrée fraîche : avocat mûr, crevettes et citron vert, légère et parfumée.',
    prix: 9.0,
    categorie: 'entrees',
    origineAfricaine: { pays: 'benin', traditionnel: false },
    images: { principale: imagesCommons.avocadoSalad },
    disponible: true,
  },
  {
    nom: 'Gâteau de mil',
    slug: 'gateau-de-mil',
    description:
      'Dessert traditionnel à base de farine de mil, sucré et parfumé à la vanille ou au citron.',
    prix: 5.0,
    categorie: 'desserts',
    origineAfricaine: { pays: 'benin', traditionnel: true },
    images: { principale: imagesCommons.milletGrains },
    disponible: true,
  },
  {
    nom: 'Tchapalo',
    slug: 'tchapalo',
    description:
      'Bière de mil locale fermentée, légèrement pétillante, à consommer avec modération.',
    prix: 3.5,
    categorie: 'boissons',
    origineAfricaine: { pays: 'benin', traditionnel: true },
    images: { principale: imagesCommons.beerGlass },
    disponible: true,
  },
  {
    nom: 'Légumes sautés & attiéké',
    slug: 'legumes-sautes-attieke',
    description:
      'Attiéké de manioc avec légumes de saison sautés à l’huile, plat végétalien généreux et coloré.',
    prix: 12.5,
    categorie: 'vegan',
    origineAfricaine: { pays: 'benin', traditionnel: false },
    images: { principale: imagesCommons.gardenSalad },
    disponible: true,
  },
  {
    nom: 'Thieboudienne',
    slug: 'thieboudienne',
    description:
      'Riz au poisson et légumes (ceebu jën), plat emblématique du Sénégal, généreux et coloré.',
    prix: 18.0,
    categorie: 'specialites-africaines',
    origineAfricaine: { pays: 'senegal', traditionnel: true },
    images: { principale: imagesCommons.thiebouDjeun },
    disponible: true,
  },
  {
    nom: 'Attiéké poisson braisé',
    slug: 'attieke-poisson-braise',
    description:
      'Attiéké avec poisson grillé et accompagnements, comme on le sert en Côte d’Ivoire et au Bénin.',
    prix: 16.5,
    categorie: 'plats-principaux',
    origineAfricaine: { pays: 'cote-ivoire', traditionnel: true },
    images: { principale: imagesCommons.tilapiaGrille },
    disponible: true,
  },
  {
    nom: 'Vin de palme',
    slug: 'vin-de-palme',
    description:
      'Boisson traditionnelle à base de sève de palmier fermentée, douce et légèrement acidulée.',
    prix: 4.0,
    categorie: 'boissons',
    origineAfricaine: { pays: 'benin', traditionnel: true },
    images: { principale: imagesCommons.palmWine },
    disponible: true,
  },
];
