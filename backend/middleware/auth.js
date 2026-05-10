import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

// Middleware pour vérifier l'authentification JWT
export const protegerRoute = async (req, res, next) => {
  try {
    let token;
    
    // Vérifier la présence du token dans le header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Récupérer le token du header Authorization
      token = req.headers.authorization.split(' ')[1];
    } 
    // Vérifier la présence du token dans les cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    // Vérifier si le token existe
    if (!token) {
      const error = new Error('Accès refusé. Token d\'authentification manquant');
      error.statusCode = 401;
      return next(error);
    }
    
    // Vérifier et décoder le token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Récupérer l'utilisateur actuel
      const utilisateurActuel = await User.findById(decoded.id);
      
      if (!utilisateurActuel) {
        const error = new Error('L\'utilisateur associé à ce token n\'existe plus');
        error.statusCode = 401;
        return next(error);
      }
      
      // Vérifier si le compte est actif
      if (!utilisateurActuel.estActif) {
        const error = new Error('Votre compte a été désactivé');
        error.statusCode = 401;
        return next(error);
      }
      
      // Ajouter l'utilisateur à la requête
      req.utilisateur = utilisateurActuel;
      next();
      
    } catch (jwtError) {
      let message = 'Token invalide';
      
      if (jwtError.name === 'TokenExpiredError') {
        message = 'Token expiré. Veuillez vous reconnecter';
      } else if (jwtError.name === 'JsonWebTokenError') {
        message = 'Token malformé';
      }
      
      const error = new Error(message);
      error.statusCode = 401;
      return next(error);
    }
    
  } catch (error) {
    next(error);
  }
};

// Middleware pour restreindre l'accès selon les rôles
export const restreindreAcces = (...rolesAutorises) => {
  return (req, res, next) => {
    // Vérifier que l'utilisateur est authentifié
    if (!req.utilisateur) {
      const error = new Error('Vous devez être connecté pour accéder à cette ressource');
      error.statusCode = 401;
      return next(error);
    }
    
    // Vérifier si le rôle de l'utilisateur est autorisé
    if (!rolesAutorises.includes(req.utilisateur.role)) {
      const error = new Error('Vous n\'avez pas les permissions nécessaires pour accéder à cette ressource');
      error.statusCode = 403;
      return next(error);
    }
    
    next();
  };
};

// Middleware pour les routes optionnellement authentifiées
export const authentificationOptionnelle = async (req, res, next) => {
  try {
    let token;
    
    // Récupérer le token s'il existe
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    // Si pas de token, continuer sans authentification
    if (!token) {
      return next();
    }
    
    try {
      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const utilisateurActuel = await User.findById(decoded.id);
      
      // Si utilisateur trouvé et actif, l'ajouter à la requête
      if (utilisateurActuel && utilisateurActuel.estActif) {
        req.utilisateur = utilisateurActuel;
      }
    } catch (jwtError) {
      // En cas d'erreur de token, continuer sans authentification
      // (pas d'erreur retournée car l'authentification est optionnelle)
    }
    
    next();
    
  } catch (error) {
    next(error);
  }
};

// Middleware pour vérifier si l'utilisateur est le propriétaire de la ressource
export const verifierProprietaire = (champId = 'id', champUtilisateur = 'client') => {
  return async (req, res, next) => {
    try {
      const ressourceId = req.params[champId];
      
      if (!ressourceId) {
        const error = new Error('ID de ressource manquant');
        error.statusCode = 400;
        return next(error);
      }
      
      // Les admins ont accès à toutes les ressources
      if (req.utilisateur.role === 'admin') {
        return next();
      }
      
      // Pour les autres utilisateurs, vérifier la propriété
      // Cette logique sera adaptée selon le modèle de données
      req.verifierProprietaire = {
        ressourceId,
        champUtilisateur,
        utilisateurId: req.utilisateur.id
      };
      
      next();
      
    } catch (error) {
      next(error);
    }
  };
};

// Middleware pour logger les tentatives d'authentification
export const loggerAuthentification = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const route = req.originalUrl;
  const methode = req.method;
  
  // En mode développement, logger les tentatives
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔐 Tentative d'authentification: ${methode} ${route} - IP: ${ip}`);
  }
  
  // Ajouter les informations à la requête pour un logging plus avancé
  req.infoAuthentification = {
    ip,
    userAgent,
    timestamp: new Date()
  };
  
  next();
};

