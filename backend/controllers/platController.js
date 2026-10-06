import prisma from '../lib/prisma.js';
import { genererSlug } from '../utils/helpers.js';
import {
  isValidId,
  serializeAvis,
  serializePlat,
} from '../utils/serialize.js';

const STATUTS_EN_COURS = [
  'en_attente',
  'confirmee',
  'en_preparation',
  'prete',
  'en_livraison',
];

function buildPlatWhere(query) {
  const {
    categorie,
    pays,
    prixMin,
    prixMax,
    noteMin,
    niveauEpice,
    vegetarien,
    disponibleSeulement = 'true',
    recherche,
  } = query;

  const where = {};

  if (categorie) where.categorie = categorie;
  if (niveauEpice) where.niveauEpice = niveauEpice;
  if (vegetarien === 'true') {
    where.regimesCompatibles = { hasSome: ['vegetarien', 'vegan'] };
  }
  if (disponibleSeulement === 'true') {
    where.disponible = true;
    where.enRupture = false;
  }
  if (prixMin != null && !isNaN(parseFloat(prixMin))) {
    where.prix = { ...(where.prix || {}), gte: parseFloat(prixMin) };
  }
  if (prixMax != null && !isNaN(parseFloat(prixMax))) {
    where.prix = { ...(where.prix || {}), lte: parseFloat(prixMax) };
  }
  if (noteMin != null && !isNaN(parseFloat(noteMin))) {
    where.notemoyenne = { gte: parseFloat(noteMin) };
  }
  if (pays) {
    where.origineAfricaine = {
      path: ['pays'],
      equals: pays,
    };
  }

  // idsRecherche : résultat de rechercherIds(), null si pas de terme
  if (query.idsRecherche) {
    where.id = { in: query.idsRecherche };
  }

  return where;
}

/**
 * Recherche tolérante aux accents et aux fautes de frappe (pg_trgm + unaccent).
 * Retourne les ids triés par pertinence.
 */
async function rechercherIds(terme, limite = 200) {
  const q = String(terme || '').trim().slice(0, 100);
  if (!q) return null;
  const rows = await prisma.$queryRaw`
    SELECT "id",
           GREATEST(
             similarity(f_unaccent(lower("nom")), f_unaccent(lower(${q}))),
             word_similarity(f_unaccent(lower(${q})), f_unaccent(lower("nom" || ' ' || "description")))
           ) AS score
    FROM "plats"
    WHERE f_unaccent(lower("nom" || ' ' || "description")) LIKE '%' || f_unaccent(lower(${q})) || '%'
       OR f_unaccent(lower(${q})) = ANY (SELECT f_unaccent(lower(t)) FROM unnest("tags") AS t)
       OR word_similarity(f_unaccent(lower(${q})), f_unaccent(lower("nom" || ' ' || "description"))) > 0.4
    ORDER BY score DESC, "nombreCommandes" DESC
    LIMIT ${limite}`;
  return rows.map((r) => r.id);
}

function buildPlatOrderBy(tri) {
  switch (tri) {
    case 'prix-asc':
      return [{ prix: 'asc' }, { nom: 'asc' }];
    case 'prix-desc':
      return [{ prix: 'desc' }, { nom: 'asc' }];
    case 'nom':
      return [{ nom: 'asc' }];
    case 'note':
      return [{ notemoyenne: 'desc' }, { nombreCommandes: 'desc' }];
    case 'nouveau':
      return [{ createdAt: 'desc' }];
    default:
      return [{ nombreCommandes: 'desc' }, { notemoyenne: 'desc' }];
  }
}

