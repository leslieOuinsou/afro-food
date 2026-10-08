import prisma from '../lib/prisma.js';
import { isValidId } from '../utils/serialize.js';
import { arrondir, delaiAlerteHeures, plafondEspeces, syntheseLivreur } from '../utils/caisse.js';
import { pushVersRole } from '../utils/push.js';
import { envoyerEmail } from '../utils/email.js';

const erreur = (message, statusCode) => Object.assign(new Error(message), { statusCode });

const selectCommandeCaisse = {
  id: true,
  numeroCommande: true,
  total: true,
  livreurId: true,
  especesEncaissees: true,
  especesEncaisseLe: true,
  especesEcartRaison: true,
  informationsClient: true,
};

const versLigne = (c) => ({
  _id: c.id,
  numeroCommande: c.numeroCommande,
  total: c.total,
  encaisse: c.especesEncaissees,
  ecart: arrondir((c.especesEncaissees ?? 0) - c.total),
  raisonEcart: c.especesEcartRaison,
  encaisseLe: c.especesEncaisseLe,
});

/** Espèces non reversées, groupées par livreur. */
async function soldesParLivreur() {
  const [livreurs, commandes] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'livreur' },
      select: { id: true, nom: true, prenom: true, telephone: true },
      orderBy: { nom: 'asc' },
    }),
    prisma.commande.findMany({
      where: { especesStatut: 'a_reverser' },
      select: selectCommandeCaisse,
      orderBy: { especesEncaisseLe: 'asc' },
    }),
  ]);
  const maintenant = new Date();
  return livreurs.map((l) => {
    const siennes = commandes.filter((c) => c.livreurId === l.id);
    return {
      livreur: { _id: l.id, nom: l.nom, prenom: l.prenom, telephone: l.telephone },
      ...syntheseLivreur(siennes, maintenant),
      commandes: siennes.map(versLigne),
    };
  });
}

/** GET /api/caisse/livreurs — soldes de tous les livreurs (admin) */
export const listerSoldes = async (req, res, next) => {
  try {
    const livreurs = await soldesParLivreur();
    res.json({
      success: true,
      data: {
        livreurs,
        plafond: plafondEspeces(),
        delaiAlerteHeures: delaiAlerteHeures(),
        totalARecevoir: arrondir(livreurs.reduce((t, l) => t + l.solde, 0)),
      },
    });
  } catch (e) {
    next(e);
  }
};

/** GET /api/caisse/mon-solde — solde du livreur connecté */
export const monSolde = async (req, res, next) => {
  try {
    const commandes = await prisma.commande.findMany({
      where: { livreurId: req.utilisateur.id, especesStatut: 'a_reverser' },
      select: selectCommandeCaisse,
      orderBy: { especesEncaisseLe: 'asc' },
    });
    res.json({
      success: true,
      data: { ...syntheseLivreur(commandes), plafond: plafondEspeces(), commandes: commandes.map(versLigne) },
    });
  } catch (e) {
    next(e);
  }
};

/** POST /api/caisse/reversements — l'admin confirme la remise d'espèces d'un livreur */
export const creerReversement = async (req, res, next) => {
  try {
    const { livreurId, commandeIds, note } = req.body;
    if (!isValidId(livreurId) || !Array.isArray(commandeIds) || commandeIds.length === 0) {
      throw erreur('Livreur et commandes à reverser requis', 400);
    }
    const ids = [...new Set(commandeIds)];
    if (!ids.every(isValidId)) throw erreur('Identifiant de commande invalide', 400);

    const reversement = await prisma.$transaction(async (tx) => {
      const commandes = await tx.commande.findMany({
        where: { id: { in: ids }, livreurId, especesStatut: 'a_reverser' },
        select: { id: true, especesEncaissees: true },
      });
      if (commandes.length !== ids.length) {
        throw erreur('Certaines commandes ne sont plus à reverser par ce livreur', 409);
      }
      const montant = arrondir(commandes.reduce((t, c) => t + (c.especesEncaissees || 0), 0));
      const cree = await tx.reversementEspeces.create({
        data: { livreurId, adminId: req.utilisateur.id, montant, note: note ? String(note).slice(0, 300) : null },
      });
      // Garde anti-concurrence : seules les commandes encore « à reverser » passent à « reversé »
      const { count } = await tx.commande.updateMany({
        where: { id: { in: ids }, especesStatut: 'a_reverser' },
        data: { especesStatut: 'reverse', reversementId: cree.id },
      });
      if (count !== ids.length) throw erreur('Reversement simultané détecté, réessayez', 409);
      await tx.journalCaisse.create({
        data: {
          type: 'reversement',
          montant: -montant,
          livreurId,
          auteurId: req.utilisateur.id,
          reversementId: cree.id,
          note: note ? String(note).slice(0, 300) : `${ids.length} commande(s)`,
        },
      });
      return cree;
    });

    res.status(201).json({ success: true, message: 'Reversement enregistré', data: { reversement } });
  } catch (e) {
    next(e);
  }
};

