// Middleware de validation des données pour différentes routes

// Validation pour l'inscription
export const validerInscription = (req, res, next) => {
  const { nom, prenom, email, telephone, motDePasse, confirmationMotDePasse } = req.body;
  const erreurs = [];
  
  // Validation nom
  if (!nom || typeof nom !== 'string' || nom.trim().length < 2) {
    erreurs.push('Le nom doit contenir au moins 2 caractères');
  }
  
  // Validation prénom
  if (!prenom || typeof prenom !== 'string' || prenom.trim().length < 2) {
    erreurs.push('Le prénom doit contenir au moins 2 caractères');
  }
  
  // Validation email
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!email || !emailRegex.test(email)) {
    erreurs.push('Veuillez entrer un email valide');
  }
  
  // Validation téléphone
  const telephoneRegex = /^[\+]?[(]?[\d\s\-\(\)]{10,}$/;
  if (!telephone || !telephoneRegex.test(telephone)) {
    erreurs.push('Veuillez entrer un numéro de téléphone valide');
  }
  
  // Validation mot de passe
  if (!motDePasse || motDePasse.length < 6) {
    erreurs.push('Le mot de passe doit contenir au moins 6 caractères');
  }
  
  // Validation confirmation mot de passe
  if (motDePasse !== confirmationMotDePasse) {
    erreurs.push('Les mots de passe ne correspondent pas');
  }
  
  if (erreurs.length > 0) {
    const error = new Error(erreurs.join(', '));
    error.statusCode = 400;
    return next(error);
  }
  
  next();
};

// Validation pour la connexion
export const validerConnexion = (req, res, next) => {
  const { email, motDePasse } = req.body;
  const erreurs = [];
  
  if (!email || email.trim() === '') {
    erreurs.push('L\'email est obligatoire');
  }
  
  if (!motDePasse || motDePasse.trim() === '') {
    erreurs.push('Le mot de passe est obligatoire');
  }
  
  if (erreurs.length > 0) {
    const error = new Error(erreurs.join(', '));
    error.statusCode = 400;
    return next(error);
  }
  
  next();
};

// Validation pour la création/modification de plat
export const validerPlat = (req, res, next) => {
  const { nom, description, prix, categorie, origineAfricaine } = req.body;
  const erreurs = [];
  
  // Validation nom
  if (!nom || typeof nom !== 'string' || nom.trim().length < 3) {
    erreurs.push('Le nom du plat doit contenir au moins 3 caractères');
  }
  
  // Validation description
  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    erreurs.push('La description doit contenir au moins 10 caractères');
  }
  
  // Validation prix
  if (!prix || typeof prix !== 'number' || prix <= 0) {
    erreurs.push('Le prix doit être un nombre positif');
  }
  
  // Validation catégorie
  const categoriesValides = [
    'entrees', 'plats-principaux', 'accompagnements', 'desserts', 
    'boissons', 'specialites-africaines', 'vegetarien', 'vegan'
  ];
  if (!categorie || !categoriesValides.includes(categorie)) {
    erreurs.push('Catégorie invalide');
  }
  
  // Validation origine africaine
  if (!origineAfricaine || !origineAfricaine.pays) {
    erreurs.push('Le pays d\'origine est obligatoire');
  }
  
  const paysValides = [
    'cameroun', 'benin', 'senegal', 'cote-ivoire', 'mali', 
    'burkina-faso', 'ghana', 'togo', 'niger', 'guinee', 'multiple'
  ];
  if (origineAfricaine && origineAfricaine.pays && !paysValides.includes(origineAfricaine.pays)) {
    erreurs.push('Pays d\'origine invalide');
  }
  
  if (erreurs.length > 0) {
    const error = new Error(erreurs.join(', '));
    error.statusCode = 400;
    return next(error);
  }
  
  next();
};

