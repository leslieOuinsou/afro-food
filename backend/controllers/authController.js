import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { serialize, serializeUser } from '../utils/serialize.js';
import { envoyerEmailBienvenue, envoyerEmailResetMotDePasse } from '../utils/email.js';
import { assurerCodeBienvenue } from '../utils/recompenses.js';
import { assurerCodeParrain, lierParrain } from '../utils/parrainage.js';

const saltRounds = () => parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;

const hasherMotDePasse = async (motDePasse) => bcrypt.hash(motDePasse, saltRounds());

const genererToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const envoyerTokenReponse = (user, statusCode, res, message = 'Succès') => {
  const token = genererToken(user.id);
  const serialized = serializeUser(user);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      message,
      data: {
        user: {
          id: serialized.id,
          _id: serialized._id,
          nom: serialized.nom,
          prenom: serialized.prenom,
          email: serialized.email,
          telephone: serialized.telephone,
          role: serialized.role,
          emailVerifie: serialized.emailVerifie,
          telephoneVerifie: serialized.telephoneVerifie,
          avatar: serialized.avatar,
          adresses: serialized.adresses || [],
          preferences: serialized.preferences,
        },
        token,
      },
    });
};

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
      adresse,
      codeParrain,
    } = req.body;

    if (!nom || !prenom || !email || !telephone || !motDePasse) {
      const error = new Error('Tous les champs obligatoires doivent être remplis');
      error.statusCode = 400;
      return next(error);
    }

    if (motDePasse !== confirmationMotDePasse) {
      const error = new Error('Les mots de passe ne correspondent pas');
      error.statusCode = 400;
      return next(error);
    }

    if (!accepteCGU) {
      const error = new Error("Vous devez accepter les conditions générales d'utilisation");
      error.statusCode = 400;
      return next(error);
    }

    const emailNorm = email.toLowerCase().trim();
    const utilisateurExistant = await prisma.user.findFirst({
      where: {
        OR: [{ email: emailNorm }, { telephone }],
      },
    });

    if (utilisateurExistant) {
      const error = new Error('Un compte existe déjà avec cet email ou ce numéro de téléphone');
      error.statusCode = 409;
      return next(error);
    }

    const hash = await hasherMotDePasse(motDePasse);
    const tokenEmail = crypto.randomBytes(32).toString('hex');
    const tokenEmailHash = crypto.createHash('sha256').update(tokenEmail).digest('hex');

    const utilisateur = await prisma.user.create({
      data: {
        nom,
        prenom,
        email: emailNorm,
        telephone,
        motDePasse: hash,
        emailVerifie: process.env.REQUIRE_EMAIL_VERIFIED !== 'true',
        tokenVerificationEmail: tokenEmailHash,
        expirationTokenEmail: new Date(Date.now() + 48 * 60 * 60 * 1000),
        ...(adresse
          ? {
              adresses: {
                create: {
                  type: 'domicile',
                  nom: 'Adresse principale',
                  adresse: adresse.adresse,
                  ville: adresse.ville,
                  codePostal: adresse.codePostal,
                  pays: adresse.pays || 'France',
                  parDefaut: true,
                },
              },
            }
          : {}),
      },
      include: { adresses: true },
    });

    try {
      await assurerCodeParrain(utilisateur.id);
      if (codeParrain) await lierParrain(utilisateur.id, codeParrain);
    } catch (err) {
      console.warn('Parrainage non appliqué:', err.message);
    }

    // Bienvenue : l'e-mail n'empêche jamais l'inscription (attendu : sur Vercel, le traitement s'arrête avec la réponse)
    try {
      const codeBienvenue = await assurerCodeBienvenue();
      await envoyerEmailBienvenue(utilisateur.email, utilisateur, codeBienvenue);
    } catch (err) {
      console.warn('E-mail de bienvenue non envoyé:', err.message);
    }

    envoyerTokenReponse(utilisateur, 201, res, 'Inscription réussie');
  } catch (error) {
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'champ';
      const customError = new Error(`Un compte existe déjà avec ce ${field}`);
      customError.statusCode = 409;
      return next(customError);
    }
    next(error);
  }
};

export const connexion = async (req, res, next) => {
  try {
    const { email, motDePasse } = req.body;

    if (!email || !motDePasse) {
      const error = new Error('Email et mot de passe sont obligatoires');
      error.statusCode = 400;
      return next(error);
    }

    const utilisateur = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { adresses: true },
    });

    if (!utilisateur) {
      const error = new Error('Email ou mot de passe incorrect');
      error.statusCode = 401;
      return next(error);
    }

    const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
    if (!motDePasseValide) {
      const error = new Error('Email ou mot de passe incorrect');
      error.statusCode = 401;
      return next(error);
    }

    if (!utilisateur.estActif) {
      const error = new Error('Votre compte a été désactivé. Contactez le support');
      error.statusCode = 401;
      return next(error);
    }

    const misAJour = await prisma.user.update({
      where: { id: utilisateur.id },
      data: { derniereConnexion: new Date() },
      include: { adresses: true },
    });

    envoyerTokenReponse(misAJour, 200, res, 'Connexion réussie');
  } catch (error) {
    next(error);
  }
};

