import prisma from '../lib/prisma.js';

function slugify(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

/** GET /api/recettes — public */
export const listerRecettes = async (req, res, next) => {
  try {
    const recettes = await prisma.recette.findMany({
      where: { publie: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: { recettes } });
  } catch (e) {
    next(e);
  }
};

/** GET /api/recettes/:slug */
export const lireRecette = async (req, res, next) => {
  try {
    const recette = await prisma.recette.findFirst({
      where: {
        OR: [{ slug: req.params.slug }, { id: req.params.slug }],
        publie: true,
      },
    });
    if (!recette) {
      const error = new Error('Recette introuvable');
      error.statusCode = 404;
      return next(error);
    }
    let plat = null;
    if (recette.platId) {
      plat = await prisma.plat.findUnique({
        where: { id: recette.platId },
        select: { id: true, nom: true, slug: true, images: true, prix: true, disponible: true },
      });
    }
    res.json({ success: true, data: { recette, plat } });
  } catch (e) {
    next(e);
  }
};

/** POST /api/recettes — admin */
export const creerRecette = async (req, res, next) => {
  try {
    const { titre, resume, contenu, platId, paysOrigine, dureeMin, portions, imageUrl } = req.body || {};
    if (!titre || !resume || !contenu) {
      const error = new Error('titre, resume et contenu requis');
      error.statusCode = 400;
      return next(error);
    }
    let slug = slugify(titre);
    const exist = await prisma.recette.findUnique({ where: { slug } });
    if (exist) slug = `${slug}-${Date.now().toString(36)}`;
    const recette = await prisma.recette.create({
      data: {
        titre,
        slug,
        resume,
        contenu,
        platId: platId || null,
        paysOrigine: paysOrigine || null,
        dureeMin: dureeMin ? Number(dureeMin) : null,
        portions: portions ? Number(portions) : null,
        imageUrl: imageUrl || null,
      },
    });
    res.status(201).json({ success: true, data: { recette } });
  } catch (e) {
    next(e);
  }
};
