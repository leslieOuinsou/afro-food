import Stripe from 'stripe';
import prisma from '../lib/prisma.js';
import { isValidId } from '../utils/serialize.js';
import { envoyerEmailStatutCommande } from '../utils/email.js';
import { offrirRecompense } from '../utils/recompenses.js';

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
  res.json({ success: true, data: { stripeActif: Boolean(getStripe()) } });
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
    if (commande.methodePaiement !== 'carte') throw erreur('Cette commande ne se paie pas par carte', 400);
    if (commande.statutPaiement !== 'en_attente') throw erreur('Cette commande est déjà réglée', 409);
    if (commande.statut === 'annulee') throw erreur('Commande annulée', 400);

    const front = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const session = await client.checkout.sessions.create({
      mode: 'payment',
      customer_email: commande.informationsClient?.email,
      client_reference_id: commande.id,
      metadata: { commandeId: commande.id },
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

async function marquerPaye(commandeId, reference) {
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
          create: { statut: 'confirmee', commentaire: 'Paiement par carte reçu' },
        },
      }),
    },
  });

  const email = maj.informationsClient?.email;
  if (confirmer && email) {
    await envoyerEmailStatutCommande(email, maj, 'Paiement reçu, merci !').catch((e) =>
      console.warn('Email paiement non envoyé:', e.message)
    );
  }
  if (confirmer) await offrirRecompense(maj);
}

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
        await marquerPaye(commandeId, session.id);
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