export const deconnexion = async (req, res, next) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({
      success: true,
      message: 'Déconnexion réussie',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export const obtenirProfil = async (req, res, next) => {
  try {
    const utilisateur = await prisma.user.findUnique({
      where: { id: req.utilisateur.id },
      include: {
        adresses: true,
        commandes: {
          select: {
            id: true,
            numeroCommande: true,
            statut: true,
            montants: true,
            dates: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        avis: {
          select: {
            id: true,
            platId: true,
            note: true,
            commentaire: true,
            createdAt: true,
            plat: { select: { id: true, nom: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!utilisateur) {
      const error = new Error('Utilisateur non trouvé');
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: 'Profil récupéré avec succès',
      data: { utilisateur: serializeUser(utilisateur) },
    });
  } catch (error) {
    next(error);
  }
};

export const mettreAJourProfil = async (req, res, next) => {
  try {
    const { nom, prenom, telephone, preferences, avatar } = req.body;
    const data = {};

    if (nom) data.nom = nom;
    if (prenom) data.prenom = prenom;
    if (telephone) data.telephone = telephone;
    if (preferences) data.preferences = preferences;
    if (avatar) data.avatar = avatar;

    const utilisateur = await prisma.user.update({
      where: { id: req.utilisateur.id },
      data,
      include: { adresses: true },
    });

    res.status(200).json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: { utilisateur: serializeUser(utilisateur) },
    });
  } catch (error) {
    if (error.code === 'P2025') {
      const customError = new Error('Utilisateur non trouvé');
      customError.statusCode = 404;
      return next(customError);
    }
    if (error.code === 'P2002') {
      const customError = new Error('Ce numéro de téléphone est déjà utilisé');
      customError.statusCode = 409;
      return next(customError);
    }
    next(error);
  }
};

export const changerMotDePasse = async (req, res, next) => {
  try {
    const { ancienMotDePasse, nouveauMotDePasse, confirmationNouveauMotDePasse } = req.body;

    if (!ancienMotDePasse || !nouveauMotDePasse || !confirmationNouveauMotDePasse) {
      const error = new Error('Tous les champs sont obligatoires');
      error.statusCode = 400;
      return next(error);
    }

    if (nouveauMotDePasse !== confirmationNouveauMotDePasse) {
      const error = new Error('Les nouveaux mots de passe ne correspondent pas');
      error.statusCode = 400;
      return next(error);
    }

    const utilisateur = await prisma.user.findUnique({
      where: { id: req.utilisateur.id },
    });

    if (!utilisateur) {
      const error = new Error('Utilisateur non trouvé');
      error.statusCode = 404;
      return next(error);
    }

    const ancienMotDePasseValide = await bcrypt.compare(ancienMotDePasse, utilisateur.motDePasse);
    if (!ancienMotDePasseValide) {
      const error = new Error("L'ancien mot de passe est incorrect");
      error.statusCode = 401;
      return next(error);
    }

    await prisma.user.update({
      where: { id: utilisateur.id },
      data: { motDePasse: await hasherMotDePasse(nouveauMotDePasse) },
    });

    res.status(200).json({
      success: true,
      message: 'Mot de passe mis à jour avec succès',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export const ajouterAdresse = async (req, res, next) => {
  try {
    const { type, nom, adresse, ville, codePostal, pays, parDefaut } = req.body;

    if (!nom || !adresse || !ville || !codePostal) {
      const error = new Error('Tous les champs obligatoires doivent être remplis');
      error.statusCode = 400;
      return next(error);
    }

    const userId = req.utilisateur.id;
    const count = await prisma.adresse.count({ where: { userId } });

    const doitEtreDefaut = parDefaut || count === 0;

    if (doitEtreDefaut) {
      await prisma.adresse.updateMany({
        where: { userId },
        data: { parDefaut: false },
      });
    }

    const nouvelleAdresse = await prisma.adresse.create({
      data: {
        userId,
        type: type || 'domicile',
        nom,
        adresse,
        ville,
        codePostal,
        pays: pays || 'France',
        parDefaut: doitEtreDefaut,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Adresse ajoutée avec succès',
      data: { adresse: serialize(nouvelleAdresse) },
    });
  } catch (error) {
    next(error);
  }
};

export const supprimerAdresse = async (req, res, next) => {
  try {
    const { adresseId } = req.params;
    const userId = req.utilisateur.id;

    const adresse = await prisma.adresse.findFirst({
      where: { id: adresseId, userId },
    });

    if (!adresse) {
      const error = new Error('Adresse non trouvée');
      error.statusCode = 404;
      return next(error);
    }

    const count = await prisma.adresse.count({ where: { userId } });
    if (count === 1) {
      const error = new Error('Vous devez avoir au moins une adresse');
      error.statusCode = 400;
      return next(error);
    }

    const etaitParDefaut = adresse.parDefaut;
    await prisma.adresse.delete({ where: { id: adresseId } });

    if (etaitParDefaut) {
      const premiere = await prisma.adresse.findFirst({
        where: { userId },
        orderBy: { id: 'asc' },
      });
      if (premiere) {
        await prisma.adresse.update({
          where: { id: premiere.id },
          data: { parDefaut: true },
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Adresse supprimée avec succès',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export const verifierAuthentification = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Utilisateur authentifié',
      data: {
        utilisateur: {
          id: req.utilisateur.id,
          nom: req.utilisateur.nom,
          prenom: req.utilisateur.prenom,
          email: req.utilisateur.email,
          role: req.utilisateur.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const motDePasseOublie = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      const error = new Error("L'email est obligatoire");
      error.statusCode = 400;
      return next(error);
    }

    const utilisateur = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!utilisateur) {
      return res.status(200).json({
        success: true,
        message: 'Si un compte existe avec cet e-mail, un lien de réinitialisation a été envoyé.',
        data: null,
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await prisma.user.update({
      where: { id: utilisateur.id },
      data: {
        tokenResetMotDePasse: hashedResetToken,
        expirationTokenReset: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await envoyerEmailResetMotDePasse(utilisateur.email, resetToken, utilisateur);

    const responseData = process.env.NODE_ENV === 'development' ? { resetToken } : null;

    return res.status(200).json({
      success: true,
      message: 'Si un compte existe avec cet e-mail, un lien de réinitialisation a été envoyé.',
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

export const reinitialiserMotDePasse = async (req, res, next) => {
  try {
    const { token, motDePasse, confirmationMotDePasse } = req.body;

    if (!token || !motDePasse || !confirmationMotDePasse) {
      const error = new Error('Token et mots de passe sont obligatoires');
      error.statusCode = 400;
      return next(error);
    }

    if (motDePasse !== confirmationMotDePasse) {
      const error = new Error('Les mots de passe ne correspondent pas');
      error.statusCode = 400;
      return next(error);
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const utilisateur = await prisma.user.findFirst({
      where: {
        tokenResetMotDePasse: hashedToken,
        expirationTokenReset: { gt: new Date() },
      },
    });

    if (!utilisateur) {
      const error = new Error('Lien de réinitialisation invalide ou expiré');
      error.statusCode = 400;
      return next(error);
    }

    await prisma.user.update({
      where: { id: utilisateur.id },
      data: {
        motDePasse: await hasherMotDePasse(motDePasse),
        tokenResetMotDePasse: null,
        expirationTokenReset: null,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/** GET /api/auth/verifier-email?token= */
export const verifierEmail = async (req, res, next) => {
  try {
    const token = String(req.query.token || req.body?.token || '');
    if (!token) {
      const error = new Error('Token manquant');
      error.statusCode = 400;
      return next(error);
    }
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user = await prisma.user.findFirst({
      where: {
        tokenVerificationEmail: hashed,
        expirationTokenEmail: { gt: new Date() },
      },
    });
    if (!user) {
      const error = new Error('Lien de vérification invalide ou expiré');
      error.statusCode = 400;
      return next(error);
    }
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifie: true,
        tokenVerificationEmail: null,
        expirationTokenEmail: null,
      },
    });
    res.json({ success: true, message: 'E-mail vérifié' });
  } catch (e) {
    next(e);
  }
};

/**
 * POST /api/auth/google { credential } — Google Identity Services (JWT id_token).
 * Nécessite GOOGLE_CLIENT_ID.
 */
export const connexionGoogle = async (req, res, next) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      const error = new Error('Connexion Google non configurée');
      error.statusCode = 503;
      return next(error);
    }
    const credential = req.body?.credential;
    if (!credential) {
      const error = new Error('credential Google manquant');
      error.statusCode = 400;
      return next(error);
    }

    const resp = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );
    if (!resp.ok) {
      const error = new Error('Jeton Google invalide');
      error.statusCode = 401;
      return next(error);
    }
    const payload = await resp.json();
    if (payload.aud !== clientId) {
      const error = new Error('Audience Google invalide');
      error.statusCode = 401;
      return next(error);
    }
    if (payload.email_verified !== 'true' && payload.email_verified !== true) {
      const error = new Error('E-mail Google non vérifié');
      error.statusCode = 401;
      return next(error);
    }

    const email = String(payload.email).toLowerCase();
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId: payload.sub }, { email }] },
      include: { adresses: true },
    });

    if (!user) {
      const telPlaceholder = `g-${payload.sub.slice(-10)}`;
      user = await prisma.user.create({
        data: {
          nom: payload.family_name || 'Google',
          prenom: payload.given_name || email.split('@')[0],
          email,
          telephone: telPlaceholder,
          motDePasse: await hasherMotDePasse(crypto.randomBytes(24).toString('hex')),
          googleId: payload.sub,
          emailVerifie: true,
          avatar: payload.picture || null,
        },
        include: { adresses: true },
      });
      await assurerCodeParrain(user.id).catch(() => {});
      if (req.body?.codeParrain) await lierParrain(user.id, req.body.codeParrain).catch(() => {});
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: payload.sub, emailVerifie: true },
        include: { adresses: true },
      });
    }

    envoyerTokenReponse(user, 200, res, 'Connexion Google réussie');
  } catch (e) {
    next(e);
  }
};
