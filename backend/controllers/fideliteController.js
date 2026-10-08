import prisma from '../lib/prisma.js';
import { codeFidelite, enregistrerFidelite, lireFidelite } from '../utils/fidelite.js';

const erreur = (message, statusCode) => Object.assign(new Error(message), { statusCode });

/** GET /api/fidelite — points, paliers et historique du client connecté */
export const maFidelite = async (req, res, next) => {
  try {
    const [config, user, mouvements, codes] = await Promise.all([
      lireFidelite(prisma),
      prisma.user.findUnique({ where: { id: req.utilisateur.id }, select: { pointsFidelite: true } }),
      prisma.mouvementPoints.findMany({ where: { userId: req.utilisateur.id }, orderBy: { createdAt: 'desc' }, take: 20 }),
      prisma.promoCode.findMany({
        where: { clientId: req.utilisateur.id, code: { startsWith: 'FIDELE-' } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { code: true, valeur: true, utilisations: true, dateFin: true, actif: true },
      }),
    ]);
    const points = user?.pointsFidelite ?? 0;
    const prochain = config.paliers.find((p) => p.points > points) ?? null;
    res.json({
      success: true,
      data: {
        actif: config.actif,
        pointsParEuro: config.pointsParEuro,
        points,
        paliers: config.paliers.map((p) => ({ ...p, accessible: points >= p.points })),
        prochainPalier: prochain ? { ...prochain, manque: prochain.points - points } : null,
        mouvements,
        codes,
      },
    });
  } catch (e) {
    next(e);
  }
};

/** POST /api/fidelite/echanger { points } — échange des points contre un code de réduction personnel */
export const echangerPoints = async (req, res, next) => {
  try {
    const config = await lireFidelite(prisma);
    if (!config.actif) throw erreur('Le programme de fidélité est désactivé', 409);
    const palier = config.paliers.find((p) => p.points === Math.floor(Number(req.body?.points)));
    if (!palier) throw erreur('Palier inconnu', 400);

    const resultat = await prisma.$transaction(async (tx) => {
      // Garde anti-double-clic : le débit n'a lieu que si le solde suffit au moment de l'écriture
      const { count } = await tx.user.updateMany({
        where: { id: req.utilisateur.id, pointsFidelite: { gte: palier.points } },
        data: { pointsFidelite: { decrement: palier.points } },
      });
      if (count !== 1) throw erreur('Points insuffisants', 409);
      let code = codeFidelite();
      for (let i = 0; i < 5 && (await tx.promoCode.findUnique({ where: { code } })); i += 1) code = codeFidelite();
      const dateFin = new Date(Date.now() + config.validiteJours * 24 * 3600 * 1000);
      const promo = await tx.promoCode.create({
        data: {
          code,
          description: `Fidélité : ${palier.remise} € de réduction (${palier.points} points)`,
          typeRemise: 'fixe',
          valeur: palier.remise,
          clientId: req.utilisateur.id,
          usageParClient: 1,
          utilisationsMax: 1,
          dateFin,
        },
      });
      await tx.mouvementPoints.create({
        data: { userId: req.utilisateur.id, delta: -palier.points, motif: `Échange contre ${code}` },
      });
      return promo;
    });
    res.status(201).json({ success: true, message: 'Code de réduction créé', data: { code: resultat.code, remise: palier.remise, dateFin: resultat.dateFin } });
  } catch (e) {
    next(e);
  }
};

/** GET/PUT /api/fidelite/config — réglages du programme (admin) */
export const lireConfigFidelite = async (req, res, next) => {
  try {
    res.json({ success: true, data: await lireFidelite(prisma) });
  } catch (e) {
    next(e);
  }
};
export const majConfigFidelite = async (req, res, next) => {
  try {
    res.json({ success: true, message: 'Programme enregistré', data: await enregistrerFidelite(prisma, req.body) });
  } catch (e) {
    next(e);
  }
};
