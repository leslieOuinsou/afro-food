import Stripe from 'stripe';
import prisma from '../lib/prisma.js';
import { isValidId } from '../utils/serialize.js';
import { envoyerEmailStatutCommande } from '../utils/email.js';
import { offrirRecompense } from '../utils/recompenses.js';
import { genererRecuPdf } from '../utils/recuPaiement.js';
import { envoyerEmailPaiementStripeVirement } from '../utils/email.js';

let stripe = null;
function getStripe() {
  if (stripe) return stripe;
  if (!process.env.STRIPE_SECRET_KEY) return null;
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripe;
}

const erreur = (message, statusCode) => Object.assign(new Error(message), { statusCode });

/** GET /api/paiements/config — le frontend sait si le paiement en ligne est actif */
export const configPaiement = (req, res) => {
  res.json({
    success: true,
    data: {
      stripeActif: Boolean(getStripe()),
      // Mode test : le frontend affiche la carte de test (jamais avec une clé sk_live_)
      stripeTest: (process.env.STRIPE_SECRET_KEY || '').startsWith('sk_test_'),
    },
  });
};

/** POST /api/paiements/session { commandeId } → { url } vers Stripe Checkout */
export const creerSessionPaiement = async (req, res, next) => {
  try {
    const client = getStripe();
    if (!client) throw erreur('Paiement en ligne non configuré', 503);

    const { commandeId } = req.body;
    if (!isValidId(commandeId)) throw erreur('ID de commande invalide', 400);

    const commande = await prisma.commande.findUnique({ where: { id: commandeId } });
    if (!commande || commande.clientId !== req.utilisateur.id) {
      throw erreur('Commande non trouvée', 404);
    }
    if (!['carte', 'virement'].includes(commande.methodePaiement)) {
      throw erreur('Cette commande ne se paie pas en ligne', 400);
    }
    if (commande.statutPaiement !== 'en_attente') throw erreur('Cette commande est déjà réglée', 409);
    if (commande.methodePaiement === 'virement' && commande.paiement?.stripe) {
      throw erreur('Le paiement en ligne de cette commande est déjà enregistré', 409);
    }
    if (commande.statut === 'annulee') throw erreur('Commande annulée', 400);

    const front = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const session = await client.checkout.sessions.create({
      mode: 'payment',
      customer_email: commande.informationsClient?.email,
      client_reference_id: commande.id,
      metadata: { commandeId: commande.id, mode: commande.methodePaiement },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: (process.env.STRIPE_CURRENCY || 'eur').toLowerCase(),
            unit_amount: Math.round(commande.total * 100),
            product_data: { name: `Commande ${commande.numeroCommande} — Afro-food` },
          },
        },
      ],
      success_url: `${front}/commande/${commande.id}?paiement=ok`,
      cancel_url: `${front}/commande/${commande.id}?paiement=annule`,
    });

    await prisma.commande.update({
      where: { id: commande.id },
      data: { paiementReference: session.id },
    });

    res.json({ success: true, data: { url: session.url } });
  } catch (error) {
    next(error);
  }
};

export async function marquerPaye(commandeId, reference, commentaire = 'Paiement par carte reçu', messageClient = 'Paiement reçu, merci !') {
  const commande = await prisma.commande.findUnique({ where: { id: commandeId } });
  if (!commande || commande.statutPaiement === 'valide') return; // idempotent

  const confirmer = commande.statut === 'en_attente';
  const maj = await prisma.commande.update({
    where: { id: commande.id },
    data: {
      statutPaiement: 'valide',
      paiementReference: reference,
      paiement: { ...(commande.paiement || {}), statut: 'valide', reference },
      ...(confirmer && {
        statut: 'confirmee',
        dates: { ...(commande.dates || {}), confirmation: new Date().toISOString() },
        historiqueStatuts: {
          create: { statut: 'confirmee', commentaire },
        },
      }),
    },
  });

  const email = maj.informationsClient?.email;
  if (confirmer && email) {
    await envoyerEmailStatutCommande(email, maj, messageClient).catch((e) =>
      console.warn('Email paiement non envoyé:', e.message)
    );
  }
  if (confirmer) await offrirRecompense(maj);
}