async function obtenirStatistiquesAvisPlat(platId) {
  const avis = await prisma.avis.findMany({
    where: { platId, statut: 'approuve' },
    select: { note: true, recommande: true },
  });

  if (avis.length === 0) {
    return {
      nombreTotal: 0,
      noteMoyenne: 0,
      repartitionNotes: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      pourcentageRecommandation: 0,
    };
  }

  const repartition = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let somme = 0;
  let recommandes = 0;
  for (const a of avis) {
    somme += a.note;
    if (repartition[a.note] !== undefined) repartition[a.note] += 1;
    if (a.recommande) recommandes += 1;
  }

  return {
    nombreTotal: avis.length,
    noteMoyenne: Math.round((somme / avis.length) * 10) / 10,
    repartitionNotes: repartition,
    pourcentageRecommandation: Math.round((recommandes / avis.length) * 100),
  };
}

async function obtenirAvisRecentsPlat(platId, limite = 5) {
  const avis = await prisma.avis.findMany({
    where: { platId, statut: 'approuve' },
    include: {
      utilisateur: { select: { id: true, nom: true, prenom: true, avatar: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limite,
  });
  return avis.map(serializeAvis);
}

function preparerDonneesPlat(body, { creeParAdminId } = {}) {
  const data = { ...body };
  delete data.id;
  delete data._id;
  delete data.creeParAdmin;
  delete data.creeParAdminId;

  if (data.nom && !data.slug) {
    data.slug = genererSlug(data.nom);
  }
  if (creeParAdminId) {
    data.creeParAdminId = creeParAdminId;
  }
  data.derniereModification = new Date();
  return data;
}

export const obtenirPlats = async (req, res, next) => {
  try {
    const {
      page = 1,
      limite = 20,
      tri = 'populaire',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limiteNum = Math.max(1, Math.min(100, parseInt(limite, 10) || 20));
    const skip = (pageNum - 1) * limiteNum;
    const idsRecherche =
      typeof req.query.recherche === 'string' ? await rechercherIds(req.query.recherche) : null;
    const where = buildPlatWhere({ ...req.query, idsRecherche });
    const orderBy = buildPlatOrderBy(tri);

    const [platsList, total] = await Promise.all([
      prisma.plat.findMany({ where, orderBy, skip, take: limiteNum }),
      prisma.plat.count({ where }),
    ]);

    const totalPages = limiteNum > 0 ? Math.ceil(total / limiteNum) : 0;

    res.status(200).json({
      success: true,
      message: 'Plats récupérés avec succès',
      data: { plats: platsList.map(serializePlat) },
      pagination: {
        pageActuelle: pageNum,
        totalPages,
        totalPlats: total,
        platsPourPage: limiteNum,
        aPrecedent: pageNum > 1,
        aSuivant: pageNum < totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const obtenirPlatParId = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      const error = new Error('ID de plat invalide');
      error.statusCode = 400;
      return next(error);
    }

    const plat = await prisma.plat.findUnique({
      where: { id },
      include: {
        creeParAdmin: { select: { id: true, nom: true, prenom: true } },
      },
    });

    if (!plat) {
      const error = new Error('Plat non trouvé');
      error.statusCode = 404;
      return next(error);
    }

    const [statistiquesAvis, avisRecents] = await Promise.all([
      obtenirStatistiquesAvisPlat(id),
      obtenirAvisRecentsPlat(id, 5),
    ]);

    res.status(200).json({
      success: true,
      message: 'Plat récupéré avec succès',
      data: {
        plat: serializePlat(plat),
        statistiquesAvis,
        avisRecents,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const obtenirPlatParSlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const plat = await prisma.plat.findUnique({
      where: { slug },
      include: {
        creeParAdmin: { select: { id: true, nom: true, prenom: true } },
      },
    });

    if (!plat) {
      const error = new Error('Plat non trouvé');
      error.statusCode = 404;
      return next(error);
    }

    const [statistiquesAvis, avisRecents] = await Promise.all([
      obtenirStatistiquesAvisPlat(plat.id),
      obtenirAvisRecentsPlat(plat.id, 5),
    ]);

    res.status(200).json({
      success: true,
      message: 'Plat récupéré avec succès',
      data: {
        plat: serializePlat(plat),
        statistiquesAvis,
        avisRecents,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const creerPlat = async (req, res, next) => {
  try {
    const data = preparerDonneesPlat(req.body, {
      creeParAdminId: req.utilisateur?.id,
    });

    if (!data.images) data.images = {};
    if (!data.origineAfricaine) {
      const error = new Error("L'origine africaine est obligatoire");
      error.statusCode = 400;
      return next(error);
    }

    const plat = await prisma.plat.create({ data });

    res.status(201).json({
      success: true,
      message: 'Plat créé avec succès',
      data: { plat: serializePlat(plat) },
    });
  } catch (error) {
    if (error.code === 'P2002') {
      const customError = new Error('Un plat avec ce slug existe déjà');
      customError.statusCode = 409;
      return next(customError);
    }
    next(error);
  }
};

export const mettreAJourPlat = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      const error = new Error('ID de plat invalide');
      error.statusCode = 400;
      return next(error);
    }

    const data = preparerDonneesPlat(req.body);
    if (data.nom && !req.body.slug) {
      data.slug = genererSlug(data.nom);
    }

    const plat = await prisma.plat.update({
      where: { id },
      data,
    });

    res.status(200).json({
      success: true,
      message: 'Plat mis à jour avec succès',
      data: { plat: serializePlat(plat) },
    });
  } catch (error) {
    if (error.code === 'P2025') {
      const customError = new Error('Plat non trouvé');
      customError.statusCode = 404;
      return next(customError);
    }
    if (error.code === 'P2002') {
      const customError = new Error('Un plat avec ce slug existe déjà');
      customError.statusCode = 409;
      return next(customError);
    }
    next(error);
  }
};

export const supprimerPlat = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      const error = new Error('ID de plat invalide');
      error.statusCode = 400;
      return next(error);
    }

    const plat = await prisma.plat.findUnique({ where: { id } });
    if (!plat) {
      const error = new Error('Plat non trouvé');
      error.statusCode = 404;
      return next(error);
    }

    const commandesEnCours = await prisma.articleCommande.count({
      where: {
        platId: id,
        commande: { statut: { in: STATUTS_EN_COURS } },
      },
    });

    if (commandesEnCours > 0) {
      const error = new Error(
        'Impossible de supprimer ce plat car il y a des commandes en cours'
      );
      error.statusCode = 400;
      return next(error);
    }

    await prisma.avis.deleteMany({ where: { platId: id } });
    await prisma.plat.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Plat supprimé avec succès',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export const obtenirPlatsPopulaires = async (req, res, next) => {
  try {
    const limite = Math.max(1, parseInt(req.params.limite, 10) || 10);
    const plats = await prisma.plat.findMany({
      where: { disponible: true, enRupture: false },
      orderBy: [{ nombreCommandes: 'desc' }, { notemoyenne: 'desc' }],
      take: limite,
    });

    res.status(200).json({
      success: true,
      message: 'Plats populaires récupérés avec succès',
      data: { plats: plats.map(serializePlat) },
    });
  } catch (error) {
    next(error);
  }
};

export const obtenirNouveautes = async (req, res, next) => {
  try {
    const limite = Math.max(1, parseInt(req.params.limite, 10) || 10);
    const maintenant = new Date();
    const plats = await prisma.plat.findMany({
      where: {
        disponible: true,
        OR: [
          { estNouveaute: true, dateFinNouveaute: null },
          { estNouveaute: true, dateFinNouveaute: { gt: maintenant } },
          { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limite,
    });

    res.status(200).json({
      success: true,
      message: 'Nouveautés récupérées avec succès',
      data: { plats: plats.map(serializePlat) },
    });
  } catch (error) {
    next(error);
  }
};

export const rechercherPlats = async (req, res, next) => {
  try {
    const { terme } = req.params;
    const {
      page = 1,
      limite = 20,
      categorie,
      pays,
      prixMin,
      prixMax,
      niveauEpice,
      vegetarien,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limiteNum = Math.max(1, Math.min(100, parseInt(limite, 10) || 20));

    const idsRecherche = (await rechercherIds(terme)) || [];
    const where = buildPlatWhere({
      categorie,
      pays,
      prixMin,
      prixMax,
      niveauEpice,
      vegetarien,
      disponibleSeulement: 'true',
      idsRecherche,
    });

    const trouves = await prisma.plat.findMany({ where });
    const rang = new Map(idsRecherche.map((id, i) => [id, i]));
    trouves.sort((a, b) => rang.get(a.id) - rang.get(b.id));
    const nombreTotal = trouves.length;
    const plats = trouves.slice((pageNum - 1) * limiteNum, pageNum * limiteNum);

    res.status(200).json({
      success: true,
      message: 'Recherche effectuée avec succès',
      data: {
        plats: plats.map(serializePlat),
        terme,
        nombreResultats: nombreTotal,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const obtenirCategories = async (req, res, next) => {
  try {
    const plats = await prisma.plat.findMany({
      select: { categorie: true, origineAfricaine: true },
    });

    const catMap = new Map();
    const paysMap = new Map();
    for (const p of plats) {
      if (p.categorie) {
        catMap.set(p.categorie, (catMap.get(p.categorie) || 0) + 1);
      }
      const pays = p.origineAfricaine?.pays;
      if (pays) {
        paysMap.set(pays, (paysMap.get(pays) || 0) + 1);
      }
    }

    const categories = [...catMap.entries()]
      .map(([categorie, nombre]) => ({ categorie, nombre }))
      .sort((a, b) => b.nombre - a.nombre);
    const pays = [...paysMap.entries()]
      .map(([p, nombre]) => ({ pays: p, nombre }))
      .sort((a, b) => b.nombre - a.nombre);

    res.status(200).json({
      success: true,
      message: 'Catégories récupérées avec succès',
      data: { categories, pays },
    });
  } catch (error) {
    next(error);
  }
};

export const mettreAJourDisponibilite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { disponible, enRupture, quantiteDisponible } = req.body;

    if (!isValidId(id)) {
      const error = new Error('ID de plat invalide');
      error.statusCode = 400;
      return next(error);
    }

    const data = { derniereModification: new Date() };
    if (disponible !== undefined) data.disponible = disponible;
    if (enRupture !== undefined) data.enRupture = enRupture;
    if (quantiteDisponible !== undefined) data.quantiteDisponible = quantiteDisponible;

    const plat = await prisma.plat.update({ where: { id }, data });

    res.status(200).json({
      success: true,
      message: 'Disponibilité mise à jour avec succès',
      data: { plat: serializePlat(plat) },
    });
  } catch (error) {
    if (error.code === 'P2025') {
      const customError = new Error('Plat non trouvé');
      customError.statusCode = 404;
      return next(customError);
    }
    next(error);
  }
};

export const mettreAJourPromotion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { prixPromo } = req.body;

    if (!isValidId(id)) {
      const error = new Error('ID de plat invalide');
      error.statusCode = 400;
      return next(error);
    }

    const plat = await prisma.plat.findUnique({ where: { id } });
    if (!plat) {
      const error = new Error('Plat non trouvé');
      error.statusCode = 404;
      return next(error);
    }

    if (prixPromo && prixPromo >= plat.prix) {
      const error = new Error('Le prix promotionnel doit être inférieur au prix normal');
      error.statusCode = 400;
      return next(error);
    }

    const misAJour = await prisma.plat.update({
      where: { id },
      data: {
        prixPromo: prixPromo || null,
        derniereModification: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Promotion mise à jour avec succès',
      data: { plat: serializePlat(misAJour) },
    });
  } catch (error) {
    next(error);
  }
};

// Helpers exportés pour avisController
export { obtenirStatistiquesAvisPlat };