// Validation pour la création de commande
export const validerCommande = (req, res, next) => {
  const { articles, adresseLivraison, methodePaiement } = req.body;
  const erreurs = [];
  
  // Validation articles
  if (!articles || !Array.isArray(articles) || articles.length === 0) {
    erreurs.push('Au moins un article est requis');
  }
  
  if (articles) {
    articles.forEach((article, index) => {
      if (!article.platId) {
        erreurs.push(`Article ${index + 1}: ID du plat manquant`);
      }
      if (!article.quantite || article.quantite < 1) {
        erreurs.push(`Article ${index + 1}: Quantité invalide`);
      }
    });
  }
  
  // Validation adresse de livraison
  if (!adresseLivraison) {
    erreurs.push('L\'adresse de livraison est obligatoire');
  } else {
    if (!adresseLivraison.adresse || adresseLivraison.adresse.trim() === '') {
      erreurs.push('L\'adresse est obligatoire');
    }
    if (!adresseLivraison.ville || adresseLivraison.ville.trim() === '') {
      erreurs.push('La ville est obligatoire');
    }
    if (!adresseLivraison.codePostal || adresseLivraison.codePostal.trim() === '') {
      erreurs.push('Le code postal est obligatoire');
    }
  }
  
  // Validation méthode de paiement
  const methodesValides = ['carte', 'especes', 'mobile', 'virement'];
  if (!methodePaiement || !methodesValides.includes(methodePaiement)) {
    erreurs.push('Méthode de paiement invalide');
  }
  
  if (erreurs.length > 0) {
    const error = new Error(erreurs.join(', '));
    error.statusCode = 400;
    return next(error);
  }
  
  next();
};

// Validation pour les avis
export const validerAvis = (req, res, next) => {
  const { note, commentaire, platId, commandeId } = req.body;
  const erreurs = [];
  
  // Validation note
  if (!note || typeof note !== 'number' || note < 1 || note > 5) {
    erreurs.push('La note doit être un nombre entre 1 et 5');
  }
  
  // Validation commentaire
  if (!commentaire || typeof commentaire !== 'string' || commentaire.trim().length < 10) {
    erreurs.push('Le commentaire doit contenir au moins 10 caractères');
  }
  
  if (commentaire && commentaire.length > 500) {
    erreurs.push('Le commentaire ne peut pas dépasser 500 caractères');
  }
  
  // Validation IDs
  if (!platId) {
    erreurs.push('L\'ID du plat est obligatoire');
  }
  
  if (!commandeId) {
    erreurs.push('L\'ID de la commande est obligatoire');
  }
  
  if (erreurs.length > 0) {
    const error = new Error(erreurs.join(', '));
    error.statusCode = 400;
    return next(error);
  }
  
  next();
};

// Validation pour les adresses
export const validerAdresse = (req, res, next) => {
  const { nom, adresse, ville, codePostal } = req.body;
  const erreurs = [];
  
  if (!nom || nom.trim() === '') {
    erreurs.push('Le nom de l\'adresse est obligatoire');
  }
  
  if (!adresse || adresse.trim() === '') {
    erreurs.push('L\'adresse est obligatoire');
  }
  
  if (!ville || ville.trim() === '') {
    erreurs.push('La ville est obligatoire');
  }
  
  if (!codePostal || codePostal.trim() === '') {
    erreurs.push('Le code postal est obligatoire');
  }
  
  // Validation code postal français
  const codePostalRegex = /^[0-9]{5}$/;
  if (codePostal && !codePostalRegex.test(codePostal)) {
    erreurs.push('Le code postal doit contenir 5 chiffres');
  }
  
  if (erreurs.length > 0) {
    const error = new Error(erreurs.join(', '));
    error.statusCode = 400;
    return next(error);
  }
  
  next();
};

