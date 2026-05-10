/** Données fictives pour les pages de prévisualisation des e-mails. */

export const mockWelcome = {
  prenom: "Marie",
  nom: "Dupont",
  codePromo: "BIENVENUE10",
};

export const mockReview = {
  prenom: "Aminata",
  nomProduit: "Mafé de bœuf & riz parfumé",
  imageProduit:
    "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=240&q=80",
  reviewPageUrl: "/produit/demo/avis",
  remerciMessage:
    "Merci d’avoir goûté à ce plat. Votre retour nous aide à garder la même exigence — et si quelque chose n’était pas comme vous l’imaginiez, écrivez-nous : on préfère toujours savoir.",
};

export const mockAbandonedCart = {
  prenom: "Kofi",
  cartUrl: "/panier",
  articles: [
    {
      nom: "Mafé de bœuf",
      image:
        "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&q=80",
      prix: 12.9,
      stockRestant: 4,
    },
    {
      nom: "Attiéké poisson",
      image:
        "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80",
      prix: 9.5,
      stockRestant: 20,
    },
    {
      nom: "Salade colorée",
      image:
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
      prix: 7.2,
      stockMessage: "D’autres clients regardent aussi ce plat.",
    },
    {
      nom: "Brochettes suya",
      image:
        "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80",
      prix: 11,
      quantite: 2,
      stockRestant: 30,
    },
  ],
};

export const mockOrder = {
  prenom: "Jean",
  numero: "AE-28491",
  dateCmd: "9 avril 2026 à 14:32",
  articles: [
    {
      nom: "Poulet DG",
      image:
        "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=120&q=80",
      qty: 2,
      ligne: "28,00 €",
    },
    {
      nom: "Alloco",
      image:
        "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=120&q=80",
      qty: 1,
      ligne: "5,50 €",
    },
  ],
  adresse: "12 rue des Épices<br />75011 Paris<br />France",
  sousTotal: "33,50 €",
  livraison: "3,99 €",
  total: "37,49 €",
};

export const mockExpedition = {
  prenom: "Jean",
  numero: "AE-28491",
  numeroSuivi: "FR-8892103344",
  transporteur: "Colissimo",
  dateEst: "Jeudi 10 avril 2026 · matin",
  recap: "· Poulet DG × 2\n· Alloco × 1",
};

export const mockAuth = {
  prenom: "Léa",
  nom: "Martin",
  actionUrl: "/reset-password?token=demo",
};

export const mockPromo = {
  prenom: "Léa",
  titre: "Le marché du week-end",
  contenu:
    "Cette semaine, direction les sauces maison et les jus de bissap : plein de nouveautés au catalogue. Idéal pour un dîner sans prise de tête.",
  codePromo: "MARCHE15",
};

export const mockOrderStatus = {
  prenom: "Jean",
  numero: "AE-28491",
  statut: "en_livraison" as const,
};
