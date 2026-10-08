import prisma from '../lib/prisma.js';
import { isValidId } from '../utils/serialize.js';
import { pushVersUtilisateur } from '../utils/push.js';
import {
  DUREE_MAX_SESSION_MIN,
  DUREE_PREVUE_DEFAUT_H,
  PLAFOND_HEURES_JOUR_DEFAUT,
  TAUX_HORAIRE_DEFAUT,
  agregerJournees,
  arrondir,
  finDeCloture,
  jourParis,
  minutesEntre,
  montantPourMinutes,
  sessionExpiree,
} from '../utils/paie.js';

const erreur = (message, statusCode) => Object.assign(new Error(message), { statusCode });
const CLE_TAUX = 'taux_horaire_livreur';
const CLE_PLAFOND = 'plafond_heures_jour';

async function tauxHoraire() {
  const s = await prisma.setting.findUnique({ where: { cle: CLE_TAUX } });
  const t = Number(s?.valeur?.taux);
  return Number.isFinite(t) && t > 0 ? t : TAUX_HORAIRE_DEFAUT;
}

async function plafondHeures() {
  const s = await prisma.setting.findUnique({ where: { cle: CLE_PLAFOND } });
  const h = Number(s?.valeur?.heures);
  return Number.isFinite(h) && h >= 1 && h <= 24 ? h : PLAFOND_HEURES_JOUR_DEFAUT;
}

/**
 * Clôture les sessions oubliées : 30 min après l'heure prévue, la session est fermée à l'heure prévue.
 * Appelée à chaque lecture (livreur, admin) et chaque jour par le cron : aucune session ne reste ouverte indéfiniment.
 */
export async function cloturerSessionsExpirees(livreurId) {
  const ouvertes = await prisma.pointageLivreur.findMany({ where: { fin: null, ...(livreurId ? { livreurId } : {}) } });
  const maintenant = new Date();
  let nb = 0;
  for (const s of ouvertes) {
    if (!sessionExpiree(s, maintenant)) continue;
    const fin = finDeCloture(s.debut, s.finPrevue);
    const { count } = await prisma.pointageLivreur.updateMany({
      where: { id: s.id, fin: null },
      data: { fin: fin > s.debut ? fin : maintenant, clotureAuto: true },
    });
    if (count === 1) {
      nb += 1;
      await pushVersUtilisateur(s.livreurId, {
        titre: 'Service clôturé automatiquement',
        corps: `Votre service a été clôturé à ${fin.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })} (heure prévue). Contactez l'administration en cas d'erreur.`,
        url: '/livreur',
      }).catch(() => undefined);
    }
  }
  return nb;
}

/** Livraisons terminées (statut « livrée ») depuis une date, avec leur jour de livraison. */
async function livraisonsDepuis(depuis, livreurId) {
  const commandes = await prisma.commande.findMany({
    where: { statut: 'livree', livreurId: livreurId ?? { not: null }, updatedAt: { gte: depuis } },
    select: { livreurId: true, dates: true, updatedAt: true },
  });
  return commandes.map((c) => ({ livreurId: c.livreurId, jour: jourParis(c.dates?.livraison ?? c.updatedAt) }));
}

const decalerJours = (n) => new Date(Date.now() - n * 24 * 3600 * 1000);

// ───────────── Livreur ─────────────

/** POST /api/paie/pointage/debut */
export const debutPointage = async (req, res, next) => {
  try {
    await cloturerSessionsExpirees(req.utilisateur.id);
    const ouvert = await prisma.pointageLivreur.findFirst({ where: { livreurId: req.utilisateur.id, fin: null } });
    if (ouvert) throw erreur('Une session est déjà en cours', 409);
    const heures = Number(req.body?.dureeHeures ?? DUREE_PREVUE_DEFAUT_H);
    if (!Number.isFinite(heures) || heures < 1 || heures > DUREE_MAX_SESSION_MIN / 60) {
      throw erreur(`Durée prévue invalide (1 à ${DUREE_MAX_SESSION_MIN / 60} h)`, 400);
    }
    const maintenant = new Date();
    const pointage = await prisma.pointageLivreur.create({
      data: {
        livreurId: req.utilisateur.id,
        debut: maintenant,
        jour: jourParis(maintenant),
        finPrevue: new Date(maintenant.getTime() + heures * 3600 * 1000),
      },
    });
    res.status(201).json({ success: true, message: 'Bonne journée !', data: { pointage } });
  } catch (e) {
    next(e);
  }
};

