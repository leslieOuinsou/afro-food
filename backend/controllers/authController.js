import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

// Fonction utilitaire pour générer un token JWT
const genererToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Fonction utilitaire pour envoyer une réponse avec token
const envoyerTokenReponse = (user, statusCode, res, message = 'Succès') => {
  const token = genererToken(user._id);
  
  // Options du cookie
  const cookieOptions = {
    expires: new Date(
      Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 jours
    ),
    httpOnly: true, // Prévient les attaques XSS
    secure: process.env.NODE_ENV === 'production', // HTTPS seulement en production
    sameSite: 'strict' // Protection CSRF
  };
  
  res.status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      message,
      data: {
        user: {
          id: user._id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          telephone: user.telephone,
          role: user.role,
          emailVerifie: user.emailVerifie,
          telephoneVerifie: user.telephoneVerifie,
          avatar: user.avatar,
          adresses: user.adresses,
          preferences: user.preferences
        },
        token
      }
    });
};

// @desc    Inscription d'un nouvel utilisateur
// @route   POST /api/auth/inscription
// @access  Public
export const inscription = async (req, res, next) => {
  try {
    const {
      nom,
      prenom,
      email,
      telephone,
      motDePasse,
      confirmationMotDePasse,
      accepteCGU,
      adresse
    } = req.body;
    
    // Validation des champs requis
    if (!nom || !prenom || !email || !telephone || !motDePasse) {
      const error = new Error('Tous les champs obligatoires doivent être remplis');
      error.statusCode = 400;
      return next(error);
    }
    
    // Vérification que les mots de passe correspondent
    if (motDePasse !== confirmationMotDePasse) {
      const error = new Error('Les mots de passe ne correspondent pas');
      error.statusCode = 400;
      return next(error);
    }
    
    // Vérification de l'acceptation des CGU
    if (!accepteCGU) {
      const error = new Error('Vous devez accepter les conditions générales d\'utilisation');
      error.statusCode = 400;
      return next(error);
    }
    
    // Vérifier si l'utilisateur existe déjà
    const utilisateurExistant = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { telephone }
      ]
    });
    
    if (utilisateurExistant) {
      const error = new Error('Un compte existe déjà avec cet email ou ce numéro de téléphone');
      error.statusCode = 409;
      return next(error);
    }
    
    // Créer l'utilisateur
    const utilisateurData = {
      nom,
      prenom,
      email: email.toLowerCase(),
      telephone,
      motDePasse
    };
    
    // Ajouter l'adresse si fournie
    if (adresse) {
      utilisateurData.adresses = [{
        type: 'domicile',
        nom: 'Adresse principale',
        adresse: adresse.adresse,
        ville: adresse.ville,
        codePostal: adresse.codePostal,
        pays: adresse.pays || 'France',
        parDefaut: true
      }];
    }
    
    const utilisateur = await User.create(utilisateurData);
    
    envoyerTokenReponse(utilisateur, 201, res, 'Inscription réussie');
    
  } catch (error) {
    // Gestion des erreurs de validation MongoDB
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      const customError = new Error(messages.join(', '));
      customError.statusCode = 400;
      return next(customError);
    }
    
    // Gestion des erreurs de duplicata
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const customError = new Error(`Un compte existe déjà avec ce ${field}`);
      customError.statusCode = 409;
      return next(customError);
    }
    
    next(error);
  }
};

