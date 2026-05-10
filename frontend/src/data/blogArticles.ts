export type BlogFacet = 'recettes' | 'culture' | 'producteurs' | 'conseils';

export type BlogArticle = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorBio: string;
  date: string;
  readTime: string;
  category: string;
  facet: BlogFacet;
  image: string;
  tags: string[];
};

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    id: '1',
    title: 'Les 10 plats africains incontournables à découvrir',
    excerpt:
      'Du golfe de Guinée aux savanes, une sélection de plats qui racontent l’Afrique à l’assiette.',
    content: `La cuisine africaine regorge de trésors culinaires. Du Jollof Rice ouest-africain au Thieboudienne sénégalais, en passant par le Ndolé camerounais et le Mafé, chaque plat raconte une histoire.

Ces recettes, transmises de génération en génération, sont aujourd’hui appréciées bien au-delà du continent. Elles s’adaptent aux marchés locaux, aux saisons et aux familles — jamais figées, toujours vivantes.

Dans cet article, nous vous proposons une sélection des dix plats à goûter au moins une fois : textures, épices, partage et convivialité au rendez-vous. Préparez vos papilles : le voyage commence ici.`,
    author: 'Chef Amara',
    authorBio: 'Chef et autrice, passionnée par les cuisines du continent et leurs racines.',
    date: '15 janvier 2026',
    readTime: '8 min',
    category: 'Cuisine',
    facet: 'culture',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1600&q=80',
    tags: ['plats', 'tradition', 'sélection'],
  },
  {
    id: '2',
    title: "L'histoire du Thieboudienne, le plat national du Sénégal",
    excerpt: 'Ceebu jën : entre riz, poisson et mémoire collective.',
    content: `Le Thieboudienne, ou ceebu jën en wolof, est bien plus qu’un simple plat de riz au poisson. C’est un symbole de partage et de convivialité au Sénégal.

Né à Saint-Louis au XIXe siècle, ce plat a conquis tout le pays et au-delà. Riz brisé, poisson, légumes et sauce tomate épicée se marient pour un résultat savoureux et nourrissant.

Chaque région affine sa version : le choix du poisson, des légumes ou le degré de « socarrat » au fond de la marmite. Une même recette, mille tables différentes.`,
    author: 'Marie Diallo',
    authorBio: 'Journaliste culinaire, entre Dakar et Paris.',
    date: '10 janvier 2026',
    readTime: '6 min',
    category: 'Histoire',
    facet: 'culture',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1600&q=80',
    tags: ['Sénégal', 'riz', 'histoire'],
  },
  {
    id: '3',
    title: 'Comment préparer le parfait Jollof Rice à la maison',
    excerpt: 'Sauce tomate, épices, riz : les bases pour réussir votre marmite.',
    content: `Le Jollof Rice divise le Nigeria, le Ghana et le Sénégal : chacun revendique la meilleure version. La base reste la même : riz cuit dans une sauce tomate épicée avec oignons, poivrons et épices.

Le secret ? Laisser le riz « prendre » au fond de la marmite pour une légère caramélisation, et ne pas lésiner sur le bouillon — volaille, légumes ou poisson selon vos goûts.

Servez chaud, avec une salade fraîche ou un plantain grillé : le contraste fait tout le plat.`,
    author: 'Chef Kofi',
    authorBio: 'Formateur cuisine et défenseur du street-food ouest-africain.',
    date: '5 janvier 2026',
    readTime: '7 min',
    category: 'Recettes',
    facet: 'recettes',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1600&q=80',
    tags: ['Jollof', 'recette', 'riz'],
  },
  {
    id: '4',
    title: 'Les épices africaines et leurs bienfaits pour la santé',
    excerpt: 'Soumbala, gingembre, piment : au-delà du goût.',
    content: `Le piment, le gingembre, le soumbala, le nététou et bien d’autres épices sont au cœur de la cuisine africaine. Au-delà du goût, nombre d’entre elles accompagnent une alimentation équilibrée lorsqu’elles sont utilisées avec mesure.

Intégrez-les dans vos mijotés, vos marinades ou vos jus : la diversité des saveurs est aussi une façon de varier les apports.

Écoutez votre corps et adaptez le piquant : le plaisir reste la meilleure épice.`,
    author: 'Dr. Fatou N.',
    authorBio: 'Nutritionniste, spécialiste des cuisines diasporiques.',
    date: '1 janvier 2026',
    readTime: '5 min',
    category: 'Santé',
    facet: 'conseils',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=1600&q=80',
    tags: ['épices', 'bien-être', 'nutrition'],
  },
  {
    id: '5',
    title: 'Rencontre avec un producteur de manioc au Ghana',
    excerpt: 'Des champs à la farine : le parcours d’une filière.',
    content: `Au cœur de la région des Ashanti, les parcelles de manioc s’étendent à perte de vue. Nous avons suivi Kwame et son coopérative : récolte, séchage, transformation en gari et en farine.

Ces filières nourrissent les cuisines locales et exportent une partie de la production. Derrière chaque sac, des décisions collectives, du financement et beaucoup de travail manuel.

Un reportage pour comprendre d’où vient l’ingrédient dans votre assiette.`,
    author: 'Aïcha Mensah',
    authorBio: 'Reporter indépendante, focus agriculture et alimentation.',
    date: '28 décembre 2025',
    readTime: '9 min',
    category: 'Reportage',
    facet: 'producteurs',
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1600&q=80',
    tags: ['Ghana', 'manioc', 'filiale'],
  },
  {
    id: '6',
    title: 'Conserver les légumes feuilles : nos astuces',
    excerpt: 'Épinards, feuilles de manioc, ndolé : garder le croquant et les vitamines.',
    content: `Les légumes feuilles sont la base de nombreuses sauces africaines. Pour les conserver quelques jours sans perdre en couleur ni en nutriments : lavez-les bien, séchez-les délicatement, puis emballez dans un torchon humide au réfrigérateur.

Évitez les sacs étanches hermétiques qui favorisent la fermentation. Pour le congélateur, blanchissez 2 minutes puis refroidissez à l’eau glacée avant surgélation.

Petits gestes, grands effets sur vos plats de semaine.`,
    author: 'Chef Amara',
    authorBio: 'Chef et autrice, passionnée par les cuisines du continent et leurs racines.',
    date: '20 décembre 2025',
    readTime: '4 min',
    category: 'Astuces',
    facet: 'conseils',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1600&q=80',
    tags: ['conservation', 'légumes', 'cuisine'],
  },
];

export const FACET_LABELS: Record<BlogFacet, string> = {
  recettes: 'Recettes',
  culture: 'Culture',
  producteurs: 'Producteurs',
  conseils: 'Conseils',
};

export function getArticleById(id: string): BlogArticle | undefined {
  return BLOG_ARTICLES.find((a) => a.id === id);
}

export function getRelatedArticles(currentId: string, limit = 3): BlogArticle[] {
  const current = getArticleById(currentId);
  if (!current) return BLOG_ARTICLES.filter((a) => a.id !== currentId).slice(0, limit);
  const sameFacet = BLOG_ARTICLES.filter((a) => a.id !== currentId && a.facet === current.facet);
  const rest = BLOG_ARTICLES.filter((a) => a.id !== currentId && a.facet !== current.facet);
  return [...sameFacet, ...rest].slice(0, limit);
}