/** POST /api/paie/pointage/fin */
export const finPointage = async (req, res, next) => {
  try {
    const ouvert = await prisma.pointageLivreur.findFirst({ where: { livreurId: req.utilisateur.id, fin: null } });
    if (!ouvert) throw erreur('Aucune session en cours', 409);
    const maj = await prisma.pointageLivreur.updateMany({
      where: { id: ouvert.id, fin: null },
      data: { fin: new Date() },
    });
    if (maj.count !== 1) throw erreur('Session déjà terminée', 409);
    res.json({ success: true, message: 'Session terminée' });
  } catch (e) {
    next(e);
  }
};

/** POST /api/paie/pointage/prolonger { heures } — repousse l'heure de fin prévue (par pas d'une heure, 14 h au total) */
export const prolongerPointage = async (req, res, next) => {
  try {
    await cloturerSessionsExpirees(req.utilisateur.id);
    const ouvert = await prisma.pointageLivreur.findFirst({ where: { livreurId: req.utilisateur.id, fin: null } });
    if (!ouvert) throw erreur('Aucune session en cours', 409);
    const heures = Math.min(4, Math.max(1, Number(req.body?.heures) || 1));
    const base = Math.max(new Date(ouvert.finPrevue ?? ouvert.debut).getTime(), Date.now());
    const plafond = new Date(ouvert.debut).getTime() + DUREE_MAX_SESSION_MIN * 60000;
    const nouvelle = new Date(Math.min(base + heures * 3600 * 1000, plafond));
    if (nouvelle.getTime() <= Date.now()) throw erreur('Durée maximale atteinte : terminez votre service', 409);
    await prisma.pointageLivreur.update({ where: { id: ouvert.id }, data: { finPrevue: nouvelle } });
    res.json({ success: true, message: 'Service prolongé', data: { finPrevue: nouvelle } });
  } catch (e) {
    next(e);
  }
};

/** GET /api/paie/mon-pointage — état du jour et historique des 14 derniers jours */
export const monPointage = async (req, res, next) => {
  try {
    const id = req.utilisateur.id;
    await cloturerSessionsExpirees(id);
    const depuis = decalerJours(15);
    const [taux, plafond, pointages, livraisons, paies] = await Promise.all([
      tauxHoraire(),
      plafondHeures(),
      prisma.pointageLivreur.findMany({ where: { livreurId: id, debut: { gte: depuis } }, orderBy: { debut: 'desc' } }),
      livraisonsDepuis(depuis, id),
      prisma.paieLivreur.findMany({
        where: { livreurId: id, createdAt: { gte: depuis } },
        select: { jour: true, montant: true, minutes: true, createdAt: true },
      }),
    ]);
    const ouvert = pointages.find((p) => !p.fin) ?? null;
    const aujourdhui = jourParis(new Date());
    const jours = agregerJournees(pointages, livraisons, taux, plafond).map((j) => {
      const payeJour = arrondir(paies.filter((p) => p.jour === j.jour).reduce((t, p) => t + p.montant, 0));
      return { ...j, montantPaye: payeJour };
    });
    const jourCourant = jours.find((j) => j.jour === aujourdhui);
    const minutesOuverte = ouvert ? minutesEntre(ouvert.debut, new Date()) : 0;
    res.json({
      success: true,
      data: {
        tauxHoraire: taux,
        enService: Boolean(ouvert),
        debutSession: ouvert?.debut ?? null,
        finPrevue: ouvert?.finPrevue ?? null,
        plafondHeures: plafond,
        aujourdhui: {
          minutes: (jourCourant ? jourCourant.minutesAPayer + jourCourant.minutesPayees : 0) + minutesOuverte,
          nbLivraisons: jourCourant?.nbLivraisons ?? 0,
          gainEstime: montantPourMinutes((jourCourant ? jourCourant.minutesAPayer + jourCourant.minutesPayees : 0) + minutesOuverte, taux),
        },
        jours,
      },
    });
  } catch (e) {
    next(e);
  }
};

// ───────────── Admin ─────────────

