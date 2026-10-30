import prisma from '../lib/prisma.js';
import { verifierAlerteStock } from '../utils/stock.js';

/** GET /api/stock/alertes — admin */
export const listerAlertes = async (req, res, next) => {
  try {
    const alertes = await prisma.alerteStock.findMany({
      where: { traitee: false },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const platIds = [...new Set(alertes.map((a) => a.platId))];
    const plats = await prisma.plat.findMany({
      where: { id: { in: platIds } },
      select: { id: true, nom: true, quantiteDisponible: true, enRupture: true },
    });
    const map = Object.fromEntries(plats.map((p) => [p.id, p]));
    res.json({
      success: true,
      data: {
        alertes: alertes.map((a) => ({ ...a, plat: map[a.platId] || null })),
      },
    });
  } catch (e) {
    next(e);
  }
};

/** POST /api/stock/alertes/:id/traiter */
export const traiterAlerte = async (req, res, next) => {
  try {
    const a = await prisma.alerteStock.update({
      where: { id: req.params.id },
      data: { traitee: true, traiteeLe: new Date() },
    });
    res.json({ success: true, data: { alerte: a } });
  } catch (e) {
    next(e);
  }
};

/** POST /api/stock/scan — rescanne tous les plats à quantité limitée */
export const scannerStock = async (req, res, next) => {
  try {
    const plats = await prisma.plat.findMany({
      where: { quantiteDisponible: { not: null } },
      select: { id: true, nom: true, quantiteDisponible: true, enRupture: true },
    });
    let nouvelles = 0;
    for (const p of plats) {
      const avant = await prisma.alerteStock.count({
        where: { platId: p.id, traitee: false },
      });
      await verifierAlerteStock(p);
      const apres = await prisma.alerteStock.count({
        where: { platId: p.id, traitee: false },
      });
      if (apres > avant) nouvelles += 1;
    }
    res.json({ success: true, data: { scannees: plats.length, nouvelles } });
  } catch (e) {
    next(e);
  }
};
