import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

function attacherUtilisateur(user) {
  return {
    ...user,
    id: user.id,
    _id: user.id,
  };
}

// Middleware pour vérifier l'authentification JWT
export const protegerRoute = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      const error = new Error("Accès refusé. Token d'authentification manquant");
      error.statusCode = 401;
      return next(error);
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const utilisateurActuel = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { adresses: true },
      });

      if (!utilisateurActuel) {
        const error = new Error("L'utilisateur associé à ce token n'existe plus");
        error.statusCode = 401;
        return next(error);
      }

      if (!utilisateurActuel.estActif) {
        const error = new Error('Votre compte a été désactivé');
        error.statusCode = 401;
        return next(error);
      }

      req.utilisateur = attacherUtilisateur(utilisateurActuel);
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

export const restreindreAcces = (...rolesAutorises) => {
  return (req, res, next) => {
    if (!req.utilisateur) {
      const error = new Error('Vous devez être connecté pour accéder à cette ressource');
      error.statusCode = 401;
      return next(error);
    }

    if (!rolesAutorises.includes(req.utilisateur.role)) {
      const error = new Error(
        "Vous n'avez pas les permissions nécessaires pour accéder à cette ressource"
      );
      error.statusCode = 403;
      return next(error);
    }

    next();
  };
};

export const authentificationOptionnelle = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const utilisateurActuel = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { adresses: true },
      });

      if (utilisateurActuel && utilisateurActuel.estActif) {
        req.utilisateur = attacherUtilisateur(utilisateurActuel);
      }
    } catch {
      // authentification optionnelle : ignorer les erreurs de token
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const verifierProprietaire = (champId = 'id', champUtilisateur = 'client') => {
  return async (req, res, next) => {
    try {
      const ressourceId = req.params[champId];

      if (!ressourceId) {
        const error = new Error('ID de ressource manquant');
        error.statusCode = 400;
        return next(error);
      }

      if (req.utilisateur.role === 'admin') {
        return next();
      }

      req.verifierProprietaire = {
        ressourceId,
        champUtilisateur,
        utilisateurId: req.utilisateur.id,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const loggerAuthentification = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const route = req.originalUrl;
  const methode = req.method;

  if (process.env.NODE_ENV === 'development') {
    console.log(`🔐 Tentative d'authentification: ${methode} ${route} - IP: ${ip}`);
  }

  req.infoAuthentification = {
    ip,
    userAgent,
    timestamp: new Date(),
  };

  next();
};

export const limiteurTaux = (maxRequetes = 100, fenetreMs = 15 * 60 * 1000) => {
  const requetes = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const maintenant = Date.now();
    const fenetreDebut = maintenant - fenetreMs;

    for (const [cle, donnees] of requetes) {
      if (donnees.timestamp < fenetreDebut) {
        requetes.delete(cle);
      }
    }

    const donneesIp = requetes.get(ip) || { count: 0, timestamp: maintenant };

    if (donneesIp.timestamp < fenetreDebut) {
      donneesIp.count = 1;
      donneesIp.timestamp = maintenant;
    } else {
      donneesIp.count++;
    }

    requetes.set(ip, donneesIp);

    if (donneesIp.count > maxRequetes) {
      const error = new Error('Trop de requêtes. Veuillez réessayer plus tard');
      error.statusCode = 429;
      return next(error);
    }

    res.setHeader('X-RateLimit-Limit', String(maxRequetes));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, maxRequetes - donneesIp.count)));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil((maintenant + fenetreMs) / 1000)));

    next();
  };
};

export const validerPermissions = (permissions) => {
  return (req, res, next) => {
    if (!req.utilisateur) {
      const error = new Error('Authentification requise');
      error.statusCode = 401;
      return next(error);
    }

    const rolePermissions = {
      admin: ['*'],
      livreur: ['commandes:read', 'commandes:update_statut', 'profil:update'],
      client: ['commandes:create', 'commandes:read_own', 'profil:update', 'avis:create'],
    };

    const permissionsUtilisateur = rolePermissions[req.utilisateur.role] || [];

    const aLesPermissions = permissions.every(
      (permission) =>
        permissionsUtilisateur.includes('*') || permissionsUtilisateur.includes(permission)
    );

    if (!aLesPermissions) {
      const error = new Error('Permissions insuffisantes');
      error.statusCode = 403;
      return next(error);
    }

    next();
  };
};

export const verifierStatutCompte = async (req, res, next) => {
  try {
    if (!req.utilisateur) {
      return next();
    }

    const utilisateur = await prisma.user.findUnique({
      where: { id: req.utilisateur.id },
      include: { adresses: true },
    });

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

    req.utilisateur = attacherUtilisateur(utilisateur);
    next();
  } catch (error) {
    next(error);
  }
};

export const exigerEmailVerifie = (req, res, next) => {
  if (!req.utilisateur) {
    const error = new Error('Authentification requise');
    error.statusCode = 401;
    return next(error);
  }

  if (!req.utilisateur.emailVerifie) {
    const error = new Error(
      "Vous devez vérifier votre email avant d'accéder à cette fonctionnalité"
    );
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
  exigerEmailVerifie,
};