/** GET /api/paie/admin/resume?du=AAAA-MM-JJ&au=AAAA-MM-JJ */
export const resume = async (req, res, next) => {
  try {
    const jourRe = /^\d{4}-\d{2}-\d{2}$/;
    const au = jourRe.test(req.query.au) ? req.query.au : jourParis(new Date());
    const du = jourRe.test(req.query.du) ? req.query.du : jourParis(decalerJours(13));
    await cloturerSessionsExpirees();
    const [taux, plafond] = await Promise.all([tauxHoraire(), plafondHeures()]);
    const [livreurs, pointages, livraisons] = await Promise.all([
      prisma.user.findMany({ where: { role: 'livreur' }, select: { id: true, nom: true, prenom: true, telephone: true } }),
      prisma.pointageLivreur.findMany({ where: { jour: { gte: du, lte: au } } }),
      livraisonsDepuis(decalerJours(60)).then((l) => l.filter((x) => x.jour >= du && x.jour <= au)),
    ]);
    const parId = new Map(livreurs.map((l) => [l.id, l]));
    const journees = agregerJournees(pointages, livraisons, taux, plafond).map((j) => ({
      ...j,
      livreur: parId.get(j.livreurId) ? { _id: j.livreurId, ...parId.get(j.livreurId), id: undefined } : null,
    }));
    const totalAPayer = arrondir(journees.reduce((t, j) => t + j.montantAPayer, 0));
    res.json({ success: true, data: { tauxHoraire: taux, plafondHeures: plafond, du, au, journees, totalAPayer } });
  } catch (e) {
    next(e);
  }
};

/** GET /api/paie/admin/pointages?livreurId=&jour= — sessions d'une journée (pour contrôle et correction) */
export const sessionsJournee = async (req, res, next) => {
  try {
    const { livreurId, jour } = req.query;
    if (!isValidId(livreurId) || !/^\d{4}-\d{2}-\d{2}$/.test(jour)) throw erreur('Paramètres invalides', 400);
    const pointages = await prisma.pointageLivreur.findMany({ where: { livreurId, jour }, orderBy: { debut: 'asc' } });
    res.json({ success: true, data: { pointages } });
  } catch (e) {
    next(e);
  }
};

/** PATCH /api/paie/admin/pointages/:id { debut?, fin } — corrige une session non payée (oubli de fin, par exemple) */
export const corrigerPointage = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) throw erreur('Identifiant invalide', 400);
    const p = await prisma.pointageLivreur.findUnique({ where: { id } });
    if (!p) throw erreur('Session introuvable', 404);
    if (p.paieId) throw erreur('Cette session est déjà payée', 409);
    const debut = req.body?.debut ? new Date(req.body.debut) : p.debut;
    const fin = req.body?.fin ? new Date(req.body.fin) : p.fin;
    if (Number.isNaN(debut.getTime()) || !fin || Number.isNaN(fin.getTime())) throw erreur('Dates invalides', 400);
    if (fin <= debut) throw erreur('La fin doit être après le début', 400);
    if (fin.getTime() - debut.getTime() > 14 * 3600 * 1000) throw erreur('Une session ne peut pas dépasser 14 h', 400);
    if (fin.getTime() > Date.now() + 60000) throw erreur('La fin ne peut pas être dans le futur', 400);
    const maj = await prisma.pointageLivreur.update({
      where: { id },
      data: { debut, fin, jour: jourParis(debut), corrigeParId: req.utilisateur.id },
    });
    res.json({ success: true, message: 'Session corrigée', data: { pointage: maj } });
  } catch (e) {
    next(e);
  }
};