// @desc    Connexion d'un utilisateur
// @route   POST /api/auth/connexion
// @access  Public
export const connexion = async (req, res, next) => {
  try {
    const { email, motDePasse } = req.body;
    
    // Validation des champs requis
    if (!email || !motDePasse) {
      const error = new Error('Email et mot de passe sont obligatoires');
      error.statusCode = 400;
      return next(error);
    }
    
    // Rechercher l'utilisateur avec le mot de passe
    const utilisateur = await User.rechercherParEmail(email);
    
    if (!utilisateur) {
      const error = new Error('Email ou mot de passe incorrect');
      error.statusCode = 401;
      return next(error);
    }
    
    // Vérifier le mot de passe
    const motDePasseValide = await utilisateur.verifierMotDePasse(motDePasse);
    
    if (!motDePasseValide) {
      const error = new Error('Email ou mot de passe incorrect');
      error.statusCode = 401;
      return next(error);
    }
    
    // Vérifier si le compte est actif
    if (!utilisateur.estActif) {
      const error = new Error('Votre compte a été désactivé. Contactez le support');
      error.statusCode = 401;
      return next(error);
    }
    
    // Mettre à jour la dernière connexion
    utilisateur.derniereConnexion = new Date();
    await utilisateur.save();
    
    envoyerTokenReponse(utilisateur, 200, res, 'Connexion réussie');
    
  } catch (error) {
    next(error);
  }
};

// @desc    Déconnexion de l'utilisateur
// @route   POST /api/auth/deconnexion
// @access  Private
export const deconnexion = async (req, res, next) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000), // Expire dans 10 secondes
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    res.status(200).json({
      success: true,
      message: 'Déconnexion réussie',
      data: null
    });
    
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir le profil de l'utilisateur connecté
// @route   GET /api/auth/profil
// @access  Private
export const obtenirProfil = async (req, res, next) => {
  try {
    const utilisateur = await User.findById(req.utilisateur.id)
      .populate('commandes', 'numeroCommande statut montants.total dates.commande')
      .populate('avis', 'plat note commentaire createdAt');
    
    if (!utilisateur) {
      const error = new Error('Utilisateur non trouvé');
      error.statusCode = 404;
      return next(error);
    }
    
    res.status(200).json({
      success: true,
      message: 'Profil récupéré avec succès',
      data: { utilisateur }
    });
    
  } catch (error) {
    next(error);
  }
};

// @desc    Mettre à jour le profil utilisateur
// @route   PUT /api/auth/profil
// @access  Private
export const mettreAJourProfil = async (req, res, next) => {
  try {
    const {
      nom,
      prenom,
      telephone,
      preferences,
      avatar
    } = req.body;
    
    const champsAMettreAJour = {};
    
    if (nom) champsAMettreAJour.nom = nom;
    if (prenom) champsAMettreAJour.prenom = prenom;
    if (telephone) champsAMettreAJour.telephone = telephone;
    if (preferences) champsAMettreAJour.preferences = preferences;
    if (avatar) champsAMettreAJour.avatar = avatar;
    
    const utilisateur = await User.findByIdAndUpdate(
      req.utilisateur.id,
      champsAMettreAJour,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!utilisateur) {
      const error = new Error('Utilisateur non trouvé');
      error.statusCode = 404;
      return next(error);
    }
    
    res.status(200).json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: { utilisateur }
    });
    
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      const customError = new Error(messages.join(', '));
      customError.statusCode = 400;
      return next(customError);
    }
    next(error);
  }
};

// @desc    Changer le mot de passe
// @route   PUT /api/auth/mot-de-passe
// @access  Private
export const changerMotDePasse = async (req, res, next) => {
  try {
    const { ancienMotDePasse, nouveauMotDePasse, confirmationNouveauMotDePasse } = req.body;
    
    // Validation des champs requis
    if (!ancienMotDePasse || !nouveauMotDePasse || !confirmationNouveauMotDePasse) {
      const error = new Error('Tous les champs sont obligatoires');
      error.statusCode = 400;
      return next(error);
    }
    
    // Vérifier que les nouveaux mots de passe correspondent
    if (nouveauMotDePasse !== confirmationNouveauMotDePasse) {
      const error = new Error('Les nouveaux mots de passe ne correspondent pas');
      error.statusCode = 400;
      return next(error);
    }
    
    // Récupérer l'utilisateur avec le mot de passe
    const utilisateur = await User.findById(req.utilisateur.id).select('+motDePasse');
    
    // Vérifier l'ancien mot de passe
    const ancienMotDePasseValide = await utilisateur.verifierMotDePasse(ancienMotDePasse);
    
    if (!ancienMotDePasseValide) {
      const error = new Error('L\'ancien mot de passe est incorrect');
      error.statusCode = 401;
      return next(error);
    }
    
    // Mettre à jour le mot de passe
    utilisateur.motDePasse = nouveauMotDePasse;
    await utilisateur.save();
    
    res.status(200).json({
      success: true,
      message: 'Mot de passe mis à jour avec succès',
      data: null
    });
    
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      const customError = new Error(messages.join(', '));
      customError.statusCode = 400;
      return next(customError);
    }
    next(error);
  }
};

