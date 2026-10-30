import prisma from '../lib/prisma.js';

/**
 * GET /api/recommandations?platId=&limite=6
 * Heuristique : même catégorie / même pays / populaires, hors plat courant.
 */
export const recommandations = async (req, res, next) => {
  try {
    const limite = Math.max(1, Math.min(12, parseInt(req.query.limite, 10) || 6));
    const platId = req.query.platId;

    let base = null;
    if (platId) {
      base = await prisma.plat.findUnique({ where: { id: platId } });
    }

    let preferesIds = [];
    if (req.utilisateur?.id) {
      const hist = await prisma.articleCommande.findMany({
        where: { commande: { clientId: req.utilisateur.id, statut: { notIn: ['annulee'] } } },
        select: { platId: true },
        take: 40,
        orderBy: { commande: { createdAt: 'desc' } },
      });
      preferesIds = [...new Set(hist.map((h) => h.platId))];
    }

    const where = {
      disponible: true,
      enRupture: false,
      ...(platId ? { id: { not: platId } } : {}),
    };

    let candidats = [];
    if (base) {
      const pays = base.origineAfricaine?.pays;
      candidats = await prisma.plat.findMany({
        where: {
          ...where,
          OR: [
            { categorie: base.categorie },
            ...(pays ? [{ origineAfricaine: { path: ['pays'], equals: pays } }] : []),
            ...(preferesIds.length ? [{ id: { in: preferesIds } }] : []),
          ],
        },
        orderBy: [{ notemoyenne: 'desc' }, { nombreCommandes: 'desc' }],
        take: limite * 2,
      });
    }

    if (candidats.length < limite) {
      const extra = await prisma.plat.findMany({
        where: {
          ...where,
          id: { notIn: [platId, ...candidats.map((c) => c.id)].filter(Boolean) },
        },
        orderBy: [{ estMisEnAvant: 'desc' }, { nombreCommandes: 'desc' }],
        take: limite,
      });
      candidats = [...candidats, ...extra];
    }

    const seen = new Set();
    const plats = [];
    for (const p of candidats) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      plats.push({
        id: p.id,
        _id: p.id,
        nom: p.nom,
        slug: p.slug,
        prix: p.prix,
        prixPromo: p.prixPromo,
        images: p.images,
        notemoyenne: p.notemoyenne,
        categorie: p.categorie,
      });
      if (plats.length >= limite) break;
    }

    res.json({ success: true, data: { plats } });
  } catch (e) {
    next(e);
  }
};