// Validation pour la mise à jour du profil
export const validerProfilUpdate = (req, res, next) => {
  const { nom, prenom, telephone } = req.body;
  const erreurs = [];
  
  if (nom && (typeof nom !== 'string' || nom.trim().length < 2)) {
    erreurs.push('Le nom doit contenir au moins 2 caractères');
  }
  
  if (prenom && (typeof prenom !== 'string' || prenom.trim().length < 2)) {
    erreurs.push('Le prénom doit contenir au moins 2 caractères');
  }
  
  if (telephone) {
    const telephoneRegex = /^[\+]?[(]?[\d\s\-\(\)]{10,}$/;
    if (!telephoneRegex.test(telephone)) {
      erreurs.push('Veuillez entrer un numéro de téléphone valide');
    }
  }
  
  if (erreurs.length > 0) {
    const error = new Error(erreurs.join(', '));
    error.statusCode = 400;
    return next(error);
  }
  
  next();
};

// Validation pour le changement de mot de passe
export const validerChangementMotDePasse = (req, res, next) => {
  const { ancienMotDePasse, nouveauMotDePasse, confirmationNouveauMotDePasse } = req.body;
  const erreurs = [];
  
  if (!ancienMotDePasse || ancienMotDePasse.trim() === '') {
    erreurs.push('L\'ancien mot de passe est obligatoire');
  }
  
  if (!nouveauMotDePasse || nouveauMotDePasse.length < 6) {
    erreurs.push('Le nouveau mot de passe doit contenir au moins 6 caractères');
  }
  
  if (nouveauMotDePasse !== confirmationNouveauMotDePasse) {
    erreurs.push('La confirmation du nouveau mot de passe ne correspond pas');
  }
  
  if (ancienMotDePasse === nouveauMotDePasse) {
    erreurs.push('Le nouveau mot de passe doit être différent de l\'ancien');
  }
  
  if (erreurs.length > 0) {
    const error = new Error(erreurs.join(', '));
    error.statusCode = 400;
    return next(error);
  }
  
  next();
};

import { isValidId } from '../utils/serialize.js';

// Validation générique pour les IDs (cuid / uuid / ObjectId legacy)
export const validerId = (nomParam = 'id') => {
  return (req, res, next) => {
    const id = req.params[nomParam];

    if (!id) {
      const error = new Error(`Paramètre ${nomParam} manquant`);
      error.statusCode = 400;
      return next(error);
    }

    if (!isValidId(id)) {
      const error = new Error(`${nomParam} invalide`);
      error.statusCode = 400;
      return next(error);
    }

    next();
  };
};


// Validation pour les paramètres de pagination
export const validerPagination = (req, res, next) => {
  const { page, limite } = req.query;
  
  if (page) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      const error = new Error('Le numéro de page doit être un entier positif');
      error.statusCode = 400;
      return next(error);
    }
  }
  
  if (limite) {
    const limiteNum = parseInt(limite);
    if (isNaN(limiteNum) || limiteNum < 1 || limiteNum > 100) {
      const error = new Error('La limite doit être entre 1 et 100');
      error.statusCode = 400;
      return next(error);
    }
  }
  
  next();
};

// Validation pour les filtres de prix
export const validerFiltresPrix = (req, res, next) => {
  const { prixMin, prixMax } = req.query;
  
  if (prixMin) {
    const prixMinNum = parseFloat(prixMin);
    if (isNaN(prixMinNum) || prixMinNum < 0) {
      const error = new Error('Le prix minimum doit être un nombre positif');
      error.statusCode = 400;
      return next(error);
    }
  }
  
  if (prixMax) {
    const prixMaxNum = parseFloat(prixMax);
    if (isNaN(prixMaxNum) || prixMaxNum < 0) {
      const error = new Error('Le prix maximum doit être un nombre positif');
      error.statusCode = 400;
      return next(error);
    }
  }
  
  if (prixMin && prixMax) {
    const prixMinNum = parseFloat(prixMin);
    const prixMaxNum = parseFloat(prixMax);
    if (prixMinNum >= prixMaxNum) {
      const error = new Error('Le prix minimum doit être inférieur au prix maximum');
      error.statusCode = 400;
      return next(error);
    }
  }
  
  next();
};

// Validation pour les uploads de fichiers
export const validerUploadImage = (req, res, next) => {
  if (!req.file && !req.files) {
    const error = new Error('Aucun fichier fourni');
    error.statusCode = 400;
    return next(error);
  }
  
  const fichier = req.file || (req.files && req.files[0]);
  
  if (!fichier) {
    const error = new Error('Fichier invalide');
    error.statusCode = 400;
    return next(error);
  }
  
  // Vérifier le type de fichier
  const typesAutorises = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!typesAutorises.includes(fichier.mimetype)) {
    const error = new Error('Type de fichier non autorisé. Seules les images sont acceptées (JPEG, PNG, GIF, WEBP)');
    error.statusCode = 400;
    return next(error);
  }
  
  // Vérifier la taille du fichier (max 5MB)
  const tailleMax = 5 * 1024 * 1024; // 5MB
  if (fichier.size > tailleMax) {
    const error = new Error('Le fichier est trop volumineux. Taille maximum: 5MB');
    error.statusCode = 400;
    return next(error);
  }
  
  next();
};

export default {
  validerInscription,
  validerConnexion,
  validerPlat,
  validerCommande,
  validerAvis,
  validerAdresse,
  validerProfilUpdate,
  validerChangementMotDePasse,
  validerId,
  validerPagination,
  validerFiltresPrix,
  validerUploadImage
};