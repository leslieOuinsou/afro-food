import prisma from '../lib/prisma.js';
import { serialize } from '../utils/serialize.js';

/**
 * POST /api/newsletter
 * Body: { email }
 */
export const subscribe = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      const error = new Error('Adresse e-mail invalide');
      error.statusCode = 400;
      return next(error);
    }

    const emailNorm = email.toLowerCase().trim();

    const existant = await prisma.newsletterSubscriber.findUnique({
      where: { email: emailNorm },
    });

    if (existant) {
      if (!existant.actif) {
        const reactive = await prisma.newsletterSubscriber.update({
          where: { email: emailNorm },
          data: { actif: true },
        });
        return res.status(200).json({
          success: true,
          message: 'Inscription à la newsletter réactivée',
          data: { subscriber: serialize(reactive) },
        });
      }
      return res.status(200).json({
        success: true,
        message: 'Vous êtes déjà inscrit à la newsletter',
        data: { subscriber: serialize(existant) },
      });
    }

    const subscriber = await prisma.newsletterSubscriber.create({
      data: { email: emailNorm, actif: true },
    });

    res.status(201).json({
      success: true,
      message: 'Inscription à la newsletter réussie',
      data: { subscriber: serialize(subscriber) },
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(200).json({
        success: true,
        message: 'Vous êtes déjà inscrit à la newsletter',
        data: null,
      });
    }
    next(error);
  }
};
