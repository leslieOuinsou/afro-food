import prisma from '../lib/prisma.js';

export const cleePublique = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Clé publique',
    data: { publicKey: process.env.VAPID_PUBLIC_KEY || null },
  });
};

export const abonner = async (req, res, next) => {
  try {
    const { endpoint, keys } = req.body?.subscription ?? req.body ?? {};
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      const error = new Error('Abonnement push invalide');
      error.statusCode = 400;
      return next(error);
    }
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { userId: req.utilisateur.id, p256dh: keys.p256dh, auth: keys.auth },
      create: { userId: req.utilisateur.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    });
    res.status(201).json({ success: true, message: 'Notifications activées', data: null });
  } catch (error) {
    next(error);
  }
};

export const desabonner = async (req, res, next) => {
  try {
    const { endpoint } = req.body ?? {};
    if (!endpoint) {
      const error = new Error('Endpoint manquant');
      error.statusCode = 400;
      return next(error);
    }
    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: req.utilisateur.id } });
    res.status(200).json({ success: true, message: 'Notifications désactivées', data: null });
  } catch (error) {
    next(error);
  }
};
