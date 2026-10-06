import prisma from '../lib/prisma.js';
import { serialize } from '../utils/serialize.js';

const TYPES_REMISE = ['pourcentage', 'fixe', 'livraison'];

function erreur(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

/** Valide et normalise le corps de requête. `partiel` = PUT/PATCH (champs optionnels). */
function lireCorps(body, partiel = false) {
  const data = {};

  if (body.code !== undefined || !partiel) {
    const code = String(body.code ?? '').trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
      throw erreur('Code invalide (3 à 30 caractères : lettres, chiffres, - ou _)');
    }
    data.code = code;
  }

  if (body.typeRemise !== undefined || !partiel) {
    const type = body.typeRemise ?? 'pourcentage';
    if (!TYPES_REMISE.includes(type)) throw erreur('Type de remise invalide');
    data.typeRemise = type;
  }

  if (data.typeRemise === 'livraison') {
    data.valeur = 0; // livraison offerte : pas de valeur
  } else if (body.valeur !== undefined || !partiel) {
    const valeur = Number(body.valeur);
    if (!Number.isFinite(valeur) || valeur <= 0) throw erreur('Valeur de remise invalide');
    data.valeur = valeur;
  }

  if (body.description !== undefined) data.description = body.description ? String(body.description).trim() : null;
  if (body.actif !== undefined) data.actif = Boolean(body.actif);

  if (body.montantMax !== undefined) {
    if (body.montantMax === null || body.montantMax === '') data.montantMax = null;
    else {
      const m = Number(body.montantMax);
      if (!Number.isFinite(m) || m <= 0) throw erreur('Montant maximum invalide');
      data.montantMax = m;
    }
  }

  if (body.montantMinimum !== undefined) {
    if (body.montantMinimum === null || body.montantMinimum === '') data.montantMinimum = null;
    else {
      const m = Number(body.montantMinimum);
      if (!Number.isFinite(m) || m <= 0) throw erreur('Montant minimum invalide');
      data.montantMinimum = m;
    }
  }

  if (body.usageParClient !== undefined) {
    if (body.usageParClient === null || body.usageParClient === '') data.usageParClient = null;
    else {
      const u = Number(body.usageParClient);
      if (!Number.isInteger(u) || u < 1) throw erreur("Nombre d'utilisations par client invalide");
      data.usageParClient = u;
    }
  }

  if (body.premiereCommandeSeulement !== undefined) {
    data.premiereCommandeSeulement = Boolean(body.premiereCommandeSeulement);
  }

  if (body.categories !== undefined) {
    if (!Array.isArray(body.categories)) throw erreur('Catégories invalides');
    data.categories = [...new Set(body.categories.map((c) => String(c).trim()).filter(Boolean))];
  }

  if (body.utilisationsMax !== undefined) {
    if (body.utilisationsMax === null || body.utilisationsMax === '') data.utilisationsMax = null;
    else {
      const u = Number(body.utilisationsMax);
      if (!Number.isInteger(u) || u < 1) throw erreur("Nombre d'utilisations maximum invalide");
      data.utilisationsMax = u;
    }
  }

  for (const champ of ['dateDebut', 'dateFin']) {
    if (body[champ] === undefined) continue;
    if (body[champ] === null || body[champ] === '') {
      if (champ === 'dateFin') data.dateFin = null;
      continue;
    }
    const d = new Date(body[champ]);
    if (Number.isNaN(d.getTime())) throw erreur(`${champ} invalide`);
    data[champ] = d;
  }

  if (data.dateDebut && data.dateFin && data.dateFin < data.dateDebut) {
    throw erreur('La date de fin précède la date de début');
  }
  if (data.typeRemise === 'pourcentage' && data.valeur > 100) {
    throw erreur('Un pourcentage ne peut pas dépasser 100');
  }

  return data;
}

/** GET /api/promos?actif=true&recherche=abc */
export const listerPromos = async (req, res, next) => {
  try {
    const { actif, recherche } = req.query;
    const where = {};
    if (actif === 'true') where.actif = true;
    if (actif === 'false') where.actif = false;
    if (recherche) where.code = { contains: String(recherche).trim(), mode: 'insensitive' };

    const promos = await prisma.promoCode.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: { promos: serialize(promos) } });
  } catch (error) {
    next(error);
  }
};

/** POST /api/promos */
export const creerPromo = async (req, res, next) => {
  try {
    const data = lireCorps(req.body);
    const promo = await prisma.promoCode.create({ data });
    res.status(201).json({ success: true, message: 'Code promo créé', data: { promo: serialize(promo) } });
  } catch (error) {
    if (error.code === 'P2002') return next(erreur('Ce code existe déjà', 409));
    next(error);
  }
};

/** PUT /api/promos/:id */
export const modifierPromo = async (req, res, next) => {
  try {
    const data = lireCorps(req.body, true);
    const promo = await prisma.promoCode.update({ where: { id: req.params.id }, data });
    res.json({ success: true, message: 'Code promo mis à jour', data: { promo: serialize(promo) } });
  } catch (error) {
    if (error.code === 'P2025') return next(erreur('Code promo introuvable', 404));
    if (error.code === 'P2002') return next(erreur('Ce code existe déjà', 409));
    next(error);
  }
};

/** PATCH /api/promos/:id/actif — bascule l'état actif */
export const basculerPromo = async (req, res, next) => {
  try {
    const existant = await prisma.promoCode.findUnique({ where: { id: req.params.id } });
    if (!existant) throw erreur('Code promo introuvable', 404);
    const promo = await prisma.promoCode.update({
      where: { id: existant.id },
      data: { actif: !existant.actif },
    });
    res.json({ success: true, data: { promo: serialize(promo) } });
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/promos/:id */
export const supprimerPromo = async (req, res, next) => {
  try {
    await prisma.promoCode.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Code promo supprimé' });
  } catch (error) {
    if (error.code === 'P2025') return next(erreur('Code promo introuvable', 404));
    next(error);
  }
};
