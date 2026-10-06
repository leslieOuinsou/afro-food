import prisma from '../lib/prisma.js';
import { isValidId, serialize } from '../utils/serialize.js';

function serializeMessage(msg) {
  if (!msg) return null;
  const base = serialize(msg);
  if (msg.reponses) {
    base.reponses = msg.reponses.map(serialize);
  }
  return base;
}

export const creerMessage = async (req, res, next) => {
  try {
    const { nom, email, sujet, message } = req.body;
    if (!nom || !email || !sujet || !message) {
      const error = new Error('Tous les champs (nom, email, sujet, message) sont requis');
      error.statusCode = 400;
      return next(error);
    }

    const doc = await prisma.contactMessage.create({
      data: { nom, email, sujet, message },
      include: { reponses: true },
    });

    res.status(201).json({
      success: true,
      message: 'Message envoyé avec succès. Nous vous répondrons rapidement.',
      data: { message: serializeMessage(doc) },
    });
  } catch (err) {
    next(err);
  }
};

export const obtenirMessages = async (req, res, next) => {
  try {
    const { statut, page = 1, limite = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limiteNum = Math.max(1, Math.min(100, parseInt(limite, 10) || 50));
    const where = statut ? { statut } : {};

    const [messages, total] = await Promise.all([
      prisma.contactMessage.findMany({
        where,
        include: { reponses: { orderBy: { date: 'asc' } } },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limiteNum,
        take: limiteNum,
      }),
      prisma.contactMessage.count({ where }),
    ]);

    res.json({
      success: true,
      message: 'Messages récupérés',
      data: { messages: messages.map(serializeMessage) },
      pagination: {
        page: pageNum,
        total,
        totalPages: Math.ceil(total / limiteNum),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const obtenirMessageParId = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      const error = new Error('ID de message invalide');
      error.statusCode = 400;
      return next(error);
    }

    let msg = await prisma.contactMessage.findUnique({
      where: { id },
      include: { reponses: { orderBy: { date: 'asc' } } },
    });

    if (!msg) {
      const error = new Error('Message non trouvé');
      error.statusCode = 404;
      return next(error);
    }

    if (msg.statut === 'non_lu') {
      msg = await prisma.contactMessage.update({
        where: { id },
        data: { statut: 'lu', dateLecture: new Date() },
        include: { reponses: { orderBy: { date: 'asc' } } },
      });
    }

    res.json({
      success: true,
      message: 'Message récupéré',
      data: { message: serializeMessage(msg) },
    });
  } catch (err) {
    next(err);
  }
};

export const marquerCommeLu = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      const error = new Error('ID de message invalide');
      error.statusCode = 400;
      return next(error);
    }

    const msg = await prisma.contactMessage.update({
      where: { id },
      data: { statut: 'lu', dateLecture: new Date() },
      include: { reponses: { orderBy: { date: 'asc' } } },
    });

    res.json({
      success: true,
      message: 'Message marqué comme lu',
      data: { message: serializeMessage(msg) },
    });
  } catch (err) {
    if (err.code === 'P2025') {
      const error = new Error('Message non trouvé');
      error.statusCode = 404;
      return next(error);
    }
    next(err);
  }
};

export const repondreMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { corps } = req.body;

    if (!isValidId(id)) {
      const error = new Error('ID de message invalide');
      error.statusCode = 400;
      return next(error);
    }
    if (!corps || typeof corps !== 'string' || !corps.trim()) {
      const error = new Error('Le contenu de la réponse est requis');
      error.statusCode = 400;
      return next(error);
    }

    const existant = await prisma.contactMessage.findUnique({ where: { id } });
    if (!existant) {
      const error = new Error('Message non trouvé');
      error.statusCode = 404;
      return next(error);
    }

    const nomComplet = req.utilisateur
      ? [req.utilisateur.nom, req.utilisateur.prenom].filter(Boolean).join(' ').trim() ||
        req.utilisateur.email
      : '';
    const auteur = nomComplet || 'Admin';

    const msg = await prisma.contactMessage.update({
      where: { id },
      data: {
        statut: 'repondu',
        reponses: {
          create: { corps: corps.trim(), auteur },
        },
      },
      include: { reponses: { orderBy: { date: 'asc' } } },
    });

    res.json({
      success: true,
      message: 'Réponse envoyée',
      data: { message: serializeMessage(msg) },
    });
  } catch (err) {
    next(err);
  }
};
