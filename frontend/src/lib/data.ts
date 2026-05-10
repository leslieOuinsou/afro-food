export type DishRegion = "ouest" | "centrale" | "est" | "street";

export type Dish = {
  id: string;
  name: string;
  origin: string;
  region: DishRegion;
  price: number;
  rating: number;
  reviews: number;
  badge: string;
  spicy: number;
  time: string;
  description: string;
  tags: string[];
  bgColor: string;
};

export const MENU_DISHES: Dish[] = [
  {
    id: "d-jollof",
    name: "Jollof rice au poulet",
    origin: "Lagos · Nigeria",
    region: "ouest",
    price: 15.5,
    rating: 4.8,
    reviews: 214,
    badge: "Best-seller",
    spicy: 2,
    time: "32 min",
    description:
      "Riz parfumé à la tomate, poulet grillé et légumes mijotés. Une assiette généreuse comme au marché.",
    tags: [],
    bgColor: "#c45a1a",
  },
  {
    id: "d-yassa",
    name: "Poulet Yassa",
    origin: "Dakar · Sénégal",
    region: "ouest",
    price: 16.9,
    rating: 4.7,
    reviews: 189,
    badge: "Classique",
    spicy: 1,
    time: "28 min",
    description:
      "Marinade citron-oignons, riz parfumé et sauce réduite. Douceur et caractère en équilibre.",
    tags: [],
    bgColor: "#d4651a",
  },
  {
    id: "d-saka",
    name: "Saka-saka",
    origin: "Kinshasa · RDC",
    region: "centrale",
    price: 13.5,
    rating: 4.5,
    reviews: 96,
    badge: "Maison",
    spicy: 2,
    time: "35 min",
    description:
      "Feuilles de manioc pilées, poisson fumé et pâte de pistache. Texture veloutée, goût profond.",
    tags: ["Végétarien"],
    bgColor: "#1a6040",
  },
  {
    id: "d-moambe",
    name: "Poulet moambe",
    origin: "Brazzaville · Congo",
    region: "centrale",
    price: 17.2,
    rating: 4.6,
    reviews: 72,
    badge: "Tradition",
    spicy: 1,
    time: "40 min",
    description:
      "Sauce rouge à l’huile de palme, poulet fermier et accompagnement au choix.",
    tags: [],
    bgColor: "#8b2942",
  },
  {
    id: "d-injera",
    name: "Plateau injera",
    origin: "Addis-Abeba · Éthiopie",
    region: "est",
    price: 18.5,
    rating: 4.9,
    reviews: 156,
    badge: "Partage",
    spicy: 3,
    time: "25 min",
    description:
      "Galette fermentée, lentilles épicées, légumes wot et herbes fraîches.",
    tags: ["Végétarien"],
    bgColor: "#6b2d12",
  },
  {
    id: "d-ugali",
    name: "Ugali & nyama choma",
    origin: "Nairobi · Kenya",
    region: "est",
    price: 19,
    rating: 4.4,
    reviews: 88,
    badge: "Grillades",
    spicy: 2,
    time: "30 min",
    description:
      "Polenta de maïs, viande grillée au feu de bois et kachumbari acidulé.",
    tags: [],
    bgColor: "#4a3520",
  },
  {
    id: "d-suya",
    name: "Brochettes suya",
    origin: "Abuja · Nigeria",
    region: "street",
    price: 11.9,
    rating: 4.7,
    reviews: 302,
    badge: "Street food",
    spicy: 4,
    time: "18 min",
    description:
      "Épices grillées façon nord-nigeria, oignons croquants et pain chaud.",
    tags: [],
    bgColor: "#ef9f27",
  },
  {
    id: "d-akara",
    name: "Akara & sauce tomate",
    origin: "Lagos · Nigeria",
    region: "street",
    price: 9.5,
    rating: 4.3,
    reviews: 140,
    badge: "Snacking",
    spicy: 1,
    time: "15 min",
    description:
      "Beignets de haricot noir croustillants, sauce tomate douce et piment frais.",
    tags: ["Végétarien"],
    bgColor: "#b8860b",
  },
  {
    id: "d-thieb",
    name: "Thieboudienne",
    origin: "Saint-Louis · Sénégal",
    region: "ouest",
    price: 17.5,
    rating: 4.8,
    reviews: 201,
    badge: "Poisson du jour",
    spicy: 2,
    time: "38 min",
    description:
      "Riz cassé rouge, dorade, légumes confits et nokoss corsé.",
    tags: [],
    bgColor: "#a63c1f",
  },
  {
    id: "d-fufu",
    name: "Fufu & sauce arachide",
    origin: "Yaoundé · Cameroun",
    region: "centrale",
    price: 14.8,
    rating: 4.5,
    reviews: 67,
    badge: "Réconfort",
    spicy: 2,
    time: "33 min",
    description:
      "Pâte onctueuse, sauce arachide légèrement fumée et légumes de saison.",
    tags: ["Végétarien"],
    bgColor: "#2d6b4e",
  },
];
