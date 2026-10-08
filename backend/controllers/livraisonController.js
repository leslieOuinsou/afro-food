import prisma from '../lib/prisma.js';
import { CRENEAUX_DEFAUT, enregistrerCreneaux, enregistrerZones, evaluerLivraison, genererCreneaux, lireCreneaux, lireZones } from '../utils/zones.js';

export async function parametresLivraisonDefaut() {
  const s = await prisma.setting.findUnique({ where: { cle: 'admin' } });
  const v = s?.valeur || {};
  return {
    fraisStandard: Number(v.livraison?.fraisStandard ?? v.fraisLivraison ?? 3.9),
    seuilGratuit: Number(v.livraison?.seuilGratuit ?? v.montantMinimum ?? 30),
  };
}

/** POST /api/livraison/estimer { codePostal, ville, sousTotal } — public : l'adresse est-elle desservie, et à quel prix ? */
export const estimerLivraison = async (req, res, next) => {
  try {
    const { codePostal, ville } = req.body ?? {};
    const sousTotal = Math.max(0, Number(req.body?.sousTotal) || 0);
    const [config, defauts] = await Promise.all([lireZones(prisma), parametresLivraisonDefaut()]);
    res.json({ success: true, data: evaluerLivraison(config, { codePostal, ville }, sousTotal, defauts) });
  } catch (e) {
    next(e);
  }
};

/** Créneaux libres (capacité non atteinte) pour les prochains jours. */
export async function creneauxDisponibles(maintenant = new Date()) {
  const config = await lireCreneaux(prisma);
  if (!config.actif) return { config, creneaux: [] };
  const tous = genererCreneaux(config, maintenant);
  if (tous.length === 0) return { config, creneaux: [] };
  const pris = await prisma.commande.groupBy({
    by: ['creneauLivraison'],
    where: {
      creneauLivraison: { in: tous.map((c) => c.debut) },
      statut: { notIn: ['annulee', 'remboursee'] },
    },
    _count: true,
  });
  const compte = new Map(pris.map((p) => [p.creneauLivraison.getTime(), p._count]));
  return {
    config,
    creneaux: tous
      .map((c) => ({ ...c, restant: Math.max(0, config.capaciteParCreneau - (compte.get(c.debut.getTime()) ?? 0)) }))
      .filter((c) => c.restant > 0),
  };
}

/** GET /api/livraison/creneaux — public */
export const listerCreneaux = async (req, res, next) => {
  try {
    const { config, creneaux } = await creneauxDisponibles();
    res.json({
      success: true,
      data: {
        actif: config.actif,
        creneaux: creneaux.map((c) => ({ jour: c.jour, heure: c.heure, debut: c.debut.toISOString() })),
      },
    });
  } catch (e) {
    next(e);
  }
};

// ───────────── Administration ─────────────
export const lireReglagesLivraison = async (req, res, next) => {
  try {
    res.json({ success: true, data: { zones: await lireZones(prisma), creneaux: await lireCreneaux(prisma), defauts: await parametresLivraisonDefaut() } });
  } catch (e) {
    next(e);
  }
};
export const majZones = async (req, res, next) => {
  try {
    res.json({ success: true, message: 'Zones enregistrées', data: await enregistrerZones(prisma, req.body) });
  } catch (e) {
    next(e);
  }
};
export const majCreneaux = async (req, res, next) => {
  try {
    res.json({ success: true, message: 'Créneaux enregistrés', data: await enregistrerCreneaux(prisma, req.body ?? CRENEAUX_DEFAUT) });
  } catch (e) {
    next(e);
  }
};
