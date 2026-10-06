import webpush from 'web-push';
import prisma from '../lib/prisma.js';

let configure = false;

function pretPourPush() {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;
  if (!configure) {
    webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:contact@afro-food.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    configure = true;
  }
  return true;
}

async function envoyerAuxAbonnements(abonnements, payload) {
  if (!abonnements.length || !pretPourPush()) return { envoyes: 0 };
  const corps = JSON.stringify(payload);
  let envoyes = 0;
  await Promise.all(
    abonnements.map(async (a) => {
      try {
        await webpush.sendNotification(
          { endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } },
          corps,
          { TTL: 60 * 60 }
        );
        envoyes += 1;
      } catch (err) {
        // Abonnement expiré ou révoqué : on le supprime
        if (err.statusCode === 404 || err.statusCode === 410) {
          await prisma.pushSubscription.deleteMany({ where: { endpoint: a.endpoint } }).catch(() => undefined);
        } else {
          console.warn('Push non envoyé:', err.statusCode || err.message);
        }
      }
    })
  );
  return { envoyes };
}

/** payload : { titre, corps, url } */
export async function pushVersUtilisateur(userId, payload) {
  if (!userId) return { envoyes: 0 };
  const abonnements = await prisma.pushSubscription.findMany({ where: { userId } });
  return envoyerAuxAbonnements(abonnements, payload);
}

export async function pushVersRole(role, payload) {
  const abonnements = await prisma.pushSubscription.findMany({
    where: { user: { role, estActif: true } },
  });
  return envoyerAuxAbonnements(abonnements, payload);
}
