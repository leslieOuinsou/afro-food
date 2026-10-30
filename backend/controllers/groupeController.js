import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { isValidId } from '../utils/serialize.js';

function codeGroupe() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = 'GRP-';
  for (let i = 0; i < 6; i += 1) s += alphabet[crypto.randomInt(alphabet.length)];
  return s;
}

/** POST /api/groupe — créer un panier partagé */
export const creerGroupe = async (req, res, next) => {
  try {
    const expireLe = new Date(Date.now() + 4 * 60 * 60 * 1000);
    let created;
    for (let i = 0; i < 6; i += 1) {
      try {
        created = await prisma.panierGroupe.create({
          data: {
            code: codeGroupe(),
            hoteId: req.utilisateur.id,
            articles: [],
            expireLe,
          },
        });
        break;
      } catch (err) {
        if (err.code !== 'P2002') throw err;
      }
    }
    if (!created) throw Object.assign(new Error('Impossible de créer le groupe'), { statusCode: 500 });
    res.status(201).json({
      success: true,
      data: { id: created.id, code: created.code, expireLe: created.expireLe },
    });
  } catch (e) {
    next(e);
  }
};

/** GET /api/groupe/:code */
export const lireGroupe = async (req, res, next) => {
  try {
    const g = await prisma.panierGroupe.findUnique({
      where: { code: String(req.params.code || '').toUpperCase() },
      include: { hote: { select: { id: true, prenom: true, nom: true } } },
    });
    if (!g || g.statut === 'ferme' || g.expireLe < new Date()) {
      const error = new Error('Groupe introuvable ou expiré');
      error.statusCode = 404;
      return next(error);
    }
    res.json({
      success: true,
      data: {
        id: g.id,
        code: g.code,
        statut: g.statut,
        hote: g.hote,
        articles: g.articles || [],
        expireLe: g.expireLe,
      },
    });
  } catch (e) {
    next(e);
  }
};

/** POST /api/groupe/:code/articles { platId, quantite, nom? } */
export const ajouterArticleGroupe = async (req, res, next) => {
  try {
    const g = await prisma.panierGroupe.findUnique({
      where: { code: String(req.params.code || '').toUpperCase() },
    });
    if (!g || g.statut !== 'ouvert' || g.expireLe < new Date()) {
      const error = new Error('Groupe fermé ou expiré');
      error.statusCode = 409;
      return next(error);
    }
    const { platId, quantite = 1 } = req.body || {};
    if (!isValidId(platId)) {
      const error = new Error('Plat invalide');
      error.statusCode = 400;
      return next(error);
    }
    const plat = await prisma.plat.findUnique({ where: { id: platId } });
    if (!plat || !plat.disponible || plat.enRupture) {
      const error = new Error('Plat indisponible');
      error.statusCode = 409;
      return next(error);
    }
    const prix = plat.prixPromo ?? plat.prix;
    const articles = Array.isArray(g.articles) ? [...g.articles] : [];
    articles.push({
      participantId: req.utilisateur?.id || null,
      nom: req.utilisateur ? `${req.utilisateur.prenom}` : req.body?.nom || 'Invité',
      platId,
      nomPlat: plat.nom,
      quantite: Math.max(1, Math.min(20, Number(quantite) || 1)),
      prixUnitaire: prix,
    });
    const updated = await prisma.panierGroupe.update({
      where: { id: g.id },
      data: { articles },
    });
    res.json({ success: true, data: { articles: updated.articles } });
  } catch (e) {
    next(e);
  }
};

/** POST /api/groupe/:code/fermer — hôte seulement : fige le panier pour checkout */
export const fermerGroupe = async (req, res, next) => {
  try {
    const g = await prisma.panierGroupe.findUnique({
      where: { code: String(req.params.code || '').toUpperCase() },
    });
    if (!g || g.hoteId !== req.utilisateur.id) {
      const error = new Error('Seul l’hôte peut finaliser');
      error.statusCode = 403;
      return next(error);
    }
    if (g.statut !== 'ouvert') {
      const error = new Error('Groupe déjà fermé');
      error.statusCode = 409;
      return next(error);
    }
    const articles = Array.isArray(g.articles) ? g.articles : [];
    if (articles.length === 0) {
      const error = new Error('Aucun article');
      error.statusCode = 400;
      return next(error);
    }
    const map = new Map();
    for (const a of articles) {
      const prev = map.get(a.platId) || { platId: a.platId, quantite: 0, nomPlat: a.nomPlat };
      prev.quantite += a.quantite;
      map.set(a.platId, prev);
    }
    await prisma.panierGroupe.update({
      where: { id: g.id },
      data: { statut: 'commande' },
    });
    res.json({
      success: true,
      data: {
        articlesCheckout: [...map.values()],
        code: g.code,
      },
    });
  } catch (e) {
    next(e);
  }
};