/** PATCH /api/paiements/:commandeId/virement-recu — l'admin confirme avoir reçu le virement */
export const confirmerVirementRecu = async (req, res, next) => {
  try {
    const { commandeId } = req.params;
    if (!isValidId(commandeId)) throw erreur('ID de commande invalide', 400);
    const commande = await prisma.commande.findUnique({ where: { id: commandeId } });
    if (!commande) throw erreur('Commande non trouvée', 404);
    if (commande.methodePaiement !== 'virement') throw erreur("Cette commande n'est pas payée par virement", 400);
    if (commande.statutPaiement === 'valide') throw erreur('Le virement est déjà confirmé', 409);
    if (['annulee', 'remboursee'].includes(commande.statut)) throw erreur('Commande annulée ou remboursée', 400);
    const reference = String(req.body?.reference ?? '').trim().slice(0, 120) || `virement-${commande.numeroCommande}`;
    await marquerPaye(commandeId, reference, `Virement reçu (confirmé par l'administration)`, 'Votre virement est bien reçu, merci !');
    res.json({ success: true, message: 'Virement confirmé' });
  } catch (e) {
    next(e);
  }
};

/**
 * Virement : le client a payé sur Stripe. On garde la preuve du paiement mais la commande n'est PAS validée :
 * l'administration vérifie d'abord le justificatif que le client lui envoie.
 */
async function enregistrerPaiementVirement(commandeId, session) {
  const commande = await prisma.commande.findUnique({ where: { id: commandeId } });
  if (!commande || commande.methodePaiement !== 'virement' || commande.paiement?.stripe) return; // idempotent
  const payeLe = new Date().toISOString();
  const maj = await prisma.commande.update({
    where: { id: commandeId },
    data: {
      paiementReference: session.id,
      paiement: { ...(commande.paiement || {}), stripe: { reference: session.id, payeLe } },
    },
  });
  const email = maj.informationsClient?.email;
  if (email) {
    await envoyerEmailPaiementStripeVirement(email, maj).catch((e) =>
      console.warn('Email paiement virement non envoyé:', e.message)
    );
  }
}

/** GET /api/paiements/:commandeId/justificatif.pdf — reçu PDF du client (ou de l'admin) */
export const telechargerRecu = async (req, res, next) => {
  try {
    const { commandeId } = req.params;
    if (!isValidId(commandeId)) throw erreur('ID de commande invalide', 400);
    const commande = await prisma.commande.findUnique({ where: { id: commandeId } });
    if (!commande) throw erreur('Commande non trouvée', 404);
    if (req.utilisateur.role !== 'admin' && commande.clientId !== req.utilisateur.id) throw erreur('Non autorisé', 403);
    const stripe = commande.paiement?.stripe;
    if (!stripe) throw erreur("Aucun paiement en ligne enregistré pour cette commande", 404);
    const pdf = await genererRecuPdf(commande, stripe);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="justificatif-${commande.numeroCommande}.pdf"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.end(pdf);
  } catch (e) {
    next(e);
  }
};

async function marquerEchec(commandeId) {
  await prisma.commande.updateMany({
    where: { id: commandeId, statutPaiement: 'en_attente' },
    data: { statutPaiement: 'echec' },
  });
}

/** POST /api/paiements/webhook — appelé par Stripe (corps brut requis, voir server.js) */
export const webhookStripe = async (req, res) => {
  const client = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!client || !secret) return res.status(503).json({ success: false, message: 'Webhook non configuré' });

  let event;
  try {
    event = client.webhooks.constructEvent(req.rawBody, req.headers['stripe-signature'], secret);
  } catch (err) {
    return res.status(400).json({ success: false, message: `Signature invalide : ${err.message}` });
  }

  try {
    const session = event.data.object;
    const commandeId = session.metadata?.commandeId;
    if (commandeId) {
      if (event.type === 'checkout.session.completed' && session.payment_status === 'paid') {
        if (session.metadata?.mode === 'virement') await enregistrerPaiementVirement(commandeId, session);
        else await marquerPaye(commandeId, session.id);
      } else if (event.type === 'checkout.session.expired') {
        await marquerEchec(commandeId);
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook Stripe — erreur de traitement:', err);
    res.status(500).json({ success: false, message: 'Erreur de traitement' }); // Stripe réessaiera
  }
};