// @desc    Gérer les adresses utilisateur
// @route   POST /api/auth/adresses
// @access  Private
export const ajouterAdresse = async (req, res, next) => {
  try {
    const { type, nom, adresse, ville, codePostal, pays, parDefaut } = req.body;
    
    // Validation des champs requis
    if (!nom || !adresse || !ville || !codePostal) {
      const error = new Error('Tous les champs obligatoires doivent être remplis');
      error.statusCode = 400;
      return next(error);
    }
    
    const utilisateur = await User.findById(req.utilisateur.id);
    
    if (!utilisateur) {
      const error = new Error('Utilisateur non trouvé');
      error.statusCode = 404;
      return next(error);
    }
    
    // Si cette adresse doit être par défaut, retirer le défaut des autres
    if (parDefaut) {
      utilisateur.adresses.forEach(addr => {
        addr.parDefaut = false;
      });
    }
    
    const nouvelleAdresse = {
      type: type || 'domicile',
      nom,
      adresse,
      ville,
      codePostal,
      pays: pays || 'France',
      parDefaut: parDefaut || (utilisateur.adresses.length === 0) // Première adresse = défaut
    };
    
    utilisateur.adresses.push(nouvelleAdresse);
    await utilisateur.save();
    
    res.status(201).json({
      success: true,
      message: 'Adresse ajoutée avec succès',
      data: { 
        adresse: utilisateur.adresses[utilisateur.adresses.length - 1]
      }
    });
    
  } catch (error) {
    next(error);
  }
};

// @desc    Supprimer une adresse
// @route   DELETE /api/auth/adresses/:adresseId
// @access  Private
export const supprimerAdresse = async (req, res, next) => {
  try {
    const { adresseId } = req.params;
    
    const utilisateur = await User.findById(req.utilisateur.id);
    
    if (!utilisateur) {
      const error = new Error('Utilisateur non trouvé');
      error.statusCode = 404;
      return next(error);
    }
    
    const adresse = utilisateur.adresses.id(adresseId);
    
    if (!adresse) {
      const error = new Error('Adresse non trouvée');
      error.statusCode = 404;
      return next(error);
    }
    
    // Ne pas permettre la suppression s'il s'agit de la seule adresse
    if (utilisateur.adresses.length === 1) {
      const error = new Error('Vous devez avoir au moins une adresse');
      error.statusCode = 400;
      return next(error);
    }
    
    const etaitParDefaut = adresse.parDefaut;
    adresse.remove();
    
    // Si l'adresse supprimée était par défaut, définir une nouvelle par défaut
    if (etaitParDefaut && utilisateur.adresses.length > 0) {
      utilisateur.adresses[0].parDefaut = true;
    }
    
    await utilisateur.save();
    
    res.status(200).json({
      success: true,
      message: 'Adresse supprimée avec succès',
      data: null
    });
    
  } catch (error) {
    next(error);
  }
};

// @desc    Vérifier si l'utilisateur est authentifié
// @route   GET /api/auth/verifier
// @access  Private
export const verifierAuthentification = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Utilisateur authentifié',
      data: {
        utilisateur: {
          id: req.utilisateur._id,
          nom: req.utilisateur.nom,
          prenom: req.utilisateur.prenom,
          email: req.utilisateur.email,
          role: req.utilisateur.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};