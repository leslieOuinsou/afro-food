import prisma from '../lib/prisma.js';
import { canalCuisine, publier } from '../utils/events.js';

const STATUTS_KDS = ['confirmee', 'en_preparation', 'prete'];

/** GET /api/cuisine/file — file cuisine (KDS) */
export const fileCuisine = async (req, res, next) => {
  try {
    const commandes = await prisma.commande.findMany({
      where: { statut: { in: STATUTS_KDS } },
      include: {
        articles: true,
        client: { select: { id: true, prenom: true, nom: true } },
      },
      orderBy: [{ creneauLivraison: 'asc' }, { createdAt: 'asc' }],
      take: 80,
    });

    res.json({
      success: true,
      data: {
        file: commandes.map((c) => ({
          id: c.id,
          numeroCommande: c.numeroCommande,
          statut: c.statut,
          creneauLivraison: c.creneauLivraison,
          createdAt: c.createdAt,
          client: c.client,
          preferences: c.preferences,
          articles: c.articles.map((a) => ({
            nom: a.informationsPlat?.nom || 'Plat',
            quantite: a.quantite,
            instructions: a.instructions,
            variations: a.variations,
          })),
        })),
      },
    });
  } catch (e) {
    next(e);
  }
};

/** PATCH /api/cuisine/:id/statut { statut } — avancer une commande depuis le KDS */
export const avancerCuisine = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { statut } = req.body || {};
    if (!['en_preparation', 'prete'].includes(statut)) {
      const error = new Error('Statut cuisine invalide');
      error.statusCode = 400;
      return next(error);
    }

    const commande = await prisma.commande.findUnique({ where: { id } });
    if (!commande) {
      const error = new Error('Commande introuvable');
      error.statusCode = 404;
      return next(error);
    }
    if (!STATUTS_KDS.includes(commande.statut) && commande.statut !== 'confirmee') {
      const error = new Error('Commande hors file cuisine');
      error.statusCode = 409;
      return next(error);
    }

    const updated = await prisma.commande.update({
      where: { id },
      data: {
        statut,
        historiqueStatuts: {
          create: {
            statut,
            commentaire: `Cuisine → ${statut}`,
            modifieParId: req.utilisateur.id,
          },
        },
        dates: {
          ...(commande.dates || {}),
          [statut]: new Date().toISOString(),
        },
      },
    });

    publier(canalCuisine(), { type: 'statut', commandeId: id, statut });
    publier(`commande:${id}`, { type: 'statut', statut });

    res.json({ success: true, message: 'Statut mis à jour', data: { id: updated.id, statut: updated.statut } });
  } catch (e) {
    next(e);
  }
};
