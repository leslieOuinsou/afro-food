import prisma from '../lib/prisma.js';

/** GET /api/abonnements/moi */
export const monAbonnement = async (req, res, next) => {
  try {
    const abo = await prisma.abonnement.findFirst({
      where: { userId: req.utilisateur.id, statut: { in: ['actif', 'pause'] } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: { abonnement: abo } });
  } catch (e) {
    next(e);
  }
};

/** POST /api/abonnements { frequence, tailleBox, preferences } */
export const creerAbonnement = async (req, res, next) => {
  try {
    const frequence = ['hebdo', 'bihebdo'].includes(req.body?.frequence) ? req.body.frequence : 'hebdo';
    const tailleBox = Math.max(2, Math.min(8, Number(req.body?.tailleBox) || 4));
    const existant = await prisma.abonnement.findFirst({
      where: { userId: req.utilisateur.id, statut: { in: ['actif', 'pause'] } },
    });
    if (existant) {
      const error = new Error('Vous avez déjà un abonnement actif');
      error.statusCode = 409;
      return next(error);
    }
    const jours = frequence === 'hebdo' ? 7 : 14;
    const prochainCreneau = new Date(Date.now() + jours * 24 * 60 * 60 * 1000);
    const abo = await prisma.abonnement.create({
      data: {
        userId: req.utilisateur.id,
        frequence,
        tailleBox,
        preferences: req.body?.preferences || {},
        prochainCreneau,
      },
    });
    res.status(201).json({ success: true, data: { abonnement: abo } });
  } catch (e) {
    next(e);
  }
};

/** PATCH /api/abonnements/:id { statut: pause|actif|annule, ... } */
export const majAbonnement = async (req, res, next) => {
  try {
    const abo = await prisma.abonnement.findUnique({ where: { id: req.params.id } });
    if (!abo || abo.userId !== req.utilisateur.id) {
      const error = new Error('Abonnement introuvable');
      error.statusCode = 404;
      return next(error);
    }
    const data = {};
    if (['actif', 'pause', 'annule'].includes(req.body?.statut)) data.statut = req.body.statut;
    if (req.body?.frequence && ['hebdo', 'bihebdo'].includes(req.body.frequence)) data.frequence = req.body.frequence;
    if (req.body?.tailleBox) data.tailleBox = Math.max(2, Math.min(8, Number(req.body.tailleBox)));
    if (req.body?.preferences) data.preferences = req.body.preferences;
    const updated = await prisma.abonnement.update({ where: { id: abo.id }, data });
    res.json({ success: true, data: { abonnement: updated } });
  } catch (e) {
    next(e);
  }
};
