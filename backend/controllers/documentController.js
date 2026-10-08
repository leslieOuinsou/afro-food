import prisma from '../lib/prisma.js';
import { isValidId } from '../utils/serialize.js';
import { codeVerification } from '../utils/recuPaiement.js';
import { marquerPaye } from './paiementController.js';
import { pushVersUtilisateur } from '../utils/push.js';

const erreur = (message, statusCode) => Object.assign(new Error(message), { statusCode });

/** GET /api/documents?statut=en_attente|valide|refuse — documents reçus des clients (admin) */
export const listerDocuments = async (req, res, next) => {
  try {
    const { statut } = req.query;
    const documents = await prisma.justificatifVirement.findMany({
      where: ['en_attente', 'valide', 'refuse'].includes(statut) ? { statut } : undefined,
      orderBy: [{ createdAt: 'desc' }],
      take: 200,
      select: {
        id: true,
        nom: true,
        mime: true,
        taille: true,
        statut: true,
        motifRefus: true,
        traiteLe: true,
        createdAt: true,
        commande: {
          select: {
            id: true,
            numeroCommande: true,
            total: true,
            statut: true,
            statutPaiement: true,
            paiement: true,
            informationsClient: true,
          },
        },
      },
    });
    const lignes = documents.map((d) => {
      const c = d.commande;
      const stripe = c.paiement?.stripe ?? null;
      return {
        id: d.id,
        nom: d.nom,
        mime: d.mime,
        taille: d.taille,
        statut: d.statut,
        motifRefus: d.motifRefus,
        traiteLe: d.traiteLe,
        createdAt: d.createdAt,
        commande: {
          _id: c.id,
          numeroCommande: c.numeroCommande,
          total: c.total,
          statut: c.statut,
          statutPaiement: c.statutPaiement,
          client: [c.informationsClient?.prenom, c.informationsClient?.nom].filter(Boolean).join(' '),
          email: c.informationsClient?.email,
        },
        // Contrôle automatique : le serveur sait si Stripe a bien confirmé le paiement de cette commande
        verification: {
          paiementStripe: Boolean(stripe),
          payeLe: stripe?.payeLe ?? null,
          referenceStripe: stripe?.reference ?? null,
          codeAttendu: stripe ? codeVerification({ numeroCommande: c.numeroCommande, total: c.total }, stripe.reference) : null,
        },
      };
    });
    res.json({ success: true, data: { documents: lignes } });
  } catch (e) {
    next(e);
  }
};

/** POST /api/documents/:jid/valider — l'admin valide : le paiement est confirmé et la commande avance */
export const validerDocument = async (req, res, next) => {
  try {
    const { jid } = req.params;
    if (!isValidId(jid)) throw erreur('ID invalide', 400);
    const doc = await prisma.justificatifVirement.findUnique({ where: { id: jid }, include: { commande: true } });
    if (!doc) throw erreur('Document introuvable', 404);
    if (doc.statut === 'valide') throw erreur('Document déjà validé', 409);
    const c = doc.commande;
    if (c.methodePaiement !== 'virement') throw erreur("Cette commande n'est pas payée par virement", 400);
    if (['annulee', 'remboursee'].includes(c.statut)) throw erreur('Commande annulée ou remboursée', 400);

    await prisma.justificatifVirement.update({
      where: { id: jid },
      data: { statut: 'valide', motifRefus: null, traiteLe: new Date(), traiteParId: req.utilisateur.id },
    });
    if (c.statutPaiement !== 'valide') {
      await marquerPaye(
        c.id,
        c.paiement?.stripe?.reference || `virement-${c.numeroCommande}`,
        'Justificatif de paiement validé par l’administration',
        'Votre justificatif est validé, votre commande va être préparée.'
      );
    }
    res.json({ success: true, message: 'Document validé, commande confirmée' });
  } catch (e) {
    next(e);
  }
};

/** POST /api/documents/:jid/refuser { motif } */
export const refuserDocument = async (req, res, next) => {
  try {
    const { jid } = req.params;
    if (!isValidId(jid)) throw erreur('ID invalide', 400);
    const motif = String(req.body?.motif ?? '').trim();
    if (motif.length < 5) throw erreur('Indiquez le motif du refus (5 caractères minimum)', 400);
    const doc = await prisma.justificatifVirement.findUnique({ where: { id: jid }, include: { commande: true } });
    if (!doc) throw erreur('Document introuvable', 404);
    if (doc.statut === 'valide') throw erreur('Document déjà validé', 409);
    await prisma.justificatifVirement.update({
      where: { id: jid },
      data: { statut: 'refuse', motifRefus: motif.slice(0, 300), traiteLe: new Date(), traiteParId: req.utilisateur.id },
    });
    await pushVersUtilisateur(doc.commande.clientId, {
      titre: 'Justificatif refusé',
      corps: `Commande ${doc.commande.numeroCommande} : ${motif.slice(0, 100)}`,
      url: `/commande/${doc.commande.id}`,
    }).catch(() => undefined);
    res.json({ success: true, message: 'Document refusé' });
  } catch (e) {
    next(e);
  }
};