/** POST /api/caisse/reversements/:id/annuler — écriture inverse, rien n'est supprimé */
export const annulerReversement = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) throw erreur('Identifiant invalide', 400);
    const motif = String(req.body?.motif ?? '').trim();
    if (motif.length < 5) throw erreur("Indiquez le motif de l'annulation", 400);

    await prisma.$transaction(async (tx) => {
      const rev = await tx.reversementEspeces.findUnique({ where: { id } });
      if (!rev) throw erreur('Reversement introuvable', 404);
      if (rev.annuleLe) throw erreur('Reversement déjà annulé', 409);
      await tx.reversementEspeces.update({ where: { id }, data: { annuleLe: new Date() } });
      await tx.commande.updateMany({
        where: { reversementId: id },
        data: { especesStatut: 'a_reverser', reversementId: null },
      });
      await tx.journalCaisse.create({
        data: {
          type: 'annulation_reversement',
          montant: rev.montant,
          livreurId: rev.livreurId,
          auteurId: req.utilisateur.id,
          reversementId: id,
          note: motif,
        },
      });
    });
    res.json({ success: true, message: 'Reversement annulé' });
  } catch (e) {
    next(e);
  }
};

/** GET /api/caisse/reversements — historique des reversements (admin) */
export const listerReversements = async (req, res, next) => {
  try {
    const reversements = await prisma.reversementEspeces.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        livreur: { select: { id: true, nom: true, prenom: true } },
        admin: { select: { id: true, nom: true, prenom: true } },
        commandes: { select: { numeroCommande: true } },
      },
    });
    res.json({ success: true, data: { reversements } });
  } catch (e) {
    next(e);
  }
};

/** GET /api/caisse/journal — journal en ajout seul (admin) */
export const lireJournal = async (req, res, next) => {
  try {
    const { livreurId } = req.query;
    const limite = Math.min(500, Math.max(1, parseInt(req.query.limite, 10) || 100));
    const lignes = await prisma.journalCaisse.findMany({
      where: livreurId && isValidId(livreurId) ? { livreurId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limite,
      include: {
        livreur: { select: { nom: true, prenom: true } },
        auteur: { select: { nom: true, prenom: true } },
        commande: { select: { numeroCommande: true } },
      },
    });
    res.json({ success: true, data: { lignes } });
  } catch (e) {
    next(e);
  }
};

/** GET /api/caisse/rapprochement?date=AAAA-MM-JJ — encaissé, reversé et reste à recevoir (admin) */
export const rapprochement = async (req, res, next) => {
  try {
    const jour = req.query.date ? new Date(`${req.query.date}T00:00:00`) : new Date();
    if (Number.isNaN(jour.getTime())) throw erreur('Date invalide', 400);
    jour.setHours(0, 0, 0, 0);
    const fin = new Date(jour.getTime() + 24 * 3600 * 1000);

    const [lignesJour, aRecevoir] = await Promise.all([
      prisma.journalCaisse.findMany({ where: { createdAt: { gte: jour, lt: fin } } }),
      prisma.commande.aggregate({
        where: { especesStatut: 'a_reverser' },
        _sum: { especesEncaissees: true },
        _count: true,
      }),
    ]);
    const somme = (type) => arrondir(lignesJour.filter((l) => l.type === type).reduce((t, l) => t + l.montant, 0));
    res.json({
      success: true,
      data: {
        date: jour.toISOString().slice(0, 10),
        encaisse: somme('encaissement'),
        reverse: arrondir(-somme('reversement')),
        annule: somme('annulation_reversement'),
        resteARecevoir: arrondir(aRecevoir._sum.especesEncaissees ?? 0),
        commandesEnAttente: aRecevoir._count,
      },
    });
  } catch (e) {
    next(e);
  }
};

/** GET /api/caisse/alerte — appelé chaque jour par le cron Vercel (CRON_SECRET) */
export const alerteSoldes = async (req, res, next) => {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.authorization !== `Bearer ${secret}`) throw erreur('Non autorisé', 401);
    const enAlerte = (await soldesParLivreur()).filter((l) => l.alerte);
    if (enAlerte.length) {
      const resume = enAlerte
        .map((l) => `${l.livreur.prenom} ${l.livreur.nom} : ${l.solde} € (depuis ${l.ageHeures} h)`)
        .join(' · ');
      await pushVersRole('admin', { titre: 'Espèces non reversées', corps: resume, url: '/admin-caisse' }).catch(() => undefined);
      const admins = await prisma.user.findMany({ where: { role: 'admin', estActif: true }, select: { email: true } });
      await Promise.all(
        admins.map((a) =>
          envoyerEmail({
            to: a.email,
            subject: 'Espèces non reversées par des livreurs',
            text: `Soldes en retard : ${resume}`,
            html: `<p><strong>Espèces non reversées depuis plus de ${delaiAlerteHeures()} h :</strong></p><p>${enAlerte
              .map((l) => `${l.livreur.prenom} ${l.livreur.nom} : <strong>${l.solde} €</strong> (depuis ${l.ageHeures} h)`)
              .join('<br />')}</p>`,
          }).catch(() => undefined)
        )
      );
    }
    res.json({ success: true, data: { livreursEnAlerte: enAlerte.length } });
  } catch (e) {
    next(e);
  }
};
