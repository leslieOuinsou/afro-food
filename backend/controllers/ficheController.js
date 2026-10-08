import prisma from '../lib/prisma.js';
import { isValidId } from '../utils/serialize.js';
import { pushVersUtilisateur } from '../utils/push.js';
import { arrondir } from '../utils/paie.js';
import { genererFichePaiePdf } from '../utils/fichePaie.js';
import { chargerSignature, idSignatureActive } from '../utils/signature.js';
import { envoyerEmailFichePaie } from '../utils/email.js';

const erreur = (message, statusCode) => Object.assign(new Error(message), { statusCode });
const JOUR = /^\d{4}-\d{2}-\d{2}$/;

const numeroFiche = (au, id) => `FP-${au.slice(0, 7).replace('-', '')}-${id.slice(-5).toUpperCase()}`;

/** POST /api/paie/admin/fiches { livreurId?, du, au } — émet les fiches de rémunération (un livreur, ou tous) */
export const emettreFiches = async (req, res, next) => {
  try {
    const { livreurId, du, au } = req.body;
    if (!JOUR.test(String(du)) || !JOUR.test(String(au)) || du > au) throw erreur('Période invalide', 400);
    if (livreurId && !isValidId(livreurId)) throw erreur('Livreur invalide', 400);

    const paies = await prisma.paieLivreur.findMany({
      where: { ficheId: null, jour: { gte: du, lte: au }, ...(livreurId ? { livreurId } : {}) },
      orderBy: { jour: 'asc' },
    });
    if (paies.length === 0) throw erreur('Aucune journée payée à inclure sur cette période (ou déjà incluse dans une fiche)', 409);

    const signatureId = await idSignatureActive(prisma);
    const parLivreur = new Map();
    for (const p of paies) parLivreur.set(p.livreurId, [...(parLivreur.get(p.livreurId) ?? []), p]);

    const fiches = [];
    for (const [idLivreur, lignes] of parLivreur) {
      const fiche = await prisma.$transaction(async (tx) => {
        const creee = await tx.fichePaie.create({
          data: {
            numero: `FP-TMP-${Date.now()}-${idLivreur.slice(-4)}`,
            livreurId: idLivreur,
            adminId: req.utilisateur.id,
            du,
            au,
            totalMinutes: lignes.reduce((t, p) => t + p.minutes, 0),
            totalMontant: arrondir(lignes.reduce((t, p) => t + p.montant, 0)),
            nbLivraisons: lignes.reduce((t, p) => t + p.nbLivraisons, 0),
            signatureId,
          },
        });
        const final = await tx.fichePaie.update({ where: { id: creee.id }, data: { numero: numeroFiche(au, creee.id) } });
        const { count } = await tx.paieLivreur.updateMany({
          where: { id: { in: lignes.map((p) => p.id) }, ficheId: null },
          data: { ficheId: final.id },
        });
        if (count !== lignes.length) throw erreur('Émission simultanée détectée, réessayez', 409);
        return final;
      });
      fiches.push(fiche);

      const livreur = await prisma.user.findUnique({ where: { id: idLivreur }, select: { email: true, prenom: true } });
      await pushVersUtilisateur(idLivreur, {
        titre: 'Nouvelle fiche de rémunération',
        corps: `${fiche.totalMontant} € pour la période du ${du} au ${au}.`,
        url: '/livreur',
      }).catch(() => undefined);
      if (livreur?.email) await envoyerEmailFichePaie(livreur.email, livreur.prenom, fiche).catch(() => undefined);
    }
    res.status(201).json({ success: true, message: `${fiches.length} fiche(s) envoyée(s)`, data: { fiches } });
  } catch (e) {
    next(e);
  }
};

/** GET /api/paie/admin/fiches — toutes les fiches émises */
export const listerFiches = async (req, res, next) => {
  try {
    const fiches = await prisma.fichePaie.findMany({
      orderBy: { envoyeLe: 'desc' },
      take: 200,
      include: { livreur: { select: { nom: true, prenom: true } } },
    });
    res.json({ success: true, data: { fiches } });
  } catch (e) {
    next(e);
  }
};

/** GET /api/paie/mes-fiches — fiches du livreur connecté */
export const mesFiches = async (req, res, next) => {
  try {
    const fiches = await prisma.fichePaie.findMany({
      where: { livreurId: req.utilisateur.id },
      orderBy: { envoyeLe: 'desc' },
      take: 60,
    });
    res.json({ success: true, data: { fiches } });
  } catch (e) {
    next(e);
  }
};

/** GET /api/paie/fiches/:id/pdf — PDF de la fiche (livreur concerné ou admin) */
export const pdfFiche = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) throw erreur('Identifiant invalide', 400);
    const fiche = await prisma.fichePaie.findUnique({
      where: { id },
      include: { paies: true, livreur: { select: { nom: true, prenom: true, email: true, telephone: true } } },
    });
    if (!fiche) throw erreur('Fiche introuvable', 404);
    const estAdmin = req.utilisateur.role === 'admin';
    if (!estAdmin && fiche.livreurId !== req.utilisateur.id) throw erreur('Non autorisé', 403);

    const pdf = await genererFichePaiePdf(fiche, fiche.paies, fiche.livreur, await chargerSignature(prisma, fiche.signatureId));
    if (!estAdmin && !fiche.luLe) {
      await prisma.fichePaie.updateMany({ where: { id, luLe: null }, data: { luLe: new Date() } });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="fiche-${fiche.numero}.pdf"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.end(pdf);
  } catch (e) {
    next(e);
  }
};