/** POST /api/paie/admin/payer { livreurId, jour, mode, note } — paie les heures non payées d'une journée */
export const payerJournee = async (req, res, next) => {
  try {
    const { livreurId, jour, mode, note } = req.body;
    if (!isValidId(livreurId) || !/^\d{4}-\d{2}-\d{2}$/.test(String(jour))) throw erreur('Livreur ou jour invalide', 400);
    if (!['especes', 'virement', 'autre'].includes(mode ?? 'especes')) throw erreur('Mode de paiement invalide', 400);
    await cloturerSessionsExpirees(livreurId);
    const [taux, plafond] = await Promise.all([tauxHoraire(), plafondHeures()]);

    const paie = await prisma.$transaction(async (tx) => {
      const sessions = await tx.pointageLivreur.findMany({ where: { livreurId, jour, paieId: null } });
      if (sessions.some((s) => !s.fin)) {
        throw erreur('Une session est encore en cours : le livreur doit la terminer (ou corrigez-la) avant le paiement', 409);
      }
      if (sessions.length === 0) throw erreur('Aucune heure à payer pour ce jour', 409);
      const brut = sessions.reduce((t, s) => t + minutesEntre(s.debut, s.fin), 0);
      // Plafond journalier : les heures déjà payées ce jour-là comptent dans la limite
      const dejaPayees = (
        await tx.pointageLivreur.findMany({ where: { livreurId, jour, paieId: { not: null } } })
      ).reduce((t, s) => t + minutesEntre(s.debut, s.fin), 0);
      const minutes = Math.max(0, Math.min(brut + dejaPayees, Math.round(plafond * 60)) - dejaPayees);
      if (minutes === 0) throw erreur(`Plafond de ${plafond} h par jour déjà atteint : rien à payer pour ce jour`, 409);
      const montant = montantPourMinutes(minutes, taux);
      const livraisons = (await livraisonsDepuis(decalerJours(60), livreurId)).filter((l) => l.jour === jour).length;
      const creee = await tx.paieLivreur.create({
        data: {
          livreurId,
          adminId: req.utilisateur.id,
          jour,
          minutes,
          tauxHoraire: taux,
          montant,
          nbLivraisons: livraisons,
          mode: mode ?? 'especes',
          note: note ? String(note).slice(0, 200) : null,
        },
      });
      const { count } = await tx.pointageLivreur.updateMany({
        where: { id: { in: sessions.map((s) => s.id) }, paieId: null },
        data: { paieId: creee.id },
      });
      if (count !== sessions.length) throw erreur('Paiement simultané détecté, réessayez', 409);
      return creee;
    });

    await pushVersUtilisateur(livreurId, {
      titre: 'Journée payée',
      corps: `${paie.montant} € pour le ${paie.jour} (${Math.floor(paie.minutes / 60)} h ${String(paie.minutes % 60).padStart(2, '0')}).`,
      url: '/livreur',
    }).catch(() => undefined);
    res.status(201).json({ success: true, message: 'Journée payée', data: { paie } });
  } catch (e) {
    next(e);
  }
};

/** GET /api/paie/admin/paiements — historique des paies */
export const listerPaies = async (req, res, next) => {
  try {
    const paies = await prisma.paieLivreur.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        livreur: { select: { nom: true, prenom: true } },
        admin: { select: { nom: true, prenom: true } },
      },
    });
    res.json({ success: true, data: { paies } });
  } catch (e) {
    next(e);
  }
};

/** PUT /api/paie/admin/taux { taux } — s'applique aux paiements futurs ; les paies déjà faites gardent leur taux */
export const definirTaux = async (req, res, next) => {
  try {
    const taux = Number(req.body?.taux);
    if (!Number.isFinite(taux) || taux < 1 || taux > 100) throw erreur('Taux horaire invalide (entre 1 et 100 €)', 400);
    const valeur = { taux: arrondir(taux) };
    await prisma.setting.upsert({ where: { cle: CLE_TAUX }, update: { valeur }, create: { cle: CLE_TAUX, valeur } });
    res.json({ success: true, message: 'Taux horaire enregistré', data: valeur });
  } catch (e) {
    next(e);
  }
};

/** PUT /api/paie/admin/plafond { heures } — plafond d'heures payées par livreur et par jour */
export const definirPlafond = async (req, res, next) => {
  try {
    const heures = Number(req.body?.heures);
    if (!Number.isFinite(heures) || heures < 1 || heures > 24) throw erreur("Plafond invalide (entre 1 et 24 h)", 400);
    const valeur = { heures: arrondir(heures) };
    await prisma.setting.upsert({ where: { cle: CLE_PLAFOND }, update: { valeur }, create: { cle: CLE_PLAFOND, valeur } });
    res.json({ success: true, message: 'Plafond enregistré', data: valeur });
  } catch (e) {
    next(e);
  }
};

/** GET /api/paie/cron — chaque jour (cron Vercel, CRON_SECRET) : clôture les sessions oubliées */
export const cronCloture = async (req, res, next) => {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.authorization !== `Bearer ${secret}`) throw erreur('Non autorisé', 401);
    const nb = await cloturerSessionsExpirees();
    res.json({ success: true, data: { sessionsCloturees: nb } });
  } catch (e) {
    next(e);
  }
};