// Middleware de limitation du taux de requêtes (rate limiting) basique
export const limiteurTaux = (maxRequetes = 100, fenetreMs = 15 * 60 * 1000) => {
  const requetes = new Map();
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const maintenant = Date.now();
    const fenetreDebut = maintenant - fenetreMs;
    
    // Nettoyer les anciennes entrées
    for (const [cle, donnees] of requetes) {
      if (donnees.timestamp < fenetreDebut) {
        requetes.delete(cle);
      }
    }
    
    // Vérifier le nombre de requêtes pour cette IP
    const donneesIp = requetes.get(ip) || { count: 0, timestamp: maintenant };
    
    if (donneesIp.timestamp < fenetreDebut) {
      // Nouvelle fenêtre, réinitialiser
      donneesIp.count = 1;
      donneesIp.timestamp = maintenant;
    } else {
      donneesIp.count++;
    }
    
    requetes.set(ip, donneesIp);
    
    // Vérifier la limite
    if (donneesIp.count > maxRequetes) {
      const error = new Error('Trop de requêtes. Veuillez réessayer plus tard');
      error.statusCode = 429;
      return next(error);
    }
    
    // Ajouter des headers informatifs (valeurs en string pour conformité HTTP)
    res.setHeader('X-RateLimit-Limit', String(maxRequetes));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, maxRequetes - donneesIp.count)));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil((maintenant + fenetreMs) / 1000)));
    
    next();
  };
};

// Middleware pour valider les permissions spécifiques
export const validerPermissions = (permissions) => {
  return (req, res, next) => {
    if (!req.utilisateur) {
      const error = new Error('Authentification requise');
      error.statusCode = 401;
      return next(error);
    }
    
    // Logique de validation des permissions
    // Peut être étendue selon les besoins spécifiques
    const rolePermissions = {
      admin: ['*'], // Toutes les permissions
      livreur: ['commandes:read', 'commandes:update_statut', 'profil:update'],
      client: ['commandes:create', 'commandes:read_own', 'profil:update', 'avis:create']
    };
    
    const permissionsUtilisateur = rolePermissions[req.utilisateur.role] || [];
    
    // Vérifier si l'utilisateur a toutes les permissions
    const aLesPermissions = permissions.every(permission => 
      permissionsUtilisateur.includes('*') || 
      permissionsUtilisateur.includes(permission)
    );
    
    if (!aLesPermissions) {
      const error = new Error('Permissions insuffisantes');
      error.statusCode = 403;
      return next(error);
    }
    
    next();
  };
};

// Middleware pour détecter les comptes suspendus ou bannis
export const verifierStatutCompte = async (req, res, next) => {
  try {
    if (!req.utilisateur) {
      return next();
    }
    
    // Recharger l'utilisateur pour avoir les informations les plus récentes
    const utilisateur = await User.findById(req.utilisateur.id);
    
    if (!utilisateur) {
      const error = new Error('Compte utilisateur non trouvé');
      error.statusCode = 401;
      return next(error);
    }
    
    if (!utilisateur.estActif) {
      const error = new Error('Votre compte a été suspendu. Contactez le support');
      error.statusCode = 403;
      return next(error);
    }
    
    // Mettre à jour l'objet utilisateur dans la requête
    req.utilisateur = utilisateur;
    next();
    
  } catch (error) {
    next(error);
  }
};

// Middleware pour vérifier l'email vérifié (optionnel)
export const exigerEmailVerifie = (req, res, next) => {
  if (!req.utilisateur) {
    const error = new Error('Authentification requise');
    error.statusCode = 401;
    return next(error);
  }
  
  if (!req.utilisateur.emailVerifie) {
    const error = new Error('Vous devez vérifier votre email avant d\'accéder à cette fonctionnalité');
    error.statusCode = 403;
    return next(error);
  }
  
  next();
};

export default {
  protegerRoute,
  restreindreAcces,
  authentificationOptionnelle,
  verifierProprietaire,
  loggerAuthentification,
  limiteurTaux,
  validerPermissions,
  verifierStatutCompte,
  exigerEmailVerifie
};